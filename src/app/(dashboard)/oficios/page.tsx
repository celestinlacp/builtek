import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import OficiosPanel from './OficiosPanel'

export const dynamic = 'force-dynamic'

export default async function OficiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, features)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const workspace = membership.workspaces as unknown as { id: string; name: string; features: Record<string, boolean> }

  // Verificar que el workspace tiene el módulo Oficios activado
  if (!workspace?.features?.oficios) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2744] mb-2">Módulo no disponible</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            El módulo de Oficios no está activado para este workspace. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  const wsId = workspace.id

  // Cargar proyectos, miembros, oficios, especialidades y mesas del workspace
  const [projectsRes, membersRes, oficiosRes, especialidadesRes, mesasRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', wsId),
    supabase
      .from('oficios')
      .select(`
        id, tipo, no_oficio, asunto, fecha_documento, fecha_recepcion,
        proyecto_id, proyecto2_id, especialidad, tema, estado,
        remitente, destinatario, assignee_id, assignee2_id, task_id,
        storage_key, file_name, file_type, file_size,
        notas, link_entrega, created_by, created_at, updated_at, responde_a_id,
        mesa_id, copia_a, para_conocimiento,
        proyecto:projects!oficios_proyecto_id_fkey(id, name),
        proyecto2:projects!oficios_proyecto2_id_fkey(id, name),
        assignee:profiles!oficios_assignee_id_fkey(id, full_name),
        assignee2:profiles!oficios_assignee2_id_fkey(id, full_name)
      `)
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false }),
    supabase
      .from('mic_nomenclatures')
      .select('code, name')
      .eq('workspace_id', wsId)
      .eq('segment', 'ESPECIALIDAD')
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('mesas_tecnicas')
      .select('id, nombre, codigo, especialidad, is_active, sort_order')
      .eq('workspace_id', wsId)
      .eq('is_active', true)
      .order('sort_order')
      .order('nombre'),
  ])

  // Fetch profiles separately (workspace_members.user_id → auth.users, no direct FK to profiles)
  const rawMembers = membersRes.data ?? []
  const memberIds = rawMembers.map((m: any) => m.user_id).filter(Boolean)
  const { data: profilesData } = memberIds.length
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', memberIds)
    : { data: [] }
  const profileById: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {}
  for (const p of (profilesData ?? [])) if (p.id) profileById[p.id] = p as any

  const members = rawMembers.map((m: any) => {
    const p = profileById[m.user_id]
    const fullName = p?.full_name ?? ''
    const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('') || null
    return { user_id: m.user_id, role: m.role, user: p ? { id: p.id, full_name: fullName, initials, avatar_url: p.avatar_url } : null }
  })

  const oficios = oficiosRes.data || []
  const oficioIds = oficios.map(o => o.id)

  // Cargar antecedentes y anexos para los oficios del workspace
  const [antecedentesRes, anexosRes] = await Promise.all([
    oficioIds.length > 0
      ? supabase
          .from('oficio_antecedentes')
          .select('id, oficio_id, ref_texto, antecedente_oficio_id')
          .in('oficio_id', oficioIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('oficio_anexos')
      .select('id, oficio_id, tipo, nombre, url, storage_key, file_name, file_size, created_at')
      .eq('workspace_id', wsId)
      .order('created_at'),
  ])

  const currentUserName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#00C2FF]" />
          Oficios
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Control de correspondencia oficial — {workspace.name}
        </p>
      </div>

      <OficiosPanel
        oficios={oficios as any}
        projects={projectsRes.data || []}
        members={members as any}
        especialidades={(especialidadesRes.data || []) as any}
        antecedentes={(antecedentesRes.data || []) as any}
        anexos={(anexosRes.data || []) as any}
        mesas={(mesasRes.data || []) as any}
        workspaceId={wsId}
        currentUserId={user.id}
        currentUserRole={membership.role as any}
      />
    </div>
  )
}
