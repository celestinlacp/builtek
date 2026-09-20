'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarTask = {
  id: string
  name: string
  status: string
  priority: string
  due_date: string
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

export default function CalendarPanel({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

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
        <button onClick={goToday}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Hoy
        </button>
      </div>

      {/* ── Calendar grid ── */}
      <div className="p-4">

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

      {/* ── Leyenda ── */}
      <div className="flex items-center gap-5 px-6 py-3 border-t border-slate-100 flex-wrap">
        {Object.entries(STATUS_STYLE).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.bar}`} />
            <span className="text-xs text-slate-500">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
