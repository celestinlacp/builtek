'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageSquare, Lock, Hash, Plus, Loader2 } from 'lucide-react'
import { useChat } from './ChatContext'

function Avatar({ name, initials, size = 'sm' }: { name: string; initials?: string | null; size?: 'sm' | 'md' }) {
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500']
  const color  = colors[(name.charCodeAt(0) ?? 0) % colors.length]
  const dim    = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials ?? name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function fmtTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function ChatDrawer() {
  const {
    isOpen, closeChat, activeConvId, conversations, messages,
    members, loadingMsgs, currentUserId, openConv, sendMessage, startDm,
  } = useChat()

  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen, activeConvId])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    await sendMessage(text)
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)

  // Agrupar mensajes por sender consecutivo
  const grouped = messages.map((m, i) => ({
    ...m,
    isFirst: i === 0 || messages[i - 1].sender_id !== m.sender_id,
  }))

  return (
    <>
      {/* Overlay en móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={closeChat} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full z-40 flex transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: '420px', maxWidth: '100vw' }}
      >
        {/* Panel conversaciones */}
        <div className="w-48 flex-shrink-0 bg-[#1A2744] flex flex-col border-r border-white/10 h-full">
          <div className="h-14 flex items-center px-4 border-b border-white/10">
            <MessageSquare className="w-4 h-4 text-[#00C2FF] mr-2" />
            <span className="text-white font-semibold text-sm">Chat</span>
            <button onClick={closeChat} className="ml-auto p-1 rounded hover:bg-white/10 text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
            {/* Canal público */}
            <p className="px-3 py-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">Canales</p>
            {conversations.filter(c => c.type === 'public').map(c => (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-lg mx-1 transition-colors
                  ${activeConvId === c.id ? 'bg-[#00C2FF]/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
              >
                <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{c.name ?? 'general'}</span>
                {c.unread > 0 && (
                  <span className="ml-auto bg-[#00C2FF] text-[#1A2744] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {c.unread > 9 ? '9+' : c.unread}
                  </span>
                )}
              </button>
            ))}

            {/* DMs */}
            <p className="px-3 py-1 mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Mensajes directos</p>
            {conversations.filter(c => c.type === 'dm').map(c => (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-lg mx-1 transition-colors
                  ${activeConvId === c.id ? 'bg-[#00C2FF]/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{c.dmPartner?.full_name ?? 'Usuario'}</span>
                {c.unread > 0 && (
                  <span className="ml-auto bg-[#00C2FF] text-[#1A2744] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {c.unread > 9 ? '9+' : c.unread}
                  </span>
                )}
              </button>
            ))}

            {/* Nuevo DM */}
            <button
              onClick={() => setShowMembers(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg mx-1 text-white/40 hover:text-white hover:bg-white/8 transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs">Nuevo mensaje</span>
            </button>

            {showMembers && members.map(m => (
              <button
                key={m.id}
                onClick={async () => { setShowMembers(false); await startDm(m.id) }}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-white/50 hover:text-white hover:bg-white/8 transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span className="text-xs truncate">{m.full_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel mensajes */}
        <div className="flex-1 bg-white flex flex-col min-w-0 h-full">
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="h-14 flex items-center px-4 border-b border-slate-100 flex-shrink-0">
                {activeConv?.type === 'public'
                  ? <><Hash className="w-4 h-4 text-slate-400 mr-1.5" /><span className="font-semibold text-sm text-[#1A2744]">{activeConv.name ?? 'general'}</span></>
                  : <><div className="w-2 h-2 rounded-full bg-green-400 mr-2" /><span className="font-semibold text-sm text-[#1A2744]">{activeConv?.dmPartner?.full_name ?? 'Usuario'}</span></>
                }
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm pt-8">
                    <p>Sin mensajes aún.</p>
                    <p className="text-xs mt-1 text-slate-300">Sé el primero en escribir.</p>
                  </div>
                ) : (
                  grouped.map(m => {
                    const isMe = m.sender_id === currentUserId
                    return (
                      <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} ${m.isFirst ? 'mt-3' : 'mt-0.5'}`}>
                        {m.isFirst && !isMe && (
                          <Avatar name={m.sender_name} initials={m.sender_initials} />
                        )}
                        {m.isFirst && isMe && <div className="w-7" />}
                        {!m.isFirst && <div className="w-7" />}
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {m.isFirst && !isMe && (
                            <span className="text-[11px] text-slate-400 mb-0.5 ml-0.5">{m.sender_name}</span>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                            ${isMe
                              ? 'bg-[#1A2744] text-white rounded-tr-sm'
                              : 'bg-slate-100 text-[#1A2744] rounded-tl-sm'
                            }`}
                          >
                            {m.content}
                          </div>
                          {m.isFirst && (
                            <span className="text-[10px] text-slate-300 mt-0.5 mx-0.5">{fmtTime(m.created_at)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-slate-100">
                <div className="flex items-end gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-[#00C2FF] focus-within:ring-2 focus-within:ring-[#00C2FF]/20 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent text-sm text-[#1A2744] placeholder-slate-400 resize-none focus:outline-none max-h-24 scrollbar-hide"
                    style={{ minHeight: '24px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-7 h-7 flex-shrink-0 bg-[#1A2744] rounded-full flex items-center justify-center hover:bg-[#00C2FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 mt-1.5 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
