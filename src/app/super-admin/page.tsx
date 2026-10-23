import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import SuperAdminPanel from './SuperAdminPanel'

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? 'celestinlacp@gmail.com'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (user.email !== MASTER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-1">Acceso denegado</p>
          <p className="text-slate-500 text-xs">Cuenta activa: <span className="text-slate-300">{user.email}</span></p>
          <p className="text-slate-600 text-xs mt-1">Requerida: <span className="text-slate-400">{MASTER_ADMIN_EMAIL}</span></p>
        </div>
      </div>
    )
  }

  const admin = getAdminClient()

  const [workspacesRes, allMembersRes, allProjectsRes, docsCountRes, authUsersRes] = await Promise.all([
    admin.from('workspaces').select('id, name, slug, plan, owner_id, created_at').order('created_at', { ascending: false }),
    admin.from('workspace_members').select('workspace_id, user_id, role'),
    admin.from('projects').select('id, workspace_id'),
    admin.from('documents').select('id', { count: 'exact', head: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const workspaces   = workspacesRes.data   ?? []
  const allMembers   = allMembersRes.data   ?? []
  const allProjects  = allProjectsRes.data  ?? []
  const totalDocs    = docsCountRes.count   ?? 0
  const authUsers    = authUsersRes.data?.users ?? []

  // Owner email map
  const authUserMap: Record<string, { email?: string }> = Object.fromEntries(
    authUsers.map(u => [u.id, { email: u.email }])
  )

  // Member count per workspace
  const memberCountByWs: Record<string, number> = {}
  for (const m of allMembers) {
    memberCountByWs[m.workspace_id] = (memberCountByWs[m.workspace_id] ?? 0) + 1
  }

  // Project count per workspace
  const projectCountByWs: Record<string, number> = {}
  for (const p of allProjects) {
    projectCountByWs[p.workspace_id] = (projectCountByWs[p.workspace_id] ?? 0) + 1
  }

  const enrichedWorkspaces = workspaces.map(ws => ({
    ...ws,
    owner_email:   authUserMap[ws.owner_id]?.email    ?? 'N/A',
    member_count:  memberCountByWs[ws.id]             ?? 0,
    project_count: projectCountByWs[ws.id]            ?? 0,
  }))

  const kpis = {
    totalWorkspaces: workspaces.length,
    totalUsers:      authUsers.length,
    totalProjects:   allProjects.length,
    totalDocs,
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Builtek Super Admin</h1>
            <p className="text-slate-500 text-xs">Panel maestro — {user.email}</p>
          </div>
        </div>

        <SuperAdminPanel workspaces={enrichedWorkspaces} kpis={kpis} />
      </div>
    </div>
  )
}
