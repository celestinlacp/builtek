'use client'

import { Bell, Search, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const dropRef = useRef<HTMLDivElement>(null)

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
        .limit(15)

      const items = (data ?? []) as Notification[]
      setNotifs(items)

      const lastSeen = localStorage.getItem(LS_KEY(workspaceId))
      if (!lastSeen) {
        setUnread(items.length)
      } else {
        setUnread(items.filter(n => new Date(n.created_at) > new Date(lastSeen)).length)
      }
    }

    load()

    // Realtime subscription
    const channel = supabase
      .channel(`notifs_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.new?.type !== 'system') return
          setNotifs(prev => [payload.new as Notification, ...prev.slice(0, 14)])
          setUnread(prev => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleOpen() {
    setOpen(v => !v)
    if (!open) {
      // mark all as seen
      localStorage.setItem(LS_KEY(workspaceId), new Date().toISOString())
      setUnread(0)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar tareas, documentos, proyectos..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 focus:border-[#00C2FF] transition-all"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div ref={dropRef} className="relative">
          <button
            onClick={handleOpen}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#00C2FF] rounded-full flex items-center justify-center text-[9px] font-bold text-[#1A2744] px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-[#1A2744]">Notificaciones</span>
                {notifs.length > 0 && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Sistema Builtek
                  </span>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Sin notificaciones</p>
                ) : notifs.map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 bg-[#1A2744] rounded-lg flex items-center justify-center">
          <span className="text-[#00C2FF] text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  )
}
