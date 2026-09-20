import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

const MOCK_WORKSPACE = { id: 'dev', name: 'Builtek Dev', features: {} as Record<string, boolean> }
const MOCK_USER = 'Celestin'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let workspace = MOCK_WORKSPACE
  let fullName = MOCK_USER

  if (process.env.BYPASS_AUTH !== 'true') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, features)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) redirect('/onboarding')

    workspace = membership.workspaces as unknown as { id: string; name: string; features: Record<string, boolean> }
    fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar workspaceName={workspace.name} features={workspace.features} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userName={fullName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
