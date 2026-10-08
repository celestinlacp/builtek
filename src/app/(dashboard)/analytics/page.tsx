import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient, { type AnalyticsData } from './AnalyticsClient'

const STATUS_LABELS: Record<string, string> = {
  active:    'Activos',
  paused:    'En pausa',
  completed: 'Terminados',
  archived:  'Archivados',
}
const STATUS_COLORS: Record<string, string> = {
  active:    '#1FB0EC',
  paused:    '#F59E0B',
  completed: '#16A34A',
  archived:  '#94A3B8',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  if (!membership) redirect('/onboarding')

  const wsId = membership.workspace_id

  const [allProjects, allDocs, specDocs, specialtiesRes] = await Promise.all([
    supabase.from('projects').select('id, name, status, parent_project_id').eq('workspace_id', wsId),
    supabase.from('documents')
      .select('project_id, project:projects(name)')
      .eq('workspace_id', wsId)
      .neq('doc_status', 'deleted')
      .neq('is_current', false),
    supabase.from('documents')
      .select('doc_type, doc_key, created_at, specialty:specialties(code, name)')
      .eq('workspace_id', wsId)
      .neq('doc_status', 'deleted')
      .neq('is_current', false),
    supabase.from('specialties').select('code, name'),
  ])

  const specNameByCode: Record<string, string> = {}
  for (const s of (specialtiesRes.data ?? [])) specNameByCode[s.code] = s.name

  // 1. Proyectos por estado
  const statusCount: Record<string, number> = {}
  for (const p of (allProjects.data ?? [])) {
    const s = p.status ?? 'active'
    statusCount[s] = (statusCount[s] ?? 0) + 1
  }
  const projectsByStatus = Object.entries(statusCount)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value)

  // 2. Docs por proyecto (top 15, solo proyectos raíz con nombre)
  const docCountByProject: Record<string, { name: string; total: number }> = {}
  for (const d of (allDocs.data ?? [])) {
    const p = (d as any).project
    if (!p?.name || !d.project_id) continue
    if (!docCountByProject[d.project_id])
      docCountByProject[d.project_id] = { name: p.name, total: 0 }
    docCountByProject[d.project_id].total++
  }
  const docsByProject = Object.values(docCountByProject)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)
    .map(d => ({ name: d.name.length > 35 ? d.name.slice(0, 35) + '…' : d.name, total: d.total }))
    .reverse() // ascendente para que el mayor quede arriba en layout vertical

  // 3. Docs por especialidad + tipo
  type SpecDoc = { name: string; planos: number; oficios: number; otros: number }
  const specDocMap: Record<string, SpecDoc> = {}
  const specActivityMap: Record<string, { code: string; name: string; lastUpload: string | null }> = {}

  for (const d of (specDocs.data ?? [])) {
    const spec = (d as any).specialty
    const code: string | null = spec?.code || (d as any).doc_key?.split('-')[3] || null
    if (!code) continue
    const name: string = spec?.name || specNameByCode[code] || code
    const docType: string | null = (d as any).doc_type ?? null
    const date: string | null = (d as any).created_at ?? null

    if (!specDocMap[code]) specDocMap[code] = { name, planos: 0, oficios: 0, otros: 0 }
    if (docType === 'PLA') specDocMap[code].planos++
    else if (docType === 'OFI') specDocMap[code].oficios++
    else specDocMap[code].otros++

    if (!specActivityMap[code]) specActivityMap[code] = { code, name, lastUpload: null }
    if (date && (!specActivityMap[code].lastUpload || date > specActivityMap[code].lastUpload!))
      specActivityMap[code].lastUpload = date
  }

  const docsBySpecialty = Object.values(specDocMap)
    .map(s => ({ ...s, total: s.planos + s.oficios + s.otros }))
    .sort((a, b) => b.total - a.total)
    .map(({ total: _t, ...rest }) => rest)

  const specActivity = Object.values(specActivityMap).sort((a, b) => {
    if (!a.lastUpload) return 1
    if (!b.lastUpload) return -1
    return b.lastUpload.localeCompare(a.lastUpload)
  })

  const analyticsData: AnalyticsData = {
    projectsByStatus,
    docsByProject,
    docsBySpecialty,
    specActivity,
  }

  const wsName = (membership.workspaces as any)?.name ?? ''

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2744]">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">{wsName} — visión general del proyecto</p>
      </div>
      <AnalyticsClient data={analyticsData} />
    </div>
  )
}
