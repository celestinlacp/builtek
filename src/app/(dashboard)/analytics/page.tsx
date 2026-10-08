import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import AnalyticsClient, { type AnalyticsData, type ProjectDocData, type RawProject } from './AnalyticsClient'

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
      .select('id, name, status, parent_project_id, project_type, frente, cover_image_url, is_inah, cauces_federales')
      .eq('workspace_id', wsId),
    supabase.from('documents')
      .select('id, project_id, doc_type, doc_key, created_at, specialty:specialties(code, name), project:projects(name)')
      .eq('workspace_id', wsId)
      .neq('doc_status', 'deleted')
      .neq('is_current', false),
    supabase.from('specialties').select('code, name'),
  ])

  // Pre-sign cover images
  const coverUrls: Record<string, string> = {}
  if (r2IsConfigured()) {
    const projectsWithCovers = (allProjects.data ?? []).filter(p => p.cover_image_url)
    await Promise.all(
      projectsWithCovers.map(async (p) => {
        try {
          const cmd = new GetObjectCommand({ Bucket: R2_BUCKET(), Key: p.cover_image_url! })
          coverUrls[p.id] = await getSignedUrl(getR2Client(), cmd, { expiresIn: 3600 })
        } catch { /* silencioso */ }
      })
    )
  }

  const specNameByCode: Record<string, string> = {}
  for (const s of (specialtiesRes.data ?? [])) specNameByCode[s.code] = s.name

  // Raw projects for client-side reactive filtering
  const rawProjects: RawProject[] = (allProjects.data ?? []).map(p => ({
    id:                p.id,
    name:              p.name,
    status:            p.status            ?? null,
    frente:            p.frente            ?? null,
    project_type:      p.project_type      ?? null,
    parent_project_id: p.parent_project_id ?? null,
    is_inah:           p.is_inah           ?? null,
    cauces_federales:  p.cauces_federales  ?? null,
  }))

  // ProjectDocData with full specBreakdown per project
  const projDocMap: Record<string, ProjectDocData> = {}
  let totalPlanos = 0, totalOficios = 0

  for (const d of (allDocs.data ?? [])) {
    if (!d.project_id) continue
    const proj     = (allProjects.data ?? []).find(p => p.id === d.project_id)
    const projName = (d as any).project?.name ?? proj?.name
    if (!projName) continue

    if (!projDocMap[d.project_id]) {
      projDocMap[d.project_id] = {
        id:            d.project_id,
        name:          projName,
        frente:        proj?.frente       ?? null,
        projectType:   proj?.project_type ?? null,
        coverUrl:      coverUrls[d.project_id] ?? null,
        specBreakdown: {},
        total:         0,
      }
    }

    const spec    = (d as any).specialty
    const code    = spec?.code || (d as any).doc_key?.split('-')[3] || null
    const docType = (d as any).doc_type ?? null

    if (code) {
      if (!projDocMap[d.project_id].specBreakdown[code]) {
        projDocMap[d.project_id].specBreakdown[code] = { planos: 0, oficios: 0, otros: 0 }
      }
      if (docType === 'PLA') projDocMap[d.project_id].specBreakdown[code].planos++
      else if (docType === 'OFI') projDocMap[d.project_id].specBreakdown[code].oficios++
      else projDocMap[d.project_id].specBreakdown[code].otros++
    }
    projDocMap[d.project_id].total++
    if (docType === 'PLA') totalPlanos++
    else if (docType === 'OFI') totalOficios++
  }

  const projectDocs: ProjectDocData[] = Object.values(projDocMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  // Spec activity (keep server-side — needs timestamps)
  const specActivityMap: Record<string, { code: string; name: string; lastUpload: string | null }> = {}
  for (const d of (allDocs.data ?? [])) {
    const spec = (d as any).specialty
    const code = spec?.code || (d as any).doc_key?.split('-')[3] || null
    if (!code) continue
    const name = spec?.name || specNameByCode[code] || code
    const date = (d as any).created_at ?? null
    if (!specActivityMap[code]) specActivityMap[code] = { code, name, lastUpload: null }
    if (date && (!specActivityMap[code].lastUpload || date > specActivityMap[code].lastUpload!))
      specActivityMap[code].lastUpload = date
  }
  const specActivity = Object.values(specActivityMap).sort((a, b) => {
    if (!a.lastUpload) return 1
    if (!b.lastUpload) return -1
    return b.lastUpload.localeCompare(a.lastUpload)
  })

  const frentes    = [...new Set((allProjects.data ?? []).map(p => p.frente).filter(Boolean) as string[])]
  const totalDocs  = (allDocs.data ?? []).length

  const analyticsData: AnalyticsData = {
    workspaceName: (membership.workspaces as any)?.name ?? '',
    summary:       { projects: rawProjects.length, docs: totalDocs, planos: totalPlanos, oficios: totalOficios },
    rawProjects,
    projectDocs,
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
