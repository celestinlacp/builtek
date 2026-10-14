'use client'

import ChatProvider from '@/components/chat/ChatProvider'
import ChatDrawer from '@/components/chat/ChatDrawer'

export default function ChatShell({ workspaceId, children }: { workspaceId: string; children: React.ReactNode }) {
  return (
    <ChatProvider workspaceId={workspaceId}>
      {children}
      <ChatDrawer />
    </ChatProvider>
  )
}
