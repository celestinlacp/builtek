import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamDashboard from './TeamDashboard'
import type { TeamMemberStats } from '../dashboard/TeamView'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const userRole = membership.role as string
  if (!['owner', 'admin', 'manager'].includes(userRole)) redirect('/dashboard')

  const wsId = membership.workspace_id
  const workspaceName = (membership.workspaces as any)?.name ?? ''

  const [tasksRes, membersRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, name, status, priority, due_date, project_id, assignee_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_members')
      .select('user_id, role, profiles(full_name, initials)')
      .eq('workspace_id', wsId),
  ])

  const allTasks = tasksRes.data ?? []
  const now = new Date()

  const teamStats: TeamMemberStats[] = (membersRes.data ?? []).map((m: any) => {
    const uid = m.user_id
    const profile = m.profiles
    const userTasks = allTasks.filter((t: any) => t.assignee_id === uid)
    const done       = userTasks.filter((t: any) => t.status === 'done').length
    const inProgress = userTasks.filter((t: any) => t.status === 'in_progress').length
    const pending    = userTasks.filter((t: any) => t.status === 'pending').length
    const review     = userTasks.filter((t: any) => t.status === 'review').length
    const blocked    = userTasks.filter((t: any) => t.status === 'blocked').length
    const overdue    = userTasks.filter((t: any) =>
      t.status !== 'done' && t.due_date && new Date(t.due_date) < now
    ).length
    const score = userTasks.length > 0
      ? Math.round(((done + review * 0.5) / userTasks.length) * 100)
      : null
    return {
      user_id:     uid,
      full_name:   profile?.full_name ?? null,
      initials:    profile?.initials ?? null,
      role:        m.role,
      total:       userTasks.length,
      done,
      in_progress: inProgress,
      pending,
      review,
      blocked,
      overdue,
      score,
      tasks: userTasks.map((t: any) => ({
        id:         t.id,
        name:       t.name,
        status:     t.status,
        priority:   t.priority,
        due_date:   t.due_date,
        project_id: t.project_id,
      })),
    }
  }).sort((a: any, b: any) => (b.overdue - a.overdue) || ((a.score ?? -1) - (b.score ?? -1)))

  return (
    <TeamDashboard
      members={teamStats}
      workspaceName={workspaceName}
      currentUserRole={userRole}
    />
  )
}
