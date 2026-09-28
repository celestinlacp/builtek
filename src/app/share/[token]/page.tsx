import { createClient as createAdmin } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { FileText, Layers, Image, FileSpreadsheet, File, Download, Eye, FolderOpen, Calendar, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type DocRow = {
  id: string
  name: string | null
  file_name: string | null
  display_name: string | null
  doc_key: string | null
  file_type: string | null
  specialty_code: string | null
  status: string | null
  version_number: number | null
}

type EntregableRow = {
  id: string
  file_name: string | null
  file_type: string | null
  status: string | null
  created_at: string
  task_id: string
}

type TaskRow = { id: string; name: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function docDisplayName(doc: DocRow) {
  return doc.doc_key || doc.display_name || doc.name || doc.file_name || 'Sin nombre'
}

function fileTypeIcon(ft: string | null) {
  switch (ft) {
    case 'pdf':  return { Icon: FileText,       bg: 'bg-red-50',    color: 'text-red-500'    }
    case 'dwg':
    case 'dxf':  return { Icon: Layers,          bg: 'bg-blue-50',   color: 'text-blue-500'   }
    case 'img':
    case 'png':
    case 'jpg':  return { Icon: Image,           bg: 'bg-purple-50', color: 'text-purple-500' }
    case 'xlsx':
    case 'csv':  return { Icon: FileSpreadsheet, bg: 'bg-green-50',  color: 'text-green-500'  }
    default:     return { Icon: File,            bg: 'bg-slate-50',  color: 'text-slate-400'  }
  }
}

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Borrador',    cls: 'bg-slate-100 text-slate-600' },
  review:   { label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado',   cls: 'bg-red-100 text-red-600'    },
}

const ENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado',   cls: 'bg-red-100 text-red-600'    },
}

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

  // Check project_shares first, fall back to drive_shares for legacy links
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

  // 1. Validar token en project_shares
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
          <p className="text-xs text-slate-400 mt-3">
            Solicita un nuevo link al responsable del proyecto.
          </p>
          <p className="text-[11px] text-slate-300 mt-6 font-medium">Builtek · Gestión de proyectos AEC</p>
        </div>
      </main>
    )
  }

  // 2. Datos del proyecto
  const { data: project } = await admin
    .from('projects')
    .select('id, name, description, frente, project_type, start_date, end_date, mic_identifier, cover_image_url')
    .eq('id', share.project_id)
    .single()

  if (!project) return notFound()

  // 3. Subproyectos del proyecto raíz
  const { data: subprojects } = await admin
    .from('projects')
    .select('id, name')
    .eq('parent_project_id', share.project_id)

  const allProjectIds = [share.project_id, ...(subprojects ?? []).map(s => s.id)]

  // 4. Documentos vigentes del proyecto + subproyectos
  const { data: rawDocs } = await admin
    .from('documents')
    .select('id, name, file_name, display_name, doc_key, file_type, specialty_code, status, version_number')
    .in('project_id', allProjectIds)
    .eq('is_current', true)
    .neq('doc_status', 'deleted')
    .order('specialty_code', { nullsFirst: false })
    .order('doc_key')

  const documents: DocRow[] = rawDocs ?? []

  // 5. Entregables vía tareas del proyecto + subproyectos
  const { data: tasks } = await admin
    .from('tasks')
    .select('id, name')
    .in('project_id', allProjectIds)

  const taskList: TaskRow[] = tasks ?? []
  const taskNameById: Record<string, string> = Object.fromEntries(taskList.map(t => [t.id, t.name]))
  const taskIds = taskList.map(t => t.id)

  const rawEntregables = taskIds.length > 0
    ? (await admin
        .from('entregables')
        .select('id, file_name, file_type, status, created_at, task_id')
        .in('task_id', taskIds)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      ).data ?? []
    : []

  const entregables: EntregableRow[] = rawEntregables

  // 6. Agrupar documentos por especialidad
  const docsBySpecialty: Record<string, DocRow[]> = {}
  for (const doc of documents) {
    const key = doc.specialty_code || 'General'
    if (!docsBySpecialty[key]) docsBySpecialty[key] = []
    docsBySpecialty[key].push(doc)
  }

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

      {/* Hero del proyecto */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/share/${token}/cover`}
            alt={project.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
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

      {/* Barra de stats */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 text-xs text-slate-500">
          <span>
            <strong className="text-[#1A2744] font-bold text-sm">{documents.length}</strong>{' '}
            documento{documents.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-200">|</span>
          <span>
            <strong className="text-[#1A2744] font-bold text-sm">{entregables.length}</strong>{' '}
            entregable{entregables.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Solo lectura y descarga
          </span>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Documentos ── */}
        {documents.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#1A2744] mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00C2FF]" />
              Planos y Documentos
              <span className="text-xs font-normal text-slate-400 ml-1">(versión vigente)</span>
            </h2>

            <div className="space-y-7">
              {Object.entries(docsBySpecialty).map(([specialty, docs]) => (
                <div key={specialty}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-block h-px flex-1 bg-slate-100 max-w-[40px]" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {specialty}
                    </p>
                    <span className="text-[10px] text-slate-300">({docs.length})</span>
                    <span className="inline-block h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docs.map(doc => {
                      const { Icon, bg, color } = fileTypeIcon(doc.file_type)
                      const dStatus  = DOC_STATUS[doc.status ?? '']
                      const viewUrl  = `/api/share/${token}/file?type=document&id=${doc.id}`
                      const dlUrl    = `/api/share/${token}/file?type=document&id=${doc.id}&dl=1`
                      const dispName = docDisplayName(doc)
                      return (
                        <div key={doc.id}
                          className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-sm hover:border-slate-200 transition-all group">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#1A2744] leading-snug line-clamp-2">
                                {dispName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {doc.doc_key && doc.doc_key !== dispName && (
                                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                                    {doc.doc_key}
                                  </span>
                                )}
                                {doc.version_number != null && doc.version_number > 0 && (
                                  <span className="text-[10px] text-slate-400">v{doc.version_number}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                            {dStatus ? (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dStatus.cls}`}>
                                {dStatus.label}
                              </span>
                            ) : <span />}
                            <div className="flex items-center gap-1.5">
                              <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">
                                <Eye className="w-3 h-3" />
                                Ver
                              </a>
                              <a href={dlUrl}
                                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-2.5 py-1.5 rounded-lg transition-colors">
                                <Download className="w-3 h-3" />
                                Descargar
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Entregables ── */}
        {entregables.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#1A2744] mb-5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00C2FF]" />
              Entregables
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entregables.map(ent => {
                const { Icon, bg, color } = fileTypeIcon(ent.file_type)
                const eStatus  = ENT_STATUS[ent.status ?? '']
                const taskName = taskNameById[ent.task_id]
                const dlUrl    = `/api/share/${token}/file?type=entregable&id=${ent.id}&dl=1`
                const viewUrl  = `/api/share/${token}/file?type=entregable&id=${ent.id}`
                return (
                  <div key={ent.id}
                    className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-sm hover:border-slate-200 transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1A2744] leading-snug line-clamp-2">
                          {ent.file_name || 'Entregable'}
                        </p>
                        {taskName && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Tarea: {taskName}</p>
                        )}
                        <p className="text-[10px] text-slate-300 mt-0.5">{formatDate(ent.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      {eStatus ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${eStatus.cls}`}>
                          {eStatus.label}
                        </span>
                      ) : <span />}
                      <div className="flex items-center gap-1.5">
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1A2744] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">
                          <Eye className="w-3 h-3" />
                          Ver
                        </a>
                        <a href={dlUrl}
                          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#1A2744] hover:bg-[#243660] px-2.5 py-1.5 rounded-lg transition-colors">
                          <Download className="w-3 h-3" />
                          Descargar
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Estado vacío */}
        {documents.length === 0 && entregables.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">Sin archivos disponibles</p>
            <p className="text-xs text-slate-300 mt-1">Este proyecto aún no tiene documentos cargados.</p>
          </div>
        )}

      </main>

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
