import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import CalendarPanel from './CalendarPanel'

export default async function CalendarPage() {
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

  // Fetch project IDs del workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', membership.workspace_id)

  const projectIds = (projects || []).map(p => p.id)

  // Tareas con fecha de terminación, de este workspace
  const { data: tasks } = projectIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, name, status, priority, due_date, project:projects(name)')
        .in('project_id', projectIds)
        .not('due_date', 'is', null)
        .order('due_date')
    : { data: [] }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#00C2FF]" />
          Calendario
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Fechas de terminación de tareas por mes
        </p>
      </div>

      <CalendarPanel tasks={(tasks || []) as any} />
    </div>
  )
}
