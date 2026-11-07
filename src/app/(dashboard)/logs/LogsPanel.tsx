'use client'

import { useState, useMemo, useRef } from 'react'
import {
  Upload, CheckSquare, Clock, Share2, UserPlus, FileText,
  HardDrive, RefreshCw, Filter, Users, MessageCircle, AlertCircle,
  Copy, Check
} from 'lucide-react'

type LogEntry = {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  entity_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_id: string | null
  user_name: string
  user_initials: string
}

type Member = {
  id: string
  full_name: string
  initials: string
  last_seen_at: string | null
  role: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type ActionMeta = { label: string; icon: React.ElementType; color: string }

function getActionMeta(action: string): ActionMeta {
  switch (action) {
    case 'task_created':     return { label: 'Creó tarea',           icon: CheckSquare, color: 'text-blue-500 bg-blue-50' }
    case 'task_completed':   return { label: 'Completó tarea',       icon: CheckSquare, color: 'text-green-600 bg-green-50' }
    case 'task_reprogram':   return { label: 'Reprogramó tarea',     icon: RefreshCw,   color: 'text-orange-500 bg-orange-50' }
    case 'document_upload':  return { label: 'Subió documento',      icon: FileText,    color: 'text-purple-500 bg-purple-50' }
    case 'drive_upload':     return { label: 'Subió archivo (Drive)',icon: HardDrive,   color: 'text-indigo-500 bg-indigo-50' }
    case 'share_link_created':    return { label: 'Compartió enlace',   icon: Share2,  color: 'text-cyan-600 bg-cyan-50' }
    case 'share_project_created': return { label: 'Compartió proyecto', icon: Share2,  color: 'text-cyan-600 bg-cyan-50' }
    case 'member_invited':   return { label: 'Invitó a un miembro',  icon: UserPlus,      color: 'text-pink-500 bg-pink-50' }
    case 'whatsapp_sent':    return { label: 'WhatsApp enviado',     icon: MessageCircle, color: 'text-green-600 bg-green-50' }
    case 'whatsapp_error':   return { label: 'Error WhatsApp',       icon: AlertCircle,   color: 'text-red-500 bg-red-50' }
    default:                 return { label: action,                  icon: Clock,         color: 'text-slate-400 bg-slate-100' }
  }
}

const ACTION_GROUPS: { label: string; values: string[] }[] = [
  { label: 'Tareas',     values: ['task_created', 'task_completed', 'task_reprogram'] },
  { label: 'Documentos', values: ['document_upload'] },
  { label: 'Drive',      values: ['drive_upload'] },
  { label: 'Compartir',  values: ['share_link_created', 'share_project_created'] },
  { label: 'Equipo',     values: ['member_invited'] },
  { label: 'WhatsApp',   values: ['whatsapp_sent', 'whatsapp_error'] },
]

export default function LogsPanel({ logs, members }: { logs: LogEntry[]; members: Member[] }) {
  const [filterUser, setFilterUser]     = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopyErrors() {
    const errorLogs = logs
      .filter(l => l.action.includes('_error') || l.action === 'error')
      .slice(0, 20)

    let texto: string

    if (errorLogs.length === 0) {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm   = String(now.getMonth() + 1).padStart(2, '0')
      const dd   = String(now.getDate()).padStart(2, '0')
      texto = `Sin errores en los últimos registros — Builtek ${yyyy}-${mm}-${dd}`
    } else {
      texto = errorLogs.map(l => {
        const d    = new Date(l.created_at)
        const yyyy = d.getFullYear()
        const mm   = String(d.getMonth() + 1).padStart(2, '0')
        const dd   = String(d.getDate()).padStart(2, '0')
        const hh   = String(d.getHours()).padStart(2, '0')
        const min  = String(d.getMinutes()).padStart(2, '0')
        const fecha = `${yyyy}-${mm}-${dd} ${hh}:${min}`

        let detalle = ''
        if (l.action === 'whatsapp_error' && l.metadata) {
          detalle = [
            l.metadata.phone    ? `→ ${l.metadata.phone}`             : null,
            l.metadata.template ? `plantilla: ${l.metadata.template}` : null,
            `Error: ${l.metadata.error ?? 'desconocido'}`,
          ].filter(Boolean).join(' · ')
        } else if (l.metadata && Object.keys(l.metadata).length > 0) {
          detalle = JSON.stringify(l.metadata)
        }

        return `[${fecha}] ERROR ${l.action} — ${l.user_name}${detalle ? ' · ' + detalle : ''}`
      }).join('\n')
    }

    navigator.clipboard.writeText(texto)

    if (timerRef.current) clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const users = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of logs) {
      if (l.user_id) map.set(l.user_id, l.user_name)
    }
    return [...map.entries()]
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterUser !== 'all' && l.user_id !== filterUser) return false
      if (filterAction !== 'all') {
        const group = ACTION_GROUPS.find(g => g.label === filterAction)
        if (group && !group.values.includes(l.action)) return false
      }
      return true
    })
  }, [logs, filterUser, filterAction])

  return (
    <div className="flex gap-6">
      {/* Main timeline */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30"
          >
            <option value="all">Todos los usuarios</option>
            {users.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/30"
          >
            <option value="all">Todas las acciones</option>
            {ACTION_GROUPS.map(g => (
              <option key={g.label} value={g.label}>{g.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleCopyErrors}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '¡Copiado!' : 'Copiar errores'}
          </button>
        </div>

        {/* Timeline */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Sin registros para estos filtros.</div>
        ) : (
          <ol className="relative border-l border-slate-200 space-y-0 ml-2">
            {filtered.map(log => {
              const { label, icon: Icon, color } = getActionMeta(log.action)
              return (
                <li key={log.id} className="ml-6 pb-6">
                  {/* dot */}
                  <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${color}`}>
                    <Icon className="w-3 h-3" />
                  </span>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* User + action */}
                      <p className="text-sm text-slate-800">
                        <span className="font-semibold">{log.user_name}</span>
                        <span className="text-slate-500"> · {label}</span>
                        {log.entity_name && (
                          <span className="text-slate-700 font-medium"> — {log.entity_name}</span>
                        )}
                      </p>
                      {/* Metadata extras */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.action === 'task_reprogram' && log.metadata.new_date
                            ? `Nueva fecha: ${log.metadata.new_date}`
                            : log.action === 'drive_upload' && log.metadata.file_type
                            ? `${log.metadata.file_type}`
                            : (log.action === 'whatsapp_sent' || log.action === 'whatsapp_error')
                            ? [
                                log.metadata.phone ? `→ ${log.metadata.phone}` : null,
                                log.metadata.template ? `plantilla: ${log.metadata.template}` : null,
                                log.metadata.resend ? '(reenvío)' : null,
                                log.metadata.oficio_id ? 'desde oficio' : null,
                                log.action === 'whatsapp_error' ? `Error: ${log.metadata.error ?? 'desconocido'}` : null,
                              ].filter(Boolean).join(' · ')
                            : null}
                        </p>
                      )}
                    </div>
                    <time
                      dateTime={log.created_at}
                      title={formatDate(log.created_at)}
                      className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5"
                    >
                      {relativeTime(log.created_at)}
                    </time>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* Members sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Conexiones del equipo</h2>
          </div>
          <ul className="space-y-3">
            {members.map(m => {
              const seenMins = m.last_seen_at
                ? Math.floor((Date.now() - new Date(m.last_seen_at).getTime()) / 60000)
                : null
              const isOnline = seenMins !== null && seenMins < 5
              return (
                <li key={m.id} className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#1A2744] flex items-center justify-center text-white text-xs font-bold">
                      {m.initials ?? m.full_name?.[0] ?? '?'}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{m.full_name}</p>
                    <p className="text-[11px] text-slate-400">
                      {m.last_seen_at
                        ? isOnline ? 'En línea' : relativeTime(m.last_seen_at)
                        : 'Sin conexión registrada'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
