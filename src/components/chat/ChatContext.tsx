'use client'
import { createContext, useContext } from 'react'

export type Conversation = {
  id:          string
  type:        'public' | 'dm'
  name:        string | null
  unread:      number
  lastMessage: { content: string; created_at: string; sender_id: string } | null
  dmPartner:   { id: string; full_name: string; initials: string | null } | null
}

export type Message = {
  id:              string
  sender_id:       string
  sender_name:     string
  sender_initials: string
  content:         string
  created_at:      string
}

export type WorkspaceMember = {
  id:        string
  full_name: string
  initials:  string | null
  role:      string
}

type ChatCtx = {
  isOpen:        boolean
  activeConvId:  string | null
  conversations: Conversation[]
  messages:      Message[]
  members:       WorkspaceMember[]
  unreadTotal:   number
  loadingMsgs:   boolean
  currentUserId: string
  toggleChat:    () => void
  openConv:      (id: string) => void
  closeChat:     () => void
  sendMessage:   (content: string) => Promise<void>
  startDm:       (userId: string) => Promise<void>
}

export const ChatContext = createContext<ChatCtx | null>(null)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be inside ChatProvider')
  return ctx
}
