import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import AdminPanel from './AdminPanel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const wsId = membership.workspace_id

  const [workspaceRes, projectsRes, membersRes, myRoleRes, invitesRes] = await Promise.all([
    supabase.from('workspaces').select('*, dropbox_token').eq('id', wsId).single(),
    supabase.from('projects')
      .select('id, name, description, status, workspace_id, start_date, end_date, created_at')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false }),
    supabase.from('workspace_members')
      .select('workspace_id, user_id, role, joined_at, user:profiles(id, full_name, avatar_url)')
      .eq('workspace_id', wsId)
      .order('joined_at', { ascending: true }),
    supabase.from('workspace_members')
      .select('role')
      .eq('workspace_id', wsId)
      .eq('user_id', user.id)
      .single(),
    supabase.from('workspace_invitations')
      .select('id, email, role, created_at, accepted_at')
      .eq('workspace_id', wsId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
  ])

  if (!workspaceRes.data) redirect('/onboarding')

  const workspace = workspaceRes.data
  const projects = projectsRes.data || []
  const members = membersRes.data || []
  const currentUserRole = myRoleRes.data?.role || 'viewer'
  const pendingInvites = invitesRes.data || []
  const dropboxConnected = !!(workspaceRes.data as any)?.dropbox_token

  // Storage usage
  const projectIds = projects.map((p: any) => p.id)
  const [docsStorageRes, oficiosStorageRes] = await Promise.all([
    projectIds.length > 0
      ? supabase.from('documents').select('file_size').in('project_id', projectIds)
      : Promise.resolve({ data: [] as { file_size: number | null }[] }),
    supabase.from('oficios').select('file_size').eq('workspace_id', wsId),
  ])
  const docBytes    = ((docsStorageRes as any).data || []).reduce((s: number, r: any) => s + (r.file_size || 0), 0)
  const oficioBytes = ((oficiosStorageRes as any).data || []).reduce((s: number, r: any) => s + (r.file_size || 0), 0)
  const storageUsed = docBytes + oficioBytes

  const enrichedMembers = members.map((m: any) => ({
    ...m,
    email: m.user_id === user.id ? user.email : null,
  }))

  const currentUserName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#00C2FF]" />
          Configuración
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Gestiona proyectos, equipo y ajustes del workspace
        </p>
      </div>

      <AdminPanel
        projects={projects as any}
        workspace={workspace as any}
        members={enrichedMembers as any}
        currentUserId={user.id}
        currentUserRole={currentUserRole as any}
        currentUserEmail={user.email || ''}
        currentUserName={currentUserName}
        pendingInvites={pendingInvites as any}
        dropboxConnected={dropboxConnected}
        storageUsed={storageUsed}
        storageByModule={{ documents: docBytes, oficios: oficioBytes }}
      />
    </div>
  )
}
