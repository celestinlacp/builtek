import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskBoard from './TaskBoard'
import { CheckSquare, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const wsId = membership.workspace_id

  const [projectsRes, tasksRes, docsRes, driveRes, membersRes] = await Promise.all([
    supabase.from('projects')
      .select('id, name, status, workspace_id, description, start_date, end_date, created_at')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
    supabase.from('tasks')
      .select(`
        id, name, description, specialty, status, priority, due_date,
        assignee_id, project_id, created_at,
        project:projects(name)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('documents')
      .select('id, name, file_type')
      .eq('workspace_id', wsId)
      .order('name'),
    supabase.from('drive_files')
      .select('id, name, file_type')
      .eq('workspace_id', wsId)
      .order('name'),
    supabase.from('workspace_members')
      .select('user_id')
      .eq('workspace_id', wsId),
  ])

  const projects = projectsRes.data || []
  const tasks = (tasksRes.data || []) as any[]

  const rawMemberIds = (membersRes.data || []).map((m: any) => m.user_id)
  const profilesRes = rawMemberIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, initials').in('id', rawMemberIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.id, { full_name: p.full_name, initials: p.initials }]))
  const members = rawMemberIds.map((uid: string) => ({ user_id: uid, full_name: profileMap[uid]?.full_name || null, initials: profileMap[uid]?.initials || null }))

  const availableDocs = [
    ...(docsRes.data || []).map((d: any) => ({ ...d, source: 'document' as const })),
    ...(driveRes.data || []).map((d: any) => ({ ...d, source: 'drive' as const })),
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#00C2FF]" />
            Tareas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} en total ·{' '}
            {tasks.filter(t => t.status === 'in_progress').length} en curso ·{' '}
            {tasks.filter(t => t.status === 'done').length} completadas
          </p>
        </div>

        {projects.length === 0 && (
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-[#00C2FF] text-[#1A2744] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00A8E0] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear proyecto primero
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2744] mb-2">Crea un proyecto primero</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Las tareas pertenecen a un proyecto. Ve a Configuración para crear tu primer proyecto.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#1A2744] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#243660] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear proyecto
          </Link>
        </div>
      ) : (
        <TaskBoard tasks={tasks} projects={projects} members={members} availableDocs={availableDocs} currentUserId={user.id} currentUserRole={membership.role} workspaceId={wsId} />
      )}
    </div>
  )
}
