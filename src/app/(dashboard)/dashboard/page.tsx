import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, FolderOpen, FileText, Bot, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

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

  const [projects, tasks, documents] = await Promise.all([
    supabase.from('projects').select('id, name, status').eq('workspace_id', wsId),
    supabase.from('tasks').select('id, name, status, priority, due_date, project_id, assignee_id').order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  return {
    workspace: membership.workspaces as unknown as { id: string; name: string },
    projects: projects.data || [],
    tasks: tasks.data || [],
    documents: documents.data || [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getWorkspaceData(user.id)
  if (!data) redirect('/onboarding')

  const { workspace, projects, tasks, documents } = data

  const tasksDone = tasks.filter(t => t.status === 'done').length
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length
  const tasksBlocked = tasks.filter(t => t.status === 'blocked').length
  const tasksPending = tasks.filter(t => t.status === 'pending').length
  const progressPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0

  const recentTasks = tasks.slice(0, 6)
  const myTasks = tasks.filter((t: any) => t.assignee_id === user.id && t.status !== 'done').slice(0, 5)

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
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744]">{greeting}, {firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">{workspace.name} — resumen del proyecto</p>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#243660] transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Nueva tarea
        </Link>
      </div>

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
              <span className="text-sm font-semibold text-[#1A2744]">Avance general del proyecto</span>
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
