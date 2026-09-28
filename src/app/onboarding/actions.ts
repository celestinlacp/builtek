'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export async function createWorkspace(formData: FormData) {
  // 1. Verificar sesión con cliente normal
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  // 2. Usar service role para bypass de RLS en operaciones de servidor
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const name = (formData.get('workspace_name') as string).trim()
  const slug = toSlug(name) + '-' + Math.random().toString(36).slice(2, 6)

  const { data: workspace, error: wsError } = await admin
    .from('workspaces')
    .insert({ name, slug, owner_id: user.id, plan: 'free' })
    .select('id')
    .single()

  if (wsError) return { error: wsError.message }

  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

  if (memberError) return { error: memberError.message }

  // Contar workspaces totales para incluir en la alerta
  const { count } = await admin
    .from('workspaces')
    .select('id', { count: 'exact', head: true })

  // Alerta silenciosa a Celestin
  await resend.emails.send({
    from: 'Builtek <hola@builtek.app>',
    to: ['celestinlacp@gmail.com'],
    subject: `[Builtek] ⚠️ Nuevo workspace creado: ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
        <div style="background: #1A2744; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">⚠️ Nuevo workspace en Builtek</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px; width: 140px;">Workspace</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px; font-weight: 600; color: #1A2744;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px;">Correo del owner</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px; color: #1A2744;">${user.email ?? '—'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px;">Workspace ID</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 11px; color: #6c757d; font-family: monospace;">${workspace.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6c757d; font-size: 13px;">Total workspaces</td>
            <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: ${(count ?? 0) > 1 ? '#dc3545' : '#198754'};">${count ?? '?'} en total</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 14px; background: #fff3cd; border-radius: 8px; border-left: 3px solid #ffc107;">
          <p style="margin: 0; font-size: 12px; color: #856404;">Revisa si este workspace debe existir. Si es un registro no autorizado, elimínalo desde el panel de Supabase.</p>
        </div>
        <p style="margin-top: 16px; font-size: 11px; color: #adb5bd;">Onboarding Builtek · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
      </div>
    `,
  }).catch(() => { /* no bloquear el flujo si el email falla */ })

  return { success: true }
}
