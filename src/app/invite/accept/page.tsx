import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect('/login?error=invalid_invite')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // No debería ocurrir (el callback de auth lo maneja), pero por seguridad:
    redirect(`/login?next=/invite/accept?token=${token}`)
  }

  const admin = getAdminClient()

  // Buscar la invitación por token
  const { data: invite, error: inviteError } = await admin
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, accepted_at')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    redirect('/dashboard?error=invite_not_found')
  }

  if (invite.accepted_at) {
    // Ya fue aceptada — redirigir al workspace
    redirect('/dashboard?info=invite_already_accepted')
  }

  // Verificar que el email del usuario coincide con la invitación
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    redirect(`/login?error=invite_email_mismatch`)
  }

  // Agregar al usuario como miembro del workspace
  const { error: memberError } = await admin
    .from('workspace_members')
    .upsert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role,
    }, { onConflict: 'workspace_id,user_id' })

  if (memberError) {
    redirect('/dashboard?error=invite_join_failed')
  }

  // Marcar invitación como aceptada
  await admin
    .from('workspace_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect('/dashboard?welcome=1')
}
