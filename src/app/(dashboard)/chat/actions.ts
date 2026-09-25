'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendMessage(workspaceId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const trimmed = content.trim()
  if (!trimmed) return

  const { error } = await supabase
    .from('workspace_messages')
    .insert({
      workspace_id: workspaceId,
      sender_id: user.id,
      content: trimmed,
      type: 'message',
    })

  if (error) throw new Error(error.message)
}
