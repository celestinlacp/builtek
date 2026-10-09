import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import LogsPanel from './LogsPanel'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership || membership.role !== 'owner') redirect('/dashboard')

  const wsId = membership.workspace_id
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Últimas 500 entradas con nombre de usuario
  const { data: logs } = await admin
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, entity_name, metadata, created_at, user_id')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(500)

  // Enriquecer con nombre + iniciales del usuario
  const userIds = [...new Set((logs ?? []).map((l: any) => l.user_id).filter(Boolean))]
  const profileMap: Record<string, { full_name: string; initials: string }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, initials')
      .in('id', userIds)
    for (const p of (profiles ?? [])) {
      profileMap[p.id] = { full_name: p.full_name, initials: p.initials }
    }
  }

  // Última conexión del equipo
  const { data: members } = await admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', wsId)

  const memberIds = (members ?? []).map((m: any) => m.user_id)
  const { data: memberProfiles } = await admin
    .from('profiles')
    .select('id, full_name, initials, last_seen_at')
    .in('id', memberIds)

  const enrichedLogs = (logs ?? []).map((l: any) => ({
    ...l,
    user_name:    profileMap[l.user_id]?.full_name ?? 'Usuario',
    user_initials: profileMap[l.user_id]?.initials ?? '?',
  }))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744]">Actividad del equipo</h1>
        <p className="text-slate-500 text-sm mt-0.5">Solo visible para el owner del workspace.</p>
      </div>
      <LogsPanel logs={enrichedLogs} members={(memberProfiles ?? []).map((p: any) => ({
        id: p.id, full_name: p.full_name, initials: p.initials, last_seen_at: p.last_seen_at,
        role: members?.find((m: any) => m.user_id === p.id)?.role ?? 'member',
      }))} />
    </div>
  )
}
