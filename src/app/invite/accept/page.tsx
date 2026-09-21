import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AcceptInvitePanel from './AcceptInvitePanel'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/')

  const admin = getAdminClient()

  // Load invite + workspace name
  const { data: invite } = await admin
    .from('workspace_invitations')
    .select('id, email, role, accepted_at, workspace:workspaces(name)')
    .eq('token', token)
    .single()

  if (!invite || invite.accepted_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-300 font-bold text-xl">B</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A2744] mb-2">Invitación no válida</h1>
          <p className="text-slate-400 text-sm">
            Este enlace de invitación ya fue utilizado o ha expirado.
          </p>
          <a href="/login" className="mt-6 inline-block text-[#00C2FF] text-sm font-medium hover:underline">
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const workspaceName = (invite.workspace as any)?.name ?? 'tu workspace'

  return (
    <AcceptInvitePanel
      token={token}
      workspaceName={workspaceName}
      role={invite.role}
      isLoggedIn={!!user}
    />
  )
}
