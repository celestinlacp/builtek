import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import ChatPanel from './ChatPanel'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const wsId = membership.workspace_id
  const wsName = (membership.workspaces as any)?.name ?? 'Workspace'

  // Initial messages (last 60)
  const { data: rawMessages } = await supabase
    .from('workspace_messages')
    .select('id, sender_id, content, type, metadata, created_at')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: true })
    .limit(60)

  // Fetch sender profiles
  const senderIds = [...new Set(
    (rawMessages ?? []).map((m: any) => m.sender_id).filter(Boolean)
  )]
  const profilesRes = senderIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', senderIds)
    : { data: [] }
  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p: any) => [p.id, p.full_name])
  )

  // Members list for header count
  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', wsId)

  const messages = (rawMessages ?? []).map((m: any) => ({
    ...m,
    sender_name: m.sender_id ? (profileMap[m.sender_id] ?? 'Usuario') : null,
  }))

  // Current user name
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const myName = myProfile?.full_name ?? user.email?.split('@')[0] ?? 'Yo'

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem-3rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#00C2FF]" />
          Chat del equipo
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {wsName} · {memberCount ?? 0} miembro{memberCount !== 1 ? 's' : ''}
        </p>
      </div>

      <ChatPanel
        initialMessages={messages}
        workspaceId={wsId}
        currentUserId={user.id}
        currentUserName={myName}
      />
    </div>
  )
}
