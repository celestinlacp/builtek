import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { trialDay10Html } from '@/lib/emails/trial-day10'
import { trialDay13Html } from '@/lib/emails/trial-day13'
import { trialDay14Html } from '@/lib/emails/trial-day14'
import { trialDay21Html } from '@/lib/emails/trial-day21'
import { inviteDay7Html } from '@/lib/emails/invite-day7'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.mx').replace(/\/$/, '')

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const emailsSent: string[] = []

  // ── 1. Expire trials ─────────────────────────────────────────────────────
  const { data: expired, error: expireError } = await admin
    .from('workspaces')
    .update({ status: 'trial_expired' })
    .lt('trial_ends_at', new Date().toISOString())
    .eq('status', 'active')
    .eq('plan', 'obra')
    .select('id')

  const expiredCount = expired?.length ?? 0
  if (expireError) console.error('expire-trials error:', expireError)

  // ── 2. Email sequences ───────────────────────────────────────────────────
  // Fetch all workspaces with active trials + recent expired ones for email logic
  const { data: workspaces } = await admin
    .from('workspaces')
    .select(`
      id, name, owner_id, trial_ends_at,
      email_day10_sent, email_day13_sent, email_day14_sent, email_day21_sent
    `)
    .not('trial_ends_at', 'is', null)
    .in('status', ['active', 'trial_expired'])

  if (workspaces) {
    // Get owner emails from auth
    const ownerIds = workspaces.map(w => w.owner_id).filter(Boolean)
    const { data: authUsersRes } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const authUserMap: Record<string, { email?: string }> = Object.fromEntries(
      (authUsersRes?.users || []).map(u => [u.id, { email: u.email }])
    )

    // Get owner names from profiles
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    const profileMap: Record<string, string> = Object.fromEntries(
      (profiles || []).map(p => [p.id, p.full_name || 'Usuario'])
    )

    const now = new Date()

    for (const ws of workspaces) {
      const ownerEmail = authUserMap[ws.owner_id]?.email
      const ownerName = profileMap[ws.owner_id] || 'Usuario'
      if (!ownerEmail) continue

      const trialEndsAt = new Date(ws.trial_ends_at)

      // Day 10: trial_ends_at - 4 days <= now
      const day10Threshold = new Date(trialEndsAt.getTime() - 4 * 24 * 60 * 60 * 1000)
      if (now >= day10Threshold && !ws.email_day10_sent) {
        const { error } = await resend.emails.send({
          from: 'Luis Celestin <luis@builtek.mx>',
          to: ownerEmail,
          subject: 'Te quedan 4 días en Builtek',
          html: trialDay10Html(ownerName, APP_URL),
        })
        if (!error) {
          await admin.from('workspaces').update({ email_day10_sent: now.toISOString() }).eq('id', ws.id)
          emailsSent.push(`day10:${ownerEmail}`)
        }
      }

      // Day 13: trial_ends_at - 1 day <= now
      const day13Threshold = new Date(trialEndsAt.getTime() - 1 * 24 * 60 * 60 * 1000)
      if (now >= day13Threshold && !ws.email_day13_sent) {
        const { error } = await resend.emails.send({
          from: 'Luis Celestin <luis@builtek.mx>',
          to: ownerEmail,
          subject: 'Mañana vence tu prueba',
          html: trialDay13Html(ownerName, APP_URL),
        })
        if (!error) {
          await admin.from('workspaces').update({ email_day13_sent: now.toISOString() }).eq('id', ws.id)
          emailsSent.push(`day13:${ownerEmail}`)
        }
      }

      // Day 14: trial_ends_at <= now
      if (now >= trialEndsAt && !ws.email_day14_sent) {
        const { error } = await resend.emails.send({
          from: 'Luis Celestin <luis@builtek.mx>',
          to: ownerEmail,
          subject: 'Tu prueba venció — tus datos están seguros',
          html: trialDay14Html(ownerName, APP_URL),
        })
        if (!error) {
          await admin.from('workspaces').update({ email_day14_sent: now.toISOString() }).eq('id', ws.id)
          emailsSent.push(`day14:${ownerEmail}`)
        }
      }

      // Day 21: trial_ends_at + 7 days <= now
      const day21Threshold = new Date(trialEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      if (now >= day21Threshold && !ws.email_day21_sent) {
        const { error } = await resend.emails.send({
          from: 'Luis Celestin <luis@builtek.mx>',
          to: ownerEmail,
          subject: '¿Seguiste adelante con tu proyecto?',
          html: trialDay21Html(ownerName, APP_URL),
        })
        if (!error) {
          await admin.from('workspaces').update({ email_day21_sent: now.toISOString() }).eq('id', ws.id)
          emailsSent.push(`day21:${ownerEmail}`)
        }
      }
    }
  }

  // ── 3. Invite day 7 emails ───────────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: pendingInviteEmails } = await admin
    .from('invite_links')
    .select('id, recipient_name, recipient_company, used_by_workspace, created_at')
    .eq('status', 'used')
    .is('email_invite_day7_sent', null)
    .lte('created_at', sevenDaysAgo)
    .not('used_by_workspace', 'is', null)

  if (pendingInviteEmails) {
    for (const invite of pendingInviteEmails) {
      if (!invite.used_by_workspace) continue

      // Get workspace owner email
      const { data: ws } = await admin
        .from('workspaces')
        .select('owner_id')
        .eq('id', invite.used_by_workspace)
        .single()
      if (!ws) continue

      const { data: authUsersRes } = await admin.auth.admin.getUserById(ws.owner_id)
      const ownerEmail = authUsersRes?.user?.email
      if (!ownerEmail) continue

      const { error } = await resend.emails.send({
        from: 'Luis Celestin <luis@builtek.mx>',
        to: ownerEmail,
        subject: `Tus sesiones de personalización en Builtek, ${invite.recipient_name}`,
        html: inviteDay7Html(invite.recipient_name, invite.recipient_company, ownerEmail, APP_URL),
      })
      if (!error) {
        await admin
          .from('invite_links')
          .update({ email_invite_day7_sent: new Date().toISOString() })
          .eq('id', invite.id)
        emailsSent.push(`invite_day7:${ownerEmail}`)
      }
    }
  }

  return NextResponse.json({
    updated: expiredCount,
    emails_sent: emailsSent,
  })
}
