'use client'

import { Bell, Search, CheckCheck, UserCircle, Settings, LogOut, MessageSquare, CheckSquare, FileText, FolderOpen, Loader2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'

// ── Global Search ──────────────────────────────────────────────────────────────

type SearchResult = {
  id: string
  type: 'task' | 'document' | 'project'
  name: string
  subtitle?: string | null
  href: string
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  task: 'Tarea',
  document: 'Documento',
  project: 'Proyecto',
}

const TYPE_ICON: Record<SearchResult['type'], React.ReactNode> = {
  task: <CheckSquare className="w-3.5 h-3.5 text-[#00C2FF]" />,
  document: <FileText className="w-3.5 h-3.5 text-slate-400" />,
  project: <FolderOpen className="w-3.5 h-3.5 text-amber-400" />,
}

function GlobalSearch({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const projectIdsRef = useRef<string[]>([])

  // Cache project IDs for the workspace on mount
  useEffect(() => {
    if (!workspaceId || workspaceId === 'dev') return
    const supabase = createClient()
    supabase.from('projects').select('id').eq('workspace_id', workspaceId).then(({ data }) => {
      projectIdsRef.current = (data ?? []).map((p: { id: string }) => p.id)
    })
  }, [workspaceId])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const q = `%${query}%`
      const ids = projectIdsRef.current

      const [projRes, taskRes, docRes] = await Promise.all([
        supabase.from('projects').select('id, name, status').eq('workspace_id', workspaceId).ilike('name', q).limit(4),
        ids.length > 0
          ? supabase.from('tasks').select('id, name, status, project_id').in('project_id', ids).ilike('name', q).limit(5)
          : Promise.resolve({ data: [] as any[] }),
        ids.length > 0
          ? supabase.from('documents').select('id, name, status, project_id').in('project_id', ids).ilike('name', q).limit(5)
          : Promise.resolve({ data: [] as any[] }),
      ])

      const raw: SearchResult[] = [
        ...(projRes.data ?? []).map((p: any) => ({ id: p.id, type: 'project' as const, name: p.name, subtitle: p.status, href: '/tasks' })),
        ...(taskRes.data ?? []).map((t: any) => ({ id: t.id, type: 'task' as const, name: t.name, subtitle: t.status, href: `/tasks?task=${t.id}` })),
        ...(docRes.data ?? []).map((d: any) => ({ id: d.id, type: 'document' as const, name: d.name, subtitle: d.status, href: '/documents' })),
      ]

      // Prioritize results matching the current page
      const pageType: SearchResult['type'] | null = pathname.includes('/tasks') ? 'task'
        : pathname.includes('/documents') ? 'document'
        : pathname.includes('/projects') ? 'project'
        : null

      const sorted = pageType
        ? [...raw.filter(r => r.type === pageType), ...raw.filter(r => r.type !== pageType)]
        : raw

      setResults(sorted)
      setOpen(sorted.length > 0)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, workspaceId, pathname])

  function handleSelect(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="flex-1 max-w-md relative">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      {loading && (
        <Loader2 className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 z-10 animate-spin" />
      )}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Buscar tareas, documentos, proyectos..."
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF] transition-all"
      />
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin resultados</p>
          ) : (
            <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {results.map(r => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    onClick={() => handleSelect(r.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="shrink-0">{TYPE_ICON[r.type]}</span>
                    <span className="text-sm text-[#1A2744] truncate flex-1">{r.name}</span>
                    {r.subtitle && (
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">{r.subtitle}</span>
                    )}
                    <span className="text-[10px] text-slate-300 shrink-0">{TYPE_LABEL[r.type]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

type Notification = {
  id: string
  content: string
  metadata: Record<string, any> | null
  created_at: string
}

const LS_KEY = (wsId: string) => `builtek_notif_seen_${wsId}`

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default function Topbar({
  userName,
  workspaceId,
}: {
  userName: string
  workspaceId: string
}) {
  const router = useRouter()

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Notification dropdown
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs]     = useState<Notification[]>([])
  const [unread, setUnread]     = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)

  // Avatar dropdown
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Load notifications
  useEffect(() => {
    if (!workspaceId || workspaceId === 'dev') return
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('workspace_messages')
        .select('id, content, metadata, created_at')
        .eq('workspace_id', workspaceId)
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(3)

      const items = (data ?? []) as Notification[]
      setNotifs(items)

      const lastSeen = localStorage.getItem(LS_KEY(workspaceId))
      setUnread(!lastSeen ? items.length : items.filter(n => new Date(n.created_at) > new Date(lastSeen)).length)
    }

    load()

    const channel = supabase
      .channel(`notifs_${workspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'workspace_messages', filter: `workspace_id=eq.${workspaceId}`,
      }, (payload) => {
        if (payload.new?.type !== 'system') return
        setNotifs(prev => [payload.new as Notification, ...prev.slice(0, 2)])
        setUnread(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleBellOpen() {
    setBellOpen(v => !v)
    setAvatarOpen(false)
    if (!bellOpen) {
      localStorage.setItem(LS_KEY(workspaceId), new Date().toISOString())
      setUnread(0)
    }
  }

  function handleAvatarOpen() {
    setAvatarOpen(v => !v)
    setBellOpen(false)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Search */}
      <GlobalSearch workspaceId={workspaceId} />

      <div className="flex items-center gap-3 ml-auto">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={handleBellOpen}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#00C2FF] rounded-full flex items-center justify-center text-[9px] font-bold text-[#1A2744] px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-[#1A2744]">Notificaciones</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Recientes
                </span>
              </div>

              {notifs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin notificaciones</p>
              ) : notifs.map(n => {
                const entityType = n.metadata?.entity_type
                const entityId   = n.metadata?.entity_id
                const href = entityType === 'task'
                  ? `/tasks?task=${entityId}`
                  : entityType === 'document'
                  ? '/documents'
                  : null

                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setBellOpen(false)}
                    className="block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-[#00C2FF] mt-1">Abrir · {timeAgo(n.created_at)}</p>
                  </Link>
                ) : (
                  <div key={n.id} className="px-4 py-3 border-b border-slate-50">
                    <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                )
              })}

              <Link
                href="/chat"
                onClick={() => setBellOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#00C2FF] hover:bg-slate-50 transition-colors border-t border-slate-100"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ver todas las notificaciones →
              </Link>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div ref={avatarRef} className="relative">
          <button
            onClick={handleAvatarOpen}
            className="w-9 h-9 bg-[#1A2744] rounded-lg flex items-center justify-center hover:ring-2 hover:ring-[#00C2FF]/40 transition-all"
          >
            <span className="text-[#00C2FF] text-xs font-bold">{initials}</span>
          </button>

          {avatarOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-[#1A2744] truncate">{userName}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#1A2744] transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Mi perfil
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#1A2744] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
