import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FlowsPanel from './FlowsPanel'

export default async function FlowsPage() {
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

  const [flowsRes, projectsRes, specialtiesRes] = await Promise.all([
    supabase
      .from('flows')
      .select('id, name, description, project_id, created_at, updated_at, projects(name)')
      .eq('workspace_id', wsId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, parent_project_id')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('specialties')
      .select('code, name')
      .eq('workspace_id', wsId)
      .order('name'),
  ])

  const flowIds = (flowsRes.data ?? []).map((f: any) => f.id)
  const stepsRes = flowIds.length > 0
    ? await supabase
        .from('flow_steps')
        .select('id, flow_id, name, fecha_documento, estado, especialidad, position, is_decision, note')
        .in('flow_id', flowIds)
        .order('position', { ascending: true })
    : { data: [] }

  return (
    <FlowsPanel
      flows={(flowsRes.data ?? []) as any[]}
      steps={(stepsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      specialties={(specialtiesRes.data ?? []) as any[]}
      workspaceId={wsId}
    />
  )
}
