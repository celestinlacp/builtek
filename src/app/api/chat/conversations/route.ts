import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: m } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .single()
  return m ? { supabase, user, workspaceId: m.workspace_id, role: m.role } : null
}

// GET — lista de conversaciones + miembros del workspace
export async function GET() {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { user, workspaceId } = auth
  const db = admin()

  // Asegurar canal General existe
  let { data: general } = await db
    .from('chat_conversations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('type', 'public')
    .maybeSingle()

  if (!general) {
    const { data: newGen } = await db
      .from('chat_conversations')
      .insert({ workspace_id: workspaceId, type: 'public', name: 'General', created_by: user.id })
      .select('id').single()
    general = newGen

    // Agregar todos los miembros actuales al General
    const { data: members } = await db
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
    if (members && newGen) {
      await db.from('chat_members').insert(
        members.map(m => ({ conversation_id: newGen.id, user_id: m.user_id }))
      )
    }
  } else {
    // Asegurar que el usuario actual está en el General
    await db.from('chat_members')
      .upsert({ conversation_id: general.id, user_id: user.id }, { onConflict: 'conversation_id,user_id', ignoreDuplicates: true })
  }

  // Conversaciones del usuario
  const { data: memberOf } = await db
    .from('chat_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)

  const convIds = (memberOf ?? []).map(m => m.conversation_id)
  if (!convIds.length) return NextResponse.json({ conversations: [], members: [] })

  const { data: convs } = await db
    .from('chat_conversations')
    .select('id, type, name, created_at')
    .in('id', convIds)
    .eq('workspace_id', workspaceId)

  // Mensajes no leídos por conversación
  const unreadMap: Record<string, number> = {}
  const readMap: Record<string, string> = {}
  for (const m of memberOf ?? []) readMap[m.conversation_id] = m.last_read_at

  await Promise.all((convIds).map(async (cid) => {
    const { count } = await db
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', cid)
      .gt('created_at', readMap[cid] ?? '1970-01-01')
      .neq('sender_id', user.id)
    unreadMap[cid] = count ?? 0
  }))

  // Último mensaje por conversación
  const lastMsgMap: Record<string, { content: string; created_at: string; sender_id: string }> = {}
  await Promise.all(convIds.map(async (cid) => {
    const { data } = await db
      .from('chat_messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', cid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) lastMsgMap[cid] = data
  }))

  // Miembros DM (perfiles de otros) — dos pasos para evitar dependencia de FK
  const dmConvIds = (convs ?? []).filter(c => c.type === 'dm').map(c => c.id)
  const dmPartnersMap: Record<string, { id: string; full_name: string; initials: string | null }> = {}
  if (dmConvIds.length) {
    const { data: dmMembers } = await db
      .from('chat_members')
      .select('conversation_id, user_id')
      .in('conversation_id', dmConvIds)
      .neq('user_id', user.id)

    const dmUserIds = [...new Set((dmMembers ?? []).map(m => m.user_id))]
    const dmProfileMap: Record<string, { id: string; full_name: string; initials: string | null }> = {}
    if (dmUserIds.length) {
      const { data: dmProfiles } = await db.from('profiles').select('id, full_name, initials').in('id', dmUserIds)
      for (const p of dmProfiles ?? []) dmProfileMap[p.id] = p
    }
    for (const dm of dmMembers ?? []) {
      if (dmProfileMap[dm.user_id]) dmPartnersMap[dm.conversation_id] = dmProfileMap[dm.user_id]
    }
  }

  // Todos los miembros del workspace (para iniciar DM) — dos pasos
  const { data: wsMembers } = await db
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)
    .neq('user_id', user.id)

  const memberUserIds = (wsMembers ?? []).map(m => m.user_id)
  const memberProfileMap: Record<string, { full_name: string; initials: string | null }> = {}
  if (memberUserIds.length) {
    const { data: memberProfiles } = await db.from('profiles').select('id, full_name, initials').in('id', memberUserIds)
    for (const p of memberProfiles ?? []) memberProfileMap[p.id] = { full_name: p.full_name, initials: p.initials }
  }

  const conversations = (convs ?? []).map(c => ({
    id:          c.id,
    type:        c.type,
    name:        c.name,
    unread:      unreadMap[c.id] ?? 0,
    lastMessage: lastMsgMap[c.id] ?? null,
    dmPartner:   dmPartnersMap[c.id] ?? null,
  }))

  // Ordenar: General primero, luego DMs por último mensaje
  conversations.sort((a, b) => {
    if (a.type === 'public') return -1
    if (b.type === 'public') return 1
    const ta = a.lastMessage?.created_at ?? ''
    const tb = b.lastMessage?.created_at ?? ''
    return tb.localeCompare(ta)
  })

  const members = (wsMembers ?? []).map(m => ({
    id:        m.user_id,
    full_name: memberProfileMap[m.user_id]?.full_name ?? 'Usuario',
    initials:  memberProfileMap[m.user_id]?.initials  ?? null,
    role:      m.role,
  }))

  return NextResponse.json({ conversations, members, currentUserId: user.id })
}

// POST — crear DM (o devolver existente)
export async function POST(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { user, workspaceId } = auth
  const { partnerId } = await req.json()
  if (!partnerId) return NextResponse.json({ error: 'Falta partnerId' }, { status: 400 })

  const db = admin()

  // Buscar DM existente entre estos dos usuarios
  const { data: existing } = await db
    .from('chat_members')
    .select('conversation_id, chat_conversations!inner(id, type, workspace_id)')
    .eq('user_id', user.id)

  const myConvIds = (existing ?? [])
    .filter(r => (r.chat_conversations as any)?.type === 'dm' && (r.chat_conversations as any)?.workspace_id === workspaceId)
    .map(r => r.conversation_id)

  if (myConvIds.length) {
    const { data: partnerIn } = await db
      .from('chat_members')
      .select('conversation_id')
      .eq('user_id', partnerId)
      .in('conversation_id', myConvIds)
      .maybeSingle()
    if (partnerIn) return NextResponse.json({ conversationId: partnerIn.conversation_id })
  }

  // Crear nuevo DM
  const { data: conv } = await db
    .from('chat_conversations')
    .insert({ workspace_id: workspaceId, type: 'dm', created_by: user.id })
    .select('id').single()
  if (!conv) return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 })

  await db.from('chat_members').insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: partnerId },
  ])

  return NextResponse.json({ conversationId: conv.id })
}
