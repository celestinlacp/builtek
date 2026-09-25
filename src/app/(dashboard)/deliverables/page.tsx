import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import DeliverablesPanel from './DeliverablesPanel'

export default async function DeliverablesPage() {
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

  // Proyectos para el filtro
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('workspace_id', wsId)
    .order('name')

  // Entregables con info de tarea, uploader y reviewer
  const { data: rawEnts } = await supabase
    .from('entregables')
    .select('id, file_name, file_type, file_size, status, review_note, created_at, uploaded_by, reviewed_by, reviewed_at, task_id, tasks(id, name, project_id, projects(id, name))')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })

  // Fetch perfiles
  const allUserIds = [...new Set([
    ...(rawEnts ?? []).map((e: any) => e.uploaded_by),
    ...(rawEnts ?? []).filter((e: any) => e.reviewed_by).map((e: any) => e.reviewed_by),
  ].filter(Boolean))]

  const profilesRes = allUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', allUserIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p.full_name]))

  const entregables = (rawEnts ?? []).map((e: any) => ({
    ...e,
    uploader_name:  profileMap[e.uploaded_by]  ?? null,
    reviewer_name:  e.reviewed_by ? (profileMap[e.reviewed_by] ?? null) : null,
    task_name:      (e.tasks as any)?.name ?? null,
    project_id:     (e.tasks as any)?.projects?.id ?? null,
    project_name:   (e.tasks as any)?.projects?.name ?? null,
  }))

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Package className="w-6 h-6 text-[#00C2FF]" />
          Entregables
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {entregables.length} entregable{entregables.length !== 1 ? 's' : ''} ·{' '}
          {entregables.filter(e => e.status === 'approved').length} aprobados ·{' '}
          {entregables.filter(e => e.status === 'pending').length} en revisión
        </p>
      </div>

      <DeliverablesPanel
        entregables={entregables}
        projects={projects ?? []}
        currentUserRole={membership.role}
      />
    </div>
  )
}
