import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Bell, AtSign, Users, Info } from 'lucide-react'
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

  // Initial messages (last 60, ascending for display)
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

  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', wsId)

  const messages = (rawMessages ?? []).map((m: any) => ({
    ...m,
    sender_name: m.sender_id ? (profileMap[m.sender_id] ?? 'Usuario') : null,
  }))

  const { data: myProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()
  const myName = myProfile?.full_name ?? user.email?.split('@')[0] ?? 'Yo'

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem-3rem)] flex flex-col gap-4">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#00C2FF]" />
          Chat / Notificaciones
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {wsName} · {memberCount ?? 0} miembro{memberCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">¿Qué es este espacio?</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-[#00C2FF] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Chat del equipo.</span> Todos los miembros del workspace pueden leer y enviar mensajes aquí.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Notificaciones automáticas.</span> Builtek avisa cuando un entregable es aprobado o rechazado.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AtSign className="w-3.5 h-3.5 text-[#1A2744] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Menciones directas.</span> Escribe <code className="bg-slate-200 px-1 rounded text-[10px]">@Nombre</code> en comentarios de tareas para notificar a alguien aquí.
            </p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
          No hay mensajes privados — la comunicación del equipo es transparente para todos.
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
