import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import OficiosPanel from './OficiosPanel'

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

  // Cargar proyectos, miembros y oficios
  const [projectsRes, membersRes, oficiosRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', wsId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('workspace_members')
      .select('user_id, role, user:profiles(id, full_name, initials, avatar_url)')
      .eq('workspace_id', wsId),
    supabase
      .from('oficios')
      .select(`
        id, tipo, no_oficio, asunto, fecha_documento,
        proyecto_id, especialidad, estado,
        remitente, destinatario, assignee_id,
        storage_key, file_name, file_type, file_size,
        notas, created_by, created_at, updated_at,
        proyecto:projects(id, name),
        assignee:profiles!oficios_assignee_id_fkey(id, full_name, initials)
      `)
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false }),
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
        oficios={(oficiosRes.data || []) as any}
        projects={projectsRes.data || []}
        members={(membersRes.data || []) as any}
        workspaceId={wsId}
        currentUserId={user.id}
        currentUserRole={membership.role as any}
      />
    </div>
  )
}
