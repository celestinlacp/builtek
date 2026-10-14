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
  const { data: m } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).single()
  return m ? { user, workspaceId: m.workspace_id } : null
}

// GET /api/chat/messages?conversationId=xxx — últimos 60 mensajes
export async function GET(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const conversationId = req.nextUrl.searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'Falta conversationId' }, { status: 400 })

  const db = admin()
  const { data } = await db
    .from('chat_messages')
    .select('id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(60)

  // Fetch profiles separately (FK apunta a auth.users, no a profiles directamente)
  const senderIds = [...new Set((data ?? []).map(m => m.sender_id))]
  const profileMap: Record<string, { full_name: string; initials: string | null }> = {}
  if (senderIds.length) {
    const { data: profiles } = await db.from('profiles').select('id, full_name, initials').in('id', senderIds)
    for (const p of profiles ?? []) profileMap[p.id] = { full_name: p.full_name, initials: p.initials }
  }

  const messages = (data ?? []).map(m => ({
    id:              m.id,
    sender_id:       m.sender_id,
    sender_name:     profileMap[m.sender_id]?.full_name  ?? 'Usuario',
    sender_initials: profileMap[m.sender_id]?.initials   ?? '?',
    content:         m.content,
    created_at:      m.created_at,
  }))

  // Marcar como leído
  await db.from('chat_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', auth.user.id)

  return NextResponse.json({ messages })
}

// POST /api/chat/messages — enviar mensaje
export async function POST(req: NextRequest) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { user, workspaceId } = auth

  const { conversationId, content } = await req.json()
  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const db = admin()
  const { data: msg, error } = await db
    .from('chat_messages')
    .insert({ conversation_id: conversationId, workspace_id: workspaceId, sender_id: user.id, content: content.trim() })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar last_read_at del remitente
  await db.from('chat_members')
    .update({ last_read_at: msg.created_at })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  // Disparar push notifications a otros miembros (fire & forget)
  sendPushToMembers(conversationId, user.id, content.trim(), workspaceId).catch(() => {})

  return NextResponse.json({ id: msg.id, created_at: msg.created_at })
}

async function sendPushToMembers(conversationId: string, senderId: string, content: string, workspaceId: string) {
  if (!process.env.VAPID_PRIVATE_KEY) return

  const db = admin()
  const [membersRes, senderRes, convRes] = await Promise.all([
    db.from('chat_members').select('user_id').eq('conversation_id', conversationId).neq('user_id', senderId),
    db.from('profiles').select('full_name').eq('id', senderId).single(),
    db.from('chat_conversations').select('name, type').eq('id', conversationId).single(),
  ])

  const otherIds = (membersRes.data ?? []).map(m => m.user_id)
  if (!otherIds.length) return

  const { data: subs } = await db
    .from('push_subscriptions')
    .select('subscription')
    .eq('workspace_id', workspaceId)
    .in('user_id', otherIds)

  if (!subs?.length) return

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT ?? 'hola@builtek.app'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const senderName = senderRes.data?.full_name ?? 'Alguien'
  const convName   = convRes.data?.type === 'public' ? `#${convRes.data.name ?? 'general'}` : senderName
  const payload    = JSON.stringify({
    title: `Builtek · ${convName}`,
    body:  content.length > 80 ? content.slice(0, 80) + '…' : content,
    url:   '/',
  })

  await Promise.allSettled(subs.map(s => webpush.sendNotification(s.subscription as any, payload)))
}
