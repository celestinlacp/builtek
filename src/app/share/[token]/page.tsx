import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { FolderOpen, Calendar, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import ShareContent from './ShareContent'
import type { ShareDoc, ShareEntregable, ShareSubproject } from './ShareContent'

export const dynamic = 'force-dynamic'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: share } = await admin
    .from('project_shares')
    .select('project_id')
    .eq('token', token)
    .single()

  if (!share) return { title: 'Archivos compartidos — Builtek' }

  const { data: project } = await admin
    .from('projects')
    .select('name')
    .eq('id', share.project_id)
    .single()

  return {
    title: project?.name ? `${project.name} — Builtek` : 'Archivos compartidos — Builtek',
    description: 'Accede y descarga los archivos actualizados de este proyecto.',
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function SharePage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Validar token
  const { data: share } = await admin
    .from('project_shares')
    .select('project_id, expires_at')
    .eq('token', token)
    .single()

  if (!share) return notFound()

  const expired = new Date(share.expires_at) < new Date()

  if (expired) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-[#1A2744] mb-2">Este link expiró</h1>
          <p className="text-sm text-slate-400">
            El link venció el{' '}
            <strong className="text-slate-600">
              {new Date(share.expires_at).toLocaleString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </strong>.
          </p>
          <p className="text-xs text-slate-400 mt-3">Solicita un nuevo link al responsable del proyecto.</p>
          <p className="text-[11px] text-slate-300 mt-6 font-medium">Builtek · Gestión de proyectos AEC</p>
        </div>
      </main>
    )
  }

  // 2. Proyecto raíz
  const { data: project } = await admin
    .from('projects')
    .select('id, name, description, frente, project_type, start_date, end_date, mic_identifier, cover_image_url')
    .eq('id', share.project_id)
    .single()

  if (!project) return notFound()

  // 3. Subproyectos
  const { data: subprojectsRaw } = await admin
    .from('projects')
    .select('id, name')
    .eq('parent_project_id', share.project_id)

  const subprojects: ShareSubproject[] = subprojectsRaw ?? []
  const allProjectIds = [share.project_id, ...subprojects.map(s => s.id)]

  // 4. Documentos vigentes — solo filtrar por is_current; doc_status varía por proyecto
  // specialty_code no es columna directa en documents — se obtiene via join con specialties
  const { data: rawDocs } = await admin
    .from('documents')
    .select('id, name, file_name, display_name, doc_key, file_type, status, version_number, project_id, uploaded_by, created_at, specialty:specialties(code)')
    .in('project_id', allProjectIds)
    .or('is_current.is.null,is_current.eq.true')
    .order('doc_key')
    .order('version_number', { ascending: false })

  // 5. Fetch nombres de uploaders
  const uploaderIds = [...new Set((rawDocs ?? []).map((d: any) => d.uploaded_by).filter(Boolean))]
  const uploaderNameById: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    const { data: uploaders } = await admin.from('users').select('id, full_name').in('id', uploaderIds)
    for (const u of (uploaders ?? [])) {
      if (u.id && u.full_name) uploaderNameById[u.id] = u.full_name
    }
  }

  const documents: ShareDoc[] = (rawDocs ?? []).map((d: any) => ({
    ...d,
    specialty_code: (d.specialty as any)?.code ?? null,
    uploaderName: uploaderNameById[d.uploaded_by] ?? null,
  }))

  // 6. Entregables vía tareas
  const { data: taskRows } = await admin
    .from('tasks')
    .select('id, name')
    .in('project_id', allProjectIds)

  const taskNameById: Record<string, string> = Object.fromEntries((taskRows ?? []).map((t: any) => [t.id, t.name]))
  const taskIds = (taskRows ?? []).map((t: any) => t.id)

  const rawEntregables = taskIds.length > 0
    ? (await admin
        .from('entregables')
        .select('id, file_name, file_type, status, created_at, task_id')
        .in('task_id', taskIds)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      ).data ?? []
    : []

  const entregables: ShareEntregable[] = rawEntregables

  // ── UI ─────────────────────────────────────────────────────────────────────

  const hasCover = !!project.cover_image_url
  const expiresFormatted = new Date(share.expires_at).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <header className="bg-[#1A2744] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4 text-[#1A2744]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Builtek</span>
            <span className="hidden sm:block text-white/30 text-xs">·</span>
            <span className="hidden sm:block text-white/60 text-xs">Vista compartida de archivos</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50 flex-shrink-0">
            <Calendar className="w-3 h-3" />
            <span className="hidden sm:block">Expira</span>
            <span className="font-semibold text-white/80">{expiresFormatted}</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/share/${token}/cover`} alt={project.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2744] via-[#243660] to-[#00C2FF]/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 flex flex-col justify-end" style={{ minHeight: 200 }}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {project.mic_identifier && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                {project.mic_identifier}
              </span>
            )}
            {project.frente && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00C2FF]/30 text-white border border-[#00C2FF]/20 backdrop-blur-sm">
                {project.frente}
              </span>
            )}
            {project.project_type && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/10 backdrop-blur-sm">
                {project.project_type}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm leading-snug">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm text-white/70 mt-1 max-w-xl line-clamp-2">{project.description}</p>
          )}
          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-white/60">
              <Calendar className="w-3 h-3" />
              <span>
                {project.start_date && formatDate(project.start_date)}
                {project.start_date && project.end_date && ' – '}
                {project.end_date && formatDate(project.end_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 text-xs text-slate-500 flex-wrap">
          <span>
            <strong className="text-[#1A2744] font-bold text-sm">{documents.length}</strong>{' '}
            documento{documents.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-200">|</span>
          <span>
            <strong className="text-[#1A2744] font-bold text-sm">{entregables.length}</strong>{' '}
            entregable{entregables.length !== 1 ? 's' : ''}
          </span>
          {subprojects.length > 0 && (
            <>
              <span className="text-slate-200">|</span>
              <span>
                <strong className="text-[#1A2744] font-bold text-sm">{subprojects.length}</strong>{' '}
                subproyecto{subprojects.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Solo lectura y descarga
          </span>
        </div>
      </div>

      {/* Contenido interactivo */}
      <ShareContent
        rootProjectId={share.project_id}
        subprojects={subprojects}
        documents={documents}
        entregables={entregables}
        taskNameById={taskNameById}
        token={token}
      />

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            <strong className="text-slate-600 font-semibold">Builtek</strong> · Gestión de proyectos AEC
          </span>
          <span>Link válido hasta {expiresFormatted}</span>
        </div>
      </footer>

    </div>
  )
}
