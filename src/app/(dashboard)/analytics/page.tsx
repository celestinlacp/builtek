import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import AnalyticsClient, { type AnalyticsData, type ProjectDocData } from './AnalyticsClient'

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

  const [allProjects, allDocs, specialtiesRes] = await Promise.all([
    supabase.from('projects')
      .select('id, name, status, parent_project_id, project_type, frente, cover_image_url')
      .eq('workspace_id', wsId),
    supabase.from('documents')
      .select('id, project_id, doc_type, doc_key, created_at, specialty:specialties(code, name), project:projects(name)')
      .eq('workspace_id', wsId)
      .neq('doc_status', 'deleted')
      .neq('is_current', false),
    supabase.from('specialties').select('code, name'),
  ])

  // Pre-sign cover images (same pattern as documents/page.tsx)
  const coverUrls: Record<string, string> = {}
  if (r2IsConfigured()) {
    const projectsWithCovers = (allProjects.data ?? []).filter(p => p.cover_image_url)
    await Promise.all(
      projectsWithCovers.map(async (p) => {
        try {
          const cmd = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: p.cover_image_url! })
          coverUrls[p.id] = await getSignedUrl(getR2Client(), cmd, { expiresIn: 3600 })
        } catch { /* silencioso — muestra placeholder */ }
      })
    )
  }

  const specNameByCode: Record<string, string> = {}
  for (const s of (specialtiesRes.data ?? [])) specNameByCode[s.code] = s.name

  // 1. Projects by status
  const statusCount: Record<string, number> = {}
  for (const p of (allProjects.data ?? [])) {
    const s = p.status ?? 'active'
    statusCount[s] = (statusCount[s] ?? 0) + 1
  }
  const projectsByStatus = Object.entries(statusCount)
    .map(([status, value]) => ({ name: STATUS_LABELS[status] ?? status, value, color: STATUS_COLORS[status] ?? '#94A3B8' }))
    .sort((a, b) => b.value - a.value)

  // 2. Projects by type (conditional — only shown if data exists)
  const typeCount: Record<string, number> = {}
  for (const p of (allProjects.data ?? [])) {
    if (!p.project_type) continue
    typeCount[p.project_type] = (typeCount[p.project_type] ?? 0) + 1
  }
  const projectsByType = Object.entries(typeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 3. Projects by frente (conditional)
  const frenteCount: Record<string, number> = {}
  for (const p of (allProjects.data ?? [])) {
    if (!p.frente) continue
    frenteCount[p.frente] = (frenteCount[p.frente] ?? 0) + 1
  }
  const projectsByFrente = Object.entries(frenteCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 4. ProjectDocData — per-project breakdown
  const projDocMap: Record<string, ProjectDocData> = {}
  let totalPlanos = 0, totalOficios = 0

  for (const d of (allDocs.data ?? [])) {
    if (!d.project_id) continue
    const proj = (allProjects.data ?? []).find(p => p.id === d.project_id)
    const projName = (d as any).project?.name ?? proj?.name
    if (!projName) continue

    if (!projDocMap[d.project_id]) {
      projDocMap[d.project_id] = {
        id:          d.project_id,
        name:        projName,
        frente:      proj?.frente      ?? null,
        projectType: proj?.project_type ?? null,
        coverUrl:    coverUrls[d.project_id] ?? null,
        specCounts:  {},
        total:       0,
      }
    }

    const spec     = (d as any).specialty
    const code: string | null = spec?.code || (d as any).doc_key?.split('-')[3] || null
    if (code) projDocMap[d.project_id].specCounts[code] = (projDocMap[d.project_id].specCounts[code] ?? 0) + 1
    projDocMap[d.project_id].total++

    const docType = (d as any).doc_type
    if (docType === 'PLA') totalPlanos++
    else if (docType === 'OFI') totalOficios++
  }

  const projectDocs: ProjectDocData[] = Object.values(projDocMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  // 5. Docs by specialty + type
  type SpecDoc = { name: string; planos: number; oficios: number; otros: number }
  const specDocMap:      Record<string, SpecDoc>    = {}
  const specActivityMap: Record<string, { code: string; name: string; lastUpload: string | null }> = {}

  for (const d of (allDocs.data ?? [])) {
    const spec = (d as any).specialty
    const code: string | null = spec?.code || (d as any).doc_key?.split('-')[3] || null
    if (!code) continue
    const name: string      = spec?.name || specNameByCode[code] || code
    const docType           = (d as any).doc_type ?? null
    const date: string|null = (d as any).created_at ?? null

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

  const frentes    = [...new Set((allProjects.data ?? []).map(p => p.frente).filter(Boolean) as string[])]
  const totalDocs  = (allDocs.data ?? []).length

  const analyticsData: AnalyticsData = {
    workspaceName:  (membership.workspaces as any)?.name ?? '',
    summary:        { projects: (allProjects.data ?? []).length, docs: totalDocs, planos: totalPlanos, oficios: totalOficios },
    projectsByStatus,
    projectsByType,
    projectsByFrente,
    projectDocs,
    docsBySpecialty,
    specActivity,
    specialties: specialtiesRes.data ?? [],
    frentes,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AnalyticsClient data={analyticsData} />
    </div>
  )
}
