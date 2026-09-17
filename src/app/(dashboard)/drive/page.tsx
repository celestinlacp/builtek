import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrivePanel from './DrivePanel'

export default async function DrivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const workspace = membership.workspaces as unknown as { id: string; name: string }

  return (
    <DrivePanel
      workspaceId={workspace.id}
      userRole={membership.role}
    />
  )
}
