'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from './actions'
import { Send, Zap } from 'lucide-react'

type Message = {
  id: string
  sender_id: string | null
  sender_name: string | null
  content: string
  type: 'message' | 'system'
  created_at: string
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Deterministic color per sender
const COLORS = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
]
function avatarColor(id: string | null) {
  if (!id) return 'bg-slate-400'
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ChatPanel({
  initialMessages,
  workspaceId,
  currentUserId,
  currentUserName,
}: {
  initialMessages: Message[]
  workspaceId: string
  currentUserId: string
  currentUserName: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          const raw = payload.new as any
          // Fetch sender name if needed
          let sender_name: string | null = null
          if (raw.sender_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', raw.sender_id)
              .single()
            sender_name = data?.full_name ?? 'Usuario'
          }
          setMessages(prev => [
            ...prev,
            { ...raw, sender_name } as Message,
          ])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || pending) return

    // Optimistic update
    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      sender_id: currentUserId,
      sender_name: currentUserName,
      content: trimmed,
      type: 'message',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    textareaRef.current?.focus()

    startTransition(async () => {
      try {
        await sendMessage(workspaceId, trimmed)
      } catch {
        // Remove optimistic on error
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setText(trimmed)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by day, and detect consecutive same-sender groups
  let lastDay = ''
  let lastSender = ''

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Sin mensajes aún</p>
            <p className="text-xs text-slate-300 mt-1">Sé el primero en escribir</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const day = new Date(msg.created_at).toDateString()
          const showDay = day !== lastDay
          if (showDay) lastDay = day

          // System message
          if (msg.type === 'system') {
            lastSender = ''
            return (
              <div key={msg.id}>
                {showDay && <DayDivider label={formatDay(msg.created_at)} />}
                <div className="flex items-center gap-2 py-1.5 my-1">
                  <div className="flex-1 h-px bg-slate-100" />
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] text-amber-700 font-medium">{msg.content}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              </div>
            )
          }

          const isOwn = msg.sender_id === currentUserId
          const showAvatar = msg.sender_id !== lastSender
          lastSender = msg.sender_id ?? ''

          return (
            <div key={msg.id}>
              {showDay && <DayDivider label={formatDay(msg.created_at)} />}
              <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${showAvatar ? avatarColor(msg.sender_id) : 'invisible'}`}>
                  <span className="text-[10px] font-bold text-white">{getInitials(msg.sender_name)}</span>
                </div>

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%]`}>
                  {showAvatar && (
                    <span className={`text-[10px] text-slate-400 mb-0.5 ${isOwn ? 'pr-1' : 'pl-1'}`}>
                      {isOwn ? 'Tú' : (msg.sender_name ?? 'Usuario')}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isOwn
                        ? 'bg-[#1A2744] text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-slate-300 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-4 py-3 flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          rows={1}
          className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40 focus:border-[#00C2FF] transition-all"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || pending}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1A2744] text-white hover:bg-[#243660] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}
