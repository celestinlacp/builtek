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
  const projectIds = [...new Set((flowsRes.data ?? []).map((f: any) => f.project_id).filter(Boolean))] as string[]

  const [stepsRes, flowDocsRes] = await Promise.all([
    flowIds.length > 0
      ? supabase
          .from('flow_steps')
          .select('id, flow_id, name, fecha_documento, estado, especialidad, position, is_decision, note, document_id')
          .in('flow_id', flowIds)
          .order('position', { ascending: true })
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase
          .from('documents')
          .select('id, name, display_name, file_name, project_id, emission_date, doc_key, specialty:specialties(name, code)')
          .in('project_id', projectIds)
          .eq('is_current', true)
          .neq('doc_status', 'deleted')
          .neq('doc_status', 'archived')
          .order('emission_date', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  return (
    <FlowsPanel
      flows={(flowsRes.data ?? []) as any[]}
      steps={(stepsRes.data ?? []) as any[]}
      projects={(projectsRes.data ?? []) as any[]}
      documents={(flowDocsRes.data ?? []) as any[]}
      workspaceId={wsId}
    />
  )
}
