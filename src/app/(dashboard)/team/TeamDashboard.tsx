'use client'

import { useState } from 'react'
import {
  Users, AlertCircle, TrendingUp, Clock, CheckCircle2,
  Zap, ChevronDown, ChevronUp, UserCheck, BarChart2, Shield
} from 'lucide-react'
import Link from 'next/link'
import type { TeamMemberStats } from '../dashboard/TeamView'

type MemberWithRole = TeamMemberStats & { role?: string; review?: number; blocked?: number }

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
const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', manager: 'Manager', member: 'Miembro',
}
const ROLE_COLOR: Record<string, string> = {
  owner:   'bg-[#1A2744] text-white',
  admin:   'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  member:  'bg-slate-100 text-slate-500',
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

function scoreLabel(s: number | null) {
  if (s === null) return 'Sin tareas'
  if (s >= 70) return 'Buen ritmo'
  if (s >= 40) return 'En progreso'
  return 'Bajo rendimiento'
}

export default function TeamDashboard({
  members,
  workspaceName,
  currentUserRole,
}: {
  members: MemberWithRole[]
  workspaceName: string
  currentUserRole: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'overdue' | 'total' | 'name'>('overdue')

  // KPIs
  const totalMembers  = members.length
  const totalTasks    = members.reduce((s, m) => s + m.total, 0)
  const totalDone     = members.reduce((s, m) => s + m.done, 0)
  const totalOverdue  = members.reduce((s, m) => s + m.overdue, 0)
  const totalBlocked  = members.reduce((s, m) => s + (m.blocked ?? 0), 0)
  const activeMembers = members.filter(m => m.total > 0).length
  const completionPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const avgScore      = members.filter(m => m.score !== null).length > 0
    ? Math.round(members.filter(m => m.score !== null).reduce((s, m) => s + (m.score ?? 0), 0) / members.filter(m => m.score !== null).length)
    : null

  const sorted = [...members].sort((a, b) => {
    if (sortBy === 'score')  return (b.score ?? -1) - (a.score ?? -1)
    if (sortBy === 'overdue') return b.overdue - a.overdue
    if (sortBy === 'total')  return b.total - a.total
    if (sortBy === 'name')   return (a.full_name ?? '').localeCompare(b.full_name ?? '')
    return 0
  })

  const selectedMember = members.find(m => m.user_id === selected)
  const activeTasks = selectedMember?.tasks.filter(t => t.status !== 'done') ?? []
  const doneTasks   = selectedMember?.tasks.filter(t => t.status === 'done') ?? []

  const now = new Date()
  function isOverdue(t: { due_date: string | null; status: string }) {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < now
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#00C2FF]" />
            Rendimiento del equipo
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{workspaceName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Solo visible para {ROLE_LABEL[currentUserRole] ?? currentUserRole}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#1A2744]" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipo</span>
          </div>
          <p className="text-3xl font-black text-[#1A2744]">{totalMembers}</p>
          <p className="text-xs text-slate-400 mt-1">{activeMembers} con tareas · {totalMembers - activeMembers} sin asignar</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tareas</span>
          </div>
          <p className="text-3xl font-black text-[#1A2744]">{totalTasks}</p>
          <p className="text-xs text-slate-400 mt-1">{totalDone} completadas · {totalTasks - totalDone} activas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avance</span>
          </div>
          <p className="text-3xl font-black text-green-600">{completionPct}%</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${totalOverdue > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalOverdue > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <AlertCircle className={`w-4 h-4 ${totalOverdue > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vencidas</span>
          </div>
          <p className={`text-3xl font-black ${totalOverdue > 0 ? 'text-red-500' : 'text-slate-300'}`}>{totalOverdue}</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalBlocked > 0 ? `+ ${totalBlocked} bloqueadas` : 'Sin bloqueadas'}
          </p>
        </div>

      </div>

      {/* Score promedio del equipo */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-[#1A2744]">Score promedio del equipo</p>
            <p className="text-xs text-slate-400 mt-0.5">Hecho = 100% · En revisión = 50%</p>
          </div>
          <div className={`text-right`}>
            <p className={`text-4xl font-black ${avgScore === null ? 'text-slate-300' : avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </p>
            <p className="text-xs text-slate-400">{avgScore !== null ? scoreLabel(avgScore) : 'Sin datos'}</p>
          </div>
        </div>
        {/* Mini barras por miembro */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.filter(m => m.total > 0).map(m => (
            <div
              key={m.user_id}
              onClick={() => setSelected(selected === m.user_id ? null : m.user_id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selected === m.user_id ? 'border-[#00C2FF] bg-[#00C2FF]/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#1A2744] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {m.initials || m.full_name?.[0] || '?'}
                </div>
                <span className="text-xs font-medium text-slate-700 truncate">{m.full_name || 'Sin nombre'}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full ${scoreBarColor(m.score)}`} style={{ width: `${m.score ?? 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{m.total} tareas</span>
                <span className={`text-[10px] font-bold ${scoreBadge(m.score).split(' ')[1]}`}>
                  {m.score !== null ? `${m.score}%` : '—'}
                </span>
              </div>
            </div>
          ))}
          {members.filter(m => m.total === 0).map(m => (
            <div key={m.user_id} className="p-3 rounded-lg border border-dashed border-slate-200 bg-white opacity-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-300 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {m.initials || m.full_name?.[0] || '?'}
                </div>
                <span className="text-xs font-medium text-slate-400 truncate">{m.full_name || 'Sin nombre'}</span>
              </div>
              <p className="text-[10px] text-slate-300 text-center">Sin tareas asignadas</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1A2744] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00C2FF]" />
            Detalle por miembro
          </h2>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
          >
            <option value="overdue">Ordenar: Vencidas</option>
            <option value="score">Ordenar: Score</option>
            <option value="total">Ordenar: Total tareas</option>
            <option value="name">Ordenar: Nombre</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="text-left pb-2">Miembro</th>
                <th className="text-center pb-2 px-2">Rol</th>
                <th className="text-center pb-2 px-2">Total</th>
                <th className="text-center pb-2 px-2">Hechas</th>
                <th className="text-center pb-2 px-2">En curso</th>
                <th className="text-center pb-2 px-2">Revisión</th>
                <th className="text-center pb-2 px-2">Pendientes</th>
                <th className="text-center pb-2 px-2">Bloqueadas</th>
                <th className="text-center pb-2 px-2">Vencidas</th>
                <th className="text-left pb-2 pl-3 min-w-[140px]">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(m => {
                const isSelected = selected === m.user_id
                return (
                  <>
                    <tr
                      key={m.user_id}
                      onClick={() => setSelected(isSelected ? null : m.user_id)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-[#00C2FF]/5' : ''}`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1A2744] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {m.initials || m.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <span className="font-medium text-slate-700 block truncate max-w-[160px] leading-tight">
                              {m.full_name || 'Sin nombre'}
                            </span>
                            {m.total === 0 && <span className="text-[10px] text-slate-400">Sin tareas</span>}
                          </div>
                          {isSelected
                            ? <ChevronUp className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            : <ChevronDown className="w-3 h-3 text-slate-300 flex-shrink-0" />
                          }
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[m.role ?? 'member'] ?? 'bg-slate-100 text-slate-500'}`}>
                          {ROLE_LABEL[m.role ?? 'member'] ?? m.role}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2 font-semibold text-slate-700">{m.total}</td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-semibold ${m.done > 0 ? 'text-green-600' : 'text-slate-300'}`}>{m.done}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-semibold ${m.in_progress > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{m.in_progress}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-semibold ${(m.review ?? 0) > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{m.review ?? 0}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-semibold ${m.pending > 0 ? 'text-slate-500' : 'text-slate-300'}`}>{m.pending}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {(m.blocked ?? 0) > 0
                          ? <span className="font-bold text-red-400">{m.blocked}</span>
                          : <span className="text-slate-300">0</span>
                        }
                      </td>
                      <td className="text-center py-3 px-2">
                        {m.overdue > 0
                          ? <span className="inline-flex items-center gap-1 font-bold text-red-500">
                              <Zap className="w-3 h-3" />{m.overdue}
                            </span>
                          : <span className="text-slate-300">0</span>
                        }
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[70px]">
                            <div className={`h-full rounded-full ${scoreBarColor(m.score)}`} style={{ width: `${m.score ?? 0}%` }} />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${scoreBadge(m.score)}`}>
                            {m.score !== null ? `${m.score}%` : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida */}
                    {isSelected && (
                      <tr key={`${m.user_id}-detail`}>
                        <td colSpan={10} className="pb-3 pt-0">
                          <div className="mx-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Tareas activas — {m.full_name}
                              </p>
                              <Link href="/tasks" className="text-xs text-[#00C2FF] font-semibold hover:underline">
                                Ver en tareas →
                              </Link>
                            </div>

                            {activeTasks.length === 0 ? (
                              <div className="flex items-center gap-2 py-3 justify-center">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <p className="text-xs text-slate-400">Sin tareas activas</p>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {activeTasks.map(t => {
                                  const overdue = isOverdue(t)
                                  const daysLeft = t.due_date
                                    ? Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                    : null
                                  return (
                                    <div key={t.id}
                                      className={`flex items-center gap-3 p-2.5 rounded-lg ${overdue ? 'bg-red-50 border border-red-100' : 'bg-white border border-slate-100'}`}>
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

                            {doneTasks.length > 0 && (
                              <p className="text-[10px] text-slate-400 mt-3 text-right">
                                + {doneTasks.length} tarea{doneTasks.length > 1 ? 's' : ''} completada{doneTasks.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
