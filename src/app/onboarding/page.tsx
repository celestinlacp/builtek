import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

const MASTER_ADMIN_EMAIL = (process.env.MASTER_ADMIN_EMAIL ?? 'celestinlacp@gmail.com').trim().toLowerCase()

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Ya tiene workspace → dashboard
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) redirect('/dashboard')

  // Master admin puede crear workspaces libremente
  const isMasterAdmin = user.email?.trim().toLowerCase() === MASTER_ADMIN_EMAIL

  if (!isMasterAdmin) {
    // Verificar si tiene invitación pendiente
    const { data: invite } = await supabase
      .from('workspace_invitations')
      .select('id')
      .eq('email', user.email!)
      .is('accepted_at', null)
      .limit(1)
      .single()

    if (!invite) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-[#1A2744] rounded-lg flex items-center justify-center">
              <span className="text-[#00C2FF] font-black text-lg">B</span>
            </div>
            <span className="text-[#1A2744] font-bold text-xl">Builtek</span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-md text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-[#1A2744] mb-2">Acceso por invitación</h1>
            <p className="text-slate-500 text-sm mb-1">
              Para unirte a Builtek necesitas una invitación de tu administrador.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              Cuenta: <span className="text-slate-600">{user.email}</span>
            </p>
          </div>
        </div>
      )
    }
  }

  return <OnboardingForm />
}
