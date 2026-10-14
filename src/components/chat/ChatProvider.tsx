'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatContext, Conversation, Message, WorkspaceMember } from './ChatContext'

export default function ChatProvider({ workspaceId, children }: { workspaceId: string; children: React.ReactNode }) {
  const [isOpen,        setIsOpen]        = useState(false)
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages,      setMessages]      = useState<Message[]>([])
  const [members,       setMembers]       = useState<WorkspaceMember[]>([])
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const activeConvRef = useRef<string | null>(null)

  // Unread total
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0)

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    const res  = await fetch('/api/chat/conversations')
    const data = await res.json()
    if (data.conversations) setConversations(data.conversations)
    if (data.members)       setMembers(data.members)
    if (data.currentUserId) setCurrentUserId(data.currentUserId)
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Realtime — nuevos mensajes
  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    const channel  = supabase
      .channel(`chat:${workspaceId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'chat_messages',
        filter: `workspace_id=eq.${workspaceId}`,
      }, (payload) => {
        const msg = payload.new as any
        const convId = msg.conversation_id

        // Si el mensaje es de la conversación activa → agregar a la lista
        if (convId === activeConvRef.current) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, {
              id:              msg.id,
              sender_id:       msg.sender_id,
              sender_name:     msg.sender_name ?? '...',
              sender_initials: '?',
              content:         msg.content,
              created_at:      msg.created_at,
            }]
          })
          // Marcar como leído automáticamente
          fetch('/api/chat/messages?conversationId=' + convId).catch(() => {})
        } else {
          // Incrementar no leídos en esa conversación
          setConversations(prev => prev.map(c =>
            c.id === convId && msg.sender_id !== currentUserId
              ? { ...c, unread: c.unread + 1, lastMessage: { content: msg.content, created_at: msg.created_at, sender_id: msg.sender_id } }
              : c
          ))
          // Notificación in-app (browser) si la página está visible
          if (document.visibilityState === 'visible' && msg.sender_id !== currentUserId) {
            // Badge se actualiza automáticamente via state
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, currentUserId])

  // Registrar Service Worker para push
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) return // ya registrado
      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })
        await fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(sub),
        })
      } catch { /* push no disponible */ }
    }).catch(() => {})
  }, [])

  // Abrir conversación y cargar mensajes
  const openConv = useCallback(async (id: string) => {
    setActiveConvId(id)
    activeConvRef.current = id
    setIsOpen(true)
    setLoadingMsgs(true)
    const res  = await fetch(`/api/chat/messages?conversationId=${id}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setLoadingMsgs(false)
    // Limpiar unread de esta conversación
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (!prev && conversations.length > 0 && !activeConvRef.current) {
        // Abrir con General por defecto
        const general = conversations.find(c => c.type === 'public')
        if (general) {
          openConv(general.id)
          return true
        }
      }
      return !prev
    })
  }, [conversations, openConv])

  const closeChat = useCallback(() => setIsOpen(false), [])

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConvRef.current || !content.trim()) return
    await fetch('/api/chat/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ conversationId: activeConvRef.current, content }),
    })
  }, [])

  const startDm = useCallback(async (userId: string) => {
    const res  = await fetch('/api/chat/conversations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ partnerId: userId }),
    })
    const data = await res.json()
    if (data.conversationId) {
      await loadConversations()
      await openConv(data.conversationId)
    }
  }, [loadConversations, openConv])

  return (
    <ChatContext.Provider value={{
      isOpen, activeConvId, conversations, messages, members,
      unreadTotal, loadingMsgs, currentUserId,
      toggleChat, openConv, closeChat, sendMessage, startDm,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
