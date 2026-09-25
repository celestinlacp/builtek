'use client'

import { useState, useRef } from 'react'
import { updateTaskStatus, deleteTask } from './actions'
import { Task, Project } from '@/types'
import {
  ChevronDown, ChevronRight, MoreHorizontal,
  Calendar, CheckCircle2, Trash2, Edit3, Circle
} from 'lucide-react'
import NewTaskModal from './NewTaskModal'
import EditTaskModal from './EditTaskModal'
import TaskSlideOver from './TaskSlideOver'

type Member = { user_id: string; full_name: string | null; initials: string | null }

type AvailableDoc = {
  id: string
  name: string
  file_type: string
  source: 'document' | 'drive'
}

const SPECIALTIES = [
  '📐 Geométrico', '🪨 Geotecnia', '🏗️ Estructuras',
  '💧 Hidráulica', '⚡ Electromecánico', '🏛️ Arquitectura',
  '🌿 Ambiental', '📋 General',
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-slate-200 text-slate-600' },
  { value: 'in_progress', label: 'En curso', color: 'bg-blue-100 text-blue-700' },
  { value: 'review', label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
  { value: 'done', label: 'Hecho', color: 'bg-green-100 text-green-700' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-red-100 text-red-600' },
]

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-300', medium: 'bg-amber-400',
  high: 'bg-orange-500', urgent: 'bg-red-500',
}

function CountdownBadge({ due_date }: { due_date: string }) {
  const now = new Date()
  const due = new Date(due_date + 'T00:00:00')
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0)   return <span className="hidden md:inline text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Vencida</span>
  if (diffDays === 0) return <span className="hidden md:inline text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Hoy</span>
  if (diffDays <= 3)  return <span className="hidden md:inline text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{diffDays}d</span>
  if (diffDays <= 7)  return <span className="hidden md:inline text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{diffDays}d</span>
  return <span className="hidden md:inline text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{diffDays}d</span>
}

