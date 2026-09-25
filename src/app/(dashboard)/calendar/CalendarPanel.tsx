'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarTask = {
  id: string
  name: string
  status: string
  priority: string
  due_date: string
  created_at?: string
  assignee_name?: string | null
  project?: { name: string } | null
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_STYLE: Record<string, { bar: string; bg: string; text: string }> = {
  pending:     { bar: 'bg-slate-400',   bg: 'bg-slate-100',  text: 'text-slate-600' },
  in_progress: { bar: 'bg-[#00C2FF]',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  review:      { bar: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  done:        { bar: 'bg-green-500',   bg: 'bg-green-50',   text: 'text-green-700' },
  blocked:     { bar: 'bg-red-400',     bg: 'bg-red-50',     text: 'text-red-700' },
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En progreso',
  review: 'Revisión', done: 'Terminado', blocked: 'Bloqueado',
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildWeeks(year: number, month: number) {
  // Monday-first grid
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: { date: Date; current: boolean }[] = []

  // Previous month padding
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), current: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  // Next month padding
  const tail = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= tail; i++) {
    cells.push({ date: new Date(year, month + 1, i), current: false })
  }

  // Split into weeks
  const weeks: { date: Date; current: boolean }[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function GanttView({ tasks, year, month }: { tasks: CalendarTask[]; year: number; month: number }) {
  const monthStart = new Date(year, month, 1)
  const monthEnd   = new Date(year, month + 1, 0)
  const totalDays  = monthEnd.getDate()
  const today      = new Date()
  const isSameMonth = today.getFullYear() === year && today.getMonth() === month
  const todayLeft   = isSameMonth ? ((today.getDate() - 1) / totalDays) * 100 : null

  const visible = tasks
    .filter(t => {
      const due   = new Date(t.due_date + 'T00:00:00')
      const start = t.created_at ? new Date(t.created_at) : due
      return due >= monthStart && start <= monthEnd
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-slate-400">
        No hay tareas con fecha límite en este mes
      </div>
    )
  }

  function barPos(task: CalendarTask) {
    const due    = new Date(task.due_date + 'T00:00:00')
    const raw    = task.created_at ? new Date(task.created_at) : due
    const start  = raw < monthStart ? monthStart : raw
    const end    = due > monthEnd   ? monthEnd   : due
    const left   = ((start.getDate() - 1) / totalDays) * 100
    const width  = Math.max(((end.getDate() - start.getDate() + 1) / totalDays) * 100, 2)
    return { left, width }
  }

  const dayMarkers = [1, 5, 10, 15, 20, 25, totalDays].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="px-5 py-5">
      {/* Day axis */}
      <div className="flex mb-3">
        <div className="w-[38%] flex-shrink-0" />
        <div className="flex-1 relative h-4">
          {dayMarkers.map(d => (
            <span key={d} className="absolute text-[10px] text-slate-400 font-medium -translate-x-1/2"
              style={{ left: `${((d - 1) / totalDays) * 100}%` }}>
              {d}
            </span>
          ))}
        </div>
        <div className="w-14 flex-shrink-0" />
      </div>

      {/* Task rows */}
      <div className="space-y-2">
        {visible.map(task => {
          const { left, width } = barPos(task)
          const s = STATUS_STYLE[task.status] || STATUS_STYLE.pending
          const isOverdue = new Date(task.due_date + 'T00:00:00') < today && task.status !== 'done'
          const initials = task.assignee_name
            ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div key={task.id} className="flex items-center gap-2 h-9">
              {/* Label */}
              <div className="w-[38%] flex-shrink-0 pr-2">
                <p className="text-xs font-medium text-slate-700 truncate leading-tight">{task.name}</p>
                {task.project?.name && (
                  <p className="text-[10px] text-slate-400 truncate">{task.project.name}</p>
                )}
              </div>

              {/* Bar track */}
              <div className="flex-1 relative h-6 rounded-full bg-slate-50 overflow-hidden">
                {todayLeft !== null && (
                  <div className="absolute top-0 bottom-0 w-px bg-[#00C2FF]/50 z-10"
                    style={{ left: `${todayLeft}%` }} />
                )}
                <div
                  className={`absolute top-1 bottom-1 rounded-full flex items-center px-1.5 ${s.bar} opacity-80`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${task.name}${task.assignee_name ? ' · ' + task.assignee_name : ''}`}
                >
                  {initials && (
                    <span className="text-[8px] font-bold text-white truncate">{initials}</span>
                  )}
                </div>
              </div>

              {/* Due date */}
              <div className="w-14 flex-shrink-0 text-right">
                <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 pt-3 border-t border-slate-100 flex-wrap">
        {todayLeft !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#00C2FF]/60" />
            <span className="text-[10px] text-slate-400">Hoy</span>
          </div>
        )}
        {Object.entries(STATUS_STYLE).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.bar}`} />
            <span className="text-[10px] text-slate-500">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CalendarPanel({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calView, setCalView] = useState<'month' | 'gantt'>('month')

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const weeks = buildWeeks(year, month)
  const todayKey = toKey(today)

  // Index tasks by their due_date key
  const byDate: Record<string, CalendarTask[]> = {}
  tasks.forEach(t => {
    const key = t.due_date.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(t)
  })

  // Count tasks with due_date in this month (for the header stat)
  const monthTasks = tasks.filter(t => {
    const d = new Date(t.due_date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">

      {/* ── Navigation header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={prev}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-[#1A2744]">
              {MONTHS[month]} {year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {monthTasks.length} tarea{monthTasks.length !== 1 ? 's' : ''} con fecha límite este mes
            </p>
          </div>
          <button onClick={next}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['month', 'gantt'] as const).map(v => (
              <button key={v} onClick={() => setCalView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  calView === v ? 'bg-white text-[#1A2744] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {v === 'month' ? '📅 Mes' : '📊 Gantt'}
              </button>
            ))}
          </div>
          <button onClick={goToday}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Hoy
          </button>
        </div>
      </div>

      {/* ── Gantt view ── */}
      {calView === 'gantt' && (
        <GanttView tasks={tasks} year={year} month={month} />
      )}

      {/* ── Calendar grid ── */}
      {calView === 'month' && <div className="p-4">

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map(({ date, current }) => {
                const key = toKey(date)
                const dayTasks = byDate[key] || []
                const isToday = key === todayKey

                return (
                  <div key={key}
                    className={`min-h-[90px] rounded-lg p-1.5 border transition-colors ${
                      isToday
                        ? 'border-[#00C2FF]/40 bg-[#00C2FF]/3'
                        : current
                        ? 'border-transparent bg-white hover:bg-slate-50/80'
                        : 'border-transparent bg-slate-50/40'
                    }`}>

                    {/* Day number */}
                    <div className="flex justify-end mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        isToday
                          ? 'bg-[#1A2744] text-white'
                          : current
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Task chips */}
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => {
                        const s = STATUS_STYLE[task.status] || STATUS_STYLE.pending
                        return (
                          <div key={task.id}
                            title={`${task.name}${task.project ? ' · ' + task.project.name : ''}`}
                            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium truncate ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.bar}`} />
                            <span className="truncate">{task.name}</span>
                          </div>
                        )
                      })}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-slate-400 pl-1 font-medium">+{dayTasks.length - 3} más</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      }

      {/* ── Leyenda (solo vista mes) ── */}
      {calView === 'month' && <div className="flex items-center gap-5 px-6 py-3 border-t border-slate-100 flex-wrap">
        {Object.entries(STATUS_STYLE).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.bar}`} />
            <span className="text-xs text-slate-500">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>}
    </div>
  )
}
