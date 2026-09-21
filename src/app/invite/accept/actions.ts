'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const admin = getAdminClient()

  // Fetch the invite
  const { data: invite, error: fetchError } = await admin
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, accepted_at')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (fetchError || !invite) return { error: 'Invitación inválida o ya utilizada' }

  // Check if email matches (optional but recommended)
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: 'Esta invitación fue enviada a otra dirección de correo' }
  }

  // Check if already a member
  const { data: existing } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Already a member — just mark invite accepted and redirect
    await admin
      .from('workspace_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
    redirect('/dashboard')
  }

  // Add to workspace
  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role,
    })

  if (memberError) return { error: memberError.message }

  // Mark invite accepted
  await admin
    .from('workspace_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect('/dashboard')
}