function StatusBadge({ status, taskId }: { status: string; taskId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const current = STATUS_OPTIONS.find(s => s.value === status)

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(v => !v)
  }

  async function change(newStatus: string) {
    setLoading(true)
    setOpen(false)
    await updateTaskStatus(taskId, newStatus)
    setLoading(false)
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${current?.color} hover:opacity-80 transition-opacity`}
      >
        {loading ? '...' : current?.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-36"
            style={{ top: dropPos.top, left: dropPos.left }}
          >
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => change(opt.value)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${opt.value === status ? 'opacity-50' : ''}`}
              >
                <span className={`inline-block px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TaskRow({ task, members, currentUserRole, onEdit, onOpen }: { task: Task & { project?: { name: string } }; members: Member[]; currentUserRole: string; onEdit: (t: Task) => void; onOpen: (t: Task) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canDelete = ['owner', 'admin'].includes(currentUserRole)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return
    await deleteTask(task.id)
  }

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group border-b border-slate-50 transition-colors">
      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

      {/* Name */}
      <button
        onClick={() => onOpen(task)}
        className="flex-1 text-sm text-slate-700 font-medium truncate text-left hover:text-[#00C2FF] transition-colors"
      >
        {task.name}
      </button>

      {/* Project */}
      {task.project && (
        <span className="hidden sm:block text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[120px]">
          {task.project.name}
        </span>
      )}

      {/* Due date + countdown */}
      {task.due_date && (
        <div className={`hidden md:flex items-center gap-1.5 text-xs flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Calendar className="w-3 h-3" />
          {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          {task.status !== 'done' && <CountdownBadge due_date={task.due_date} />}
        </div>
      )}

      {/* Assignee */}
      {task.assignee_id && (() => {
        const m = members.find(m => m.user_id === task.assignee_id)
        const initials = m?.initials || m?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || '?'
        return (
          <div title={m?.full_name || ''} className="hidden sm:flex w-7 h-7 rounded-full bg-[#1A2744] text-white text-[9px] font-bold items-center justify-center flex-shrink-0">
            {initials}
          </div>
        )
      })()}

      {/* Status */}
      <StatusBadge status={task.status} taskId={task.id} />

      {/* Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-36">
              <button
                onClick={() => { setMenuOpen(false); onEdit(task) }}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit3 className="w-3 h-3" /> Editar
              </button>
              {canDelete && (
                <button
                  onClick={() => { setMenuOpen(false); handleDelete() }}
                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SpecialtyGroup({
  specialty, tasks, members, currentUserRole, onEdit, onOpen
}: {
  specialty: string
  tasks: (Task & { project?: { name: string } })[]
  members: Member[]
  currentUserRole: string
  onEdit: (t: Task) => void
  onOpen: (t: Task) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const done = tasks.filter(t => t.status === 'done').length

  return (
    <div className="bg-white rounded-xl border border-slate-100 mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 rounded-t-xl"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
        <span className="text-sm font-bold text-[#1A2744]">{specialty}</span>
        <span className="ml-1 text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{tasks.length}</span>
        {done > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-600 ml-auto">
            <CheckCircle2 className="w-3 h-3" /> {done} listos
          </span>
        )}
      </button>
      {!collapsed && (
        <div>
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} members={members} currentUserRole={currentUserRole} onEdit={onEdit} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

type ExtendedTask = Task & { project?: { name: string } }

export default function TaskBoard({
  tasks, projects, members, availableDocs, currentUserId, currentUserRole, workspaceId
}: {
  tasks: ExtendedTask[]
  projects: Project[]
  members: Member[]
  availableDocs: AvailableDoc[]
  currentUserId: string
  currentUserRole: string
  workspaceId: string
}) {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [filter, setFilter] = useState<string>('all')
  const [showNew, setShowNew] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [slideTask, setSlideTask] = useState<ExtendedTask | null>(null)

  const filtered = filter === 'all' ? tasks
    : tasks.filter(t => t.status === filter)

  // Agrupar por especialidad
  const groups: Record<string, ExtendedTask[]> = {}
  filtered.forEach(task => {
    const key = task.specialty || '📋 General'
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  })

  // Orden por specialties definidas
  const orderedGroups = SPECIALTIES
    .filter(s => groups[s])
    .map(s => ({ specialty: s, tasks: groups[s] }))

  // Agregar specialties no listadas
  Object.keys(groups)
    .filter(k => !SPECIALTIES.includes(k))
    .forEach(k => orderedGroups.push({ specialty: k, tasks: groups[k] }))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter by status */}
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'in_progress', label: 'En curso' },
            { value: 'blocked', label: 'Bloqueadas' },
            { value: 'done', label: 'Hechas' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === f.value
                  ? 'bg-[#1A2744] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {tasks.filter(t => t.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['board', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === v ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'board' ? '⊞ Tablero' : '☰ Lista'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#1A2744] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#243660] transition-colors"
          >
            + Nueva tarea
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'board' ? (
        orderedGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
            <Circle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay tareas{filter !== 'all' ? ' con este filtro' : ' aún'}</p>
            <button onClick={() => setShowNew(true)} className="mt-3 text-xs text-[#00C2FF] font-semibold hover:underline">
              Crear primera tarea →
            </button>
          </div>
        ) : (
          <div>
            {orderedGroups.map(({ specialty, tasks: groupTasks }) => (
              <SpecialtyGroup
                key={specialty}
                specialty={specialty}
                tasks={groupTasks}
                members={members}
                currentUserRole={currentUserRole}
                onEdit={setEditTask}
                onOpen={setSlideTask}
              />
            ))}
          </div>
        )
      ) : (
        // List view — todas sin agrupar
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <div className="w-2" />
            <span className="flex-1">Tarea</span>
            <span className="hidden sm:block w-28">Proyecto</span>
            <span className="hidden md:block w-20">Fecha</span>
            <span className="w-24">Estado</span>
            <span className="w-7" />
          </div>
          {filtered.length === 0
            ? <p className="text-center text-sm text-slate-400 py-10">Sin tareas</p>
            : filtered.map(task => (
              <TaskRow key={task.id} task={task} members={members} currentUserRole={currentUserRole} onEdit={setEditTask} onOpen={setSlideTask} />
            ))
          }
        </div>
      )}

      {showNew && (
        <NewTaskModal
          projects={projects}
          specialties={SPECIALTIES}
          members={members}
          onClose={() => setShowNew(false)}
        />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          specialties={SPECIALTIES}
          onClose={() => setEditTask(null)}
        />
      )}
      {slideTask && (
        <TaskSlideOver
          task={slideTask}
          availableDocs={availableDocs}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          members={members}
          workspaceId={workspaceId}
          onClose={() => setSlideTask(null)}
        />
      )}
    </div>
  )
}
