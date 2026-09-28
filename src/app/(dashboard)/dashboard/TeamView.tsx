'use client'

import { useState } from 'react'
import { Users, ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle2, Clock, TrendingUp, UserCheck } from 'lucide-react'
import Link from 'next/link'

export type TeamMemberStats = {
  user_id:    string
  full_name:  string | null
  initials:   string | null
  total:      number
  done:       number
  in_progress: number
  pending:    number
  overdue:    number
  score:      number | null
  tasks: Array<{
    id:         string
    name:       string
    status:     string
    priority:   string
    due_date:   string | null
    project_id: string | null
  }>
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En curso',
  review: 'En revisión', done: 'Hecho', blocked: 'Bloqueado',
}
const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review:      'bg-amber-100 text-amber-700',
  done:        'bg-green-100 text-green-700',
  blocked:     'bg-red-100 text-red-600',
}
const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-300', medium: 'bg-amber-400',
  high: 'bg-orange-500', urgent: 'bg-red-500',
}

function scoreBadge(s: number | null) {
  if (s === null) return 'bg-slate-100 text-slate-400'
  if (s >= 70) return 'bg-green-100 text-green-700'
  if (s >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function scoreBarColor(s: number | null) {
  if (s === null) return 'bg-slate-200'
  if (s >= 70) return 'bg-green-500'
  if (s >= 40) return 'bg-amber-400'
  return 'bg-red-500'
}

export default function TeamView({ members }: { members: TeamMemberStats[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  // KPI totals
  const totalMembers  = members.length
  const totalTasks    = members.reduce((s, m) => s + m.total, 0)
  const totalDone     = members.reduce((s, m) => s + m.done, 0)
  const totalOverdue  = members.reduce((s, m) => s + m.overdue, 0)
  const completionPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const activeMembers = members.filter(m => m.total > 0).length

  const selectedMember = members.find(m => m.user_id === selected)
  const activeTasks = selectedMember?.tasks.filter(t => t.status !== 'done') ?? []

  const now = new Date()
  function isOverdue(t: { due_date: string | null; status: string }) {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < now
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00C2FF]" />
          Vista del equipo
        </h2>
        <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold hover:underline">
          Ver tareas →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Miembros</span>
          </div>
          <p className="text-2xl font-black text-[#1A2744]">{totalMembers}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{activeMembers} con tareas</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tareas</span>
          </div>
          <p className="text-2xl font-black text-[#1A2744]">{totalTasks}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalDone} completadas</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avance</span>
          </div>
          <p className="text-2xl font-black text-green-600">{completionPct}%</p>
          <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        <div className={`rounded-xl p-3 border ${totalOverdue > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertCircle className={`w-3.5 h-3.5 ${totalOverdue > 0 ? 'text-red-500' : 'text-slate-300'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Vencidas</span>
          </div>
          <p className={`text-2xl font-black ${totalOverdue > 0 ? 'text-red-500' : 'text-slate-300'}`}>{totalOverdue}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {totalOverdue > 0 ? 'Requieren atención' : 'Sin vencidas'}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
          Rendimiento individual · Hecho = 100% · En revisión = 50%
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="text-left pb-2">Miembro</th>
                <th className="text-center pb-2 px-2">Total</th>
                <th className="text-center pb-2 px-2">Hechas</th>
                <th className="text-center pb-2 px-2">En curso</th>
                <th className="text-center pb-2 px-2">Pendientes</th>
                <th className="text-center pb-2 px-2">Vencidas</th>
                <th className="text-left pb-2 pl-3 min-w-[120px]">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(m => {
                const isSelected = selected === m.user_id
                return (
                  <tr
                    key={m.user_id}
                    onClick={() => setSelected(isSelected ? null : m.user_id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-[#00C2FF]/5' : ''}`}
                  >
                    {/* Avatar + nombre */}
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1A2744] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {m.initials || (m.full_name?.[0] ?? '?')}
                        </div>
                        <div>
                          <span className="font-medium text-slate-700 block truncate max-w-[140px] leading-tight">
                            {m.full_name || 'Sin nombre'}
                          </span>
                          {m.total === 0 && (
                            <span className="text-[10px] text-slate-400">Sin tareas</span>
                          )}
                        </div>
                        {isSelected
                          ? <ChevronUp className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          : <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0 opacity-30" />
                        }
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 font-semibold text-slate-700">{m.total}</td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-semibold ${m.done > 0 ? 'text-green-600' : 'text-slate-300'}`}>{m.done}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-semibold ${m.in_progress > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{m.in_progress}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-semibold ${m.pending > 0 ? 'text-slate-500' : 'text-slate-300'}`}>{m.pending}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {m.overdue > 0
                        ? <span className="inline-flex items-center gap-1 font-bold text-red-500">
                            <Zap className="w-3 h-3" />{m.overdue}
                          </span>
                        : <span className="text-slate-300 font-semibold">0</span>
                      }
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(m.score)}`}
                            style={{ width: `${m.score ?? 0}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${scoreBadge(m.score)}`}>
                          {m.score !== null ? `${m.score}%` : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel expandido del usuario seleccionado */}
      {selectedMember && (
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1A2744] text-white text-[10px] font-bold flex items-center justify-center">
                {selectedMember.initials || selectedMember.full_name?.[0] || '?'}
              </div>
              <p className="text-xs font-bold text-slate-600">
                {selectedMember.full_name} — tareas activas
              </p>
            </div>
            <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold hover:underline">
              Ver en tareas →
            </Link>
          </div>

          {activeTasks.length === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-xs text-slate-400">Sin tareas activas</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {activeTasks.map(t => {
                const overdue = isOverdue(t)
                const daysLeft = t.due_date
                  ? Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <div key={t.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${overdue ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-slate-300'}`} />
                    <p className="text-sm text-slate-700 flex-1 truncate">{t.name}</p>
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-semibold flex items-center gap-0.5 flex-shrink-0 ${
                        overdue ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {overdue
                          ? <><AlertCircle className="w-3 h-3" /> {Math.abs(daysLeft)}d vencida</>
                          : `${daysLeft}d`
                        }
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${STATUS_COLOR[t.status] ?? ''}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
