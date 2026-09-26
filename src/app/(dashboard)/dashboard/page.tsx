import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, FolderOpen, FileText, Bot, TrendingUp, Clock, AlertCircle, CheckCircle2, User, Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Greeting from './Greeting'

async function getWorkspaceData(userId: string) {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name)')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (!membership) return null

  const wsId = membership.workspace_id

  const [projects, tasks, documents, imageDocs, allDocs] = await Promise.all([
    supabase.from('projects').select('id, name, status, frente, cover_image_url').eq('workspace_id', wsId).eq('status', 'active').is('parent_project_id', null).order('name'),
    supabase.from('tasks').select('id, name, status, priority, due_date, project_id, assignee_id').order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name, status, created_at').eq('workspace_id', wsId).neq('doc_status', 'deleted').order('created_at', { ascending: false }).limit(5),
    supabase.from('documents').select('id, project_id, created_at').eq('workspace_id', wsId).eq('file_type', 'img').order('created_at', { ascending: false }),
    supabase.from('documents').select('project_id').eq('workspace_id', wsId).neq('doc_status', 'deleted').eq('is_current', true),
  ])

  // Última foto por proyecto (fallback si no tiene cover_image_url)
  const latestImageByProject: Record<string, string> = {}
  for (const d of (imageDocs.data ?? [])) {
    if (d.project_id && !latestImageByProject[d.project_id]) {
      latestImageByProject[d.project_id] = d.id
    }
  }

  // Conteo de documentos vigentes por proyecto
  const docCountByProject: Record<string, number> = {}
  for (const d of (allDocs.data ?? [])) {
    if (d.project_id) docCountByProject[d.project_id] = (docCountByProject[d.project_id] ?? 0) + 1
  }

  return {
    workspace: membership.workspaces as unknown as { id: string; name: string },
    projects: projects.data || [],
    tasks: tasks.data || [],
    documents: documents.data || [],
    latestImageByProject,
    docCountByProject,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getWorkspaceData(user.id)
  if (!data) redirect('/onboarding')

  const { workspace, projects, tasks, documents, latestImageByProject, docCountByProject } = data

  const tasksDone = tasks.filter(t => t.status === 'done').length
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length
  const tasksBlocked = tasks.filter(t => t.status === 'blocked').length
  const tasksPending = tasks.filter(t => t.status === 'pending').length
  const progressPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0

  const recentTasks = tasks.slice(0, 6)
  const myTasks = tasks.filter((t: any) => t.assignee_id === user.id && t.status !== 'done').slice(0, 5)

  // Performance personal
  const myAll     = tasks.filter((t: any) => t.assignee_id === user.id)
  const myDone    = myAll.filter(t => t.status === 'done').length
  const myReview  = myAll.filter(t => t.status === 'review').length
  const myTotal   = myAll.length
  const myScore   = myTotal > 0 ? Math.round(((myDone * 1 + myReview * 0.5) / myTotal) * 100) : null
  const scoreColor = myScore === null ? 'text-slate-400'
    : myScore >= 70 ? 'text-green-600'
    : myScore >= 40 ? 'text-amber-500'
    : 'text-red-500'
  const scoreBg = myScore === null ? 'bg-slate-50'
    : myScore >= 70 ? 'bg-green-50'
    : myScore >= 40 ? 'bg-amber-50'
    : 'bg-red-50'

  const now = new Date()
  const myUrgent = myAll.filter((t: any) => {
    if (t.status === 'done' || t.status === 'review' || !t.due_date) return false
    const diff = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff <= 3
  }).length

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente', in_progress: 'En curso',
    review: 'En revisión', done: 'Hecho', blocked: 'Bloqueado'
  }
  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-600',
  }
  const PRIORITY_COLOR: Record<string, string> = {
    low: 'bg-slate-200', medium: 'bg-amber-400',
    high: 'bg-orange-500', urgent: 'bg-red-500'
  }

  const firstName = (user.user_metadata?.full_name || '').split(' ')[0] || 'equipo'

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744]"><Greeting firstName={firstName} /></h1>
          <p className="text-slate-500 text-sm mt-0.5">{workspace.name} — resumen del equipo</p>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#243660] transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Nueva tarea
        </Link>
      </div>

      {/* Bento grid de proyectos */}
      {projects.length > 0 && (() => {
        const visible = (projects as any[]).slice(0, 5)
        const [featured, ...rest] = visible

        function ProjectTile({ p, large }: { p: any; large?: boolean }) {
          const imgSrc = p.cover_image_url
            ? `/api/projects/${p.id}/cover`
            : latestImageByProject[p.id]
              ? `/api/documents/download/${latestImageByProject[p.id]}?inline=1`
              : null
          const docCount = docCountByProject[p.id] ?? 0

          return (
            <Link href={`/documents?project=${p.id}`}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer block ${large ? 'h-64' : 'h-[calc(50%-6px)]'}`}>
              {/* Foto o placeholder */}
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A2744] to-[#243660]">
                  <FolderOpen className="absolute bottom-6 right-6 w-12 h-12 text-white/10" />
                </div>
              )}
              {/* Gradiente overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              {/* Badges top */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {p.frente && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20">
                    {p.frente}
                  </span>
                )}
                {p.project_type && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00C2FF]/30 text-white backdrop-blur-sm border border-[#00C2FF]/30">
                    {p.project_type}
                  </span>
                )}
              </div>
              {/* Flecha top-right */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20">
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </div>
              {/* Info bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                <p className={`font-bold text-white leading-snug drop-shadow ${large ? 'text-base' : 'text-sm'} line-clamp-2`}>
                  {p.name}
                </p>
                <p className="text-white/60 text-[11px] mt-0.5">
                  {docCount} documento{docCount !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          )
        }

        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proyectos activos</h2>
              <Link href="/documents" className="text-xs text-[#00C2FF] font-semibold hover:underline flex items-center gap-0.5">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {visible.length === 1 && (
              <ProjectTile p={featured} large />
            )}

            {visible.length === 2 && (
              <div className="grid grid-cols-2 gap-3 h-64">
                {visible.map(p => <ProjectTile key={p.id} p={p} large />)}
              </div>
            )}

            {visible.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 h-64">
                {/* Featured — ocupa 2 columnas */}
                <div className="col-span-2 h-full">
                  <ProjectTile p={featured} large />
                </div>
                {/* Rest — columna derecha, 2 filas */}
                <div className="col-span-1 flex flex-col gap-3 h-full">
                  {rest.slice(0, 2).map(p => <ProjectTile key={p.id} p={p} />)}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Proyectos activos', value: projects.filter(p => p.status === 'active').length, total: projects.length, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tareas totales', value: tasks.length, sub: `${tasksInProgress} en curso`, icon: CheckSquare, color: 'text-[#1A2744]', bg: 'bg-slate-100' },
          { label: 'Completadas', value: tasksDone, sub: `${progressPct}% del total`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bloqueadas', value: tasksBlocked, sub: tasksBlocked > 0 ? 'Requieren atención' : 'Sin bloqueos', icon: AlertCircle, color: tasksBlocked > 0 ? 'text-red-500' : 'text-slate-400', bg: tasksBlocked > 0 ? 'bg-red-50' : 'bg-slate-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.sub || `de ${kpi.total} total`}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00C2FF]" />
              <span className="text-sm font-semibold text-[#1A2744]">Avance del equipo</span>
            </div>
            <span className="text-lg font-bold text-[#1A2744]">{progressPct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1A2744] to-[#00C2FF] rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{tasksDone} hechas</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{tasksInProgress} en curso</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />{tasksPending} pendientes</span>
            {tasksBlocked > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{tasksBlocked} bloqueadas</span>}
          </div>
        </div>
      )}

      {/* Mi rendimiento */}
      {myTotal > 0 && (
        <div className={`rounded-xl border p-5 ${scoreBg} border-slate-100`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
              <User className="w-4 h-4 text-[#00C2FF]" /> Mi rendimiento
            </h2>
            <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
              Hecho = 100% · En revisión = 50%
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="flex-shrink-0 text-center">
              <p className={`text-5xl font-black ${scoreColor}`}>
                {myScore !== null ? `${myScore}%` : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wide">Score de entrega</p>
            </div>

            <div className="w-px h-14 bg-slate-200 flex-shrink-0" />

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Asignadas',   value: myTotal,                       color: 'text-[#1A2744]' },
                { label: 'Completadas', value: myDone,                        color: 'text-green-600' },
                { label: 'En revisión', value: myReview,                      color: 'text-amber-600' },
                { label: 'Urgentes',    value: myUrgent, icon: myUrgent > 0,  color: myUrgent > 0 ? 'text-red-500' : 'text-slate-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-lg px-3 py-2.5 border border-slate-100 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                    {stat.icon && <Zap className="w-3.5 h-3.5 inline ml-0.5 mb-0.5" />}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {myUrgent > 0 && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Tienes {myUrgent} tarea{myUrgent > 1 ? 's' : ''} que vence{myUrgent > 1 ? 'n' : ''} en los próximos 3 días.
            </p>
          )}
        </div>
      )}

      {/* Mis tareas */}
      {myTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-[#00C2FF]/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#00C2FF]" /> Mis tareas pendientes
            </h2>
            <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold hover:underline">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {myTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_COLOR[task.priority]}`} />
                <p className="text-sm text-slate-700 flex-1 truncate font-medium">{task.name}</p>
                {task.due_date && (
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Tareas recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Tareas recientes
            </h2>
            <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold hover:underline">Ver todas →</Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-10">
              <CheckSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Sin tareas aún</p>
              <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold mt-1 inline-block hover:underline">
                Crear primera tarea →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_COLOR[task.priority]}`} />
                  <p className="text-sm text-slate-700 flex-1 truncate font-medium">{task.name}</p>
                  {task.due_date && (
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">

          {/* Documentos recientes */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Documentos
              </h2>
              <Link href="/documents" className="text-xs text-[#00C2FF] font-semibold hover:underline">Ver todos →</Link>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin documentos aún</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 3).map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-slate-600 truncate text-xs">{doc.name}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                      doc.status === 'review' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{doc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agente AI */}
          <div className="bg-gradient-to-br from-[#1A2744] to-[#243660] rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-[#00C2FF]" />
              <span className="text-sm font-bold">Agente AI</span>
              <span className="text-[9px] bg-[#00C2FF] text-[#1A2744] px-1.5 py-0.5 rounded-full font-bold">BETA</span>
            </div>
            <p className="text-xs text-white/60 mb-4">
              Sube un plano PDF y extrae cuantificación estructural automáticamente.
            </p>
            <Link
              href="/ai-agent"
              className="block w-full bg-[#00C2FF] text-[#1A2744] text-xs font-bold py-2.5 rounded-lg text-center hover:bg-[#00A8E0] transition-colors"
            >
              Analizar plano →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
