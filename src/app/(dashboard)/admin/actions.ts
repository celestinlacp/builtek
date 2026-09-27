'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getWorkspaceId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return { supabase, userId: user.id, workspaceId: data?.workspace_id }
}

async function nextMicIdentifier(workspaceId: string, parentProjectId: string | null): Promise<string> {
  const admin = getAdminClient()

  if (!parentProjectId) {
    // Proyectos raíz: buscar el MAX numérico de mic_identifier raíz
    const { data } = await admin
      .from('projects')
      .select('mic_identifier')
      .eq('workspace_id', workspaceId)
      .is('parent_project_id', null)
      .not('mic_identifier', 'is', null)

    const max = (data || []).reduce((acc, p) => {
      const n = parseInt(p.mic_identifier ?? '0', 10)
      return isNaN(n) ? acc : Math.max(acc, n)
    }, 0)
    return String(max + 1).padStart(4, '0')
  } else {
    // Subproyecto: heredar número del padre + siguiente sub-índice
    const { data: parent } = await admin
      .from('projects')
      .select('mic_identifier')
      .eq('id', parentProjectId)
      .single()

    const parentNum = parent?.mic_identifier?.split('.')[0] ?? '0000'

    const { data: siblings } = await admin
      .from('projects')
      .select('mic_identifier')
      .eq('workspace_id', workspaceId)
      .eq('parent_project_id', parentProjectId)
      .not('mic_identifier', 'is', null)

    const maxSub = (siblings || []).reduce((acc, p) => {
      const parts = p.mic_identifier?.split('.')
      const sub = parts?.[1] ? parseInt(parts[1], 10) : 0
      return isNaN(sub) ? acc : Math.max(acc, sub)
    }, 0)

    return `${parentNum}.${String(maxSub + 1).padStart(2, '0')}`
  }
}

export async function createProject(formData: FormData) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const parentProjectId = formData.get('parent_project_id') as string || null
  const mic_identifier  = await nextMicIdentifier(workspaceId, parentProjectId)

  const { error } = await admin.from('projects').insert({
    workspace_id:     workspaceId,
    name:             formData.get('name') as string,
    description:      formData.get('description') as string || null,
    status:           'active',
    start_date:       formData.get('start_date') as string || null,
    end_date:         formData.get('end_date') as string || null,
    frente:           formData.get('frente') as string || null,
    project_type:     formData.get('project_type') as string || null,
    parent_project_id: parentProjectId,
    mic_identifier,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProject(projectId: string, formData: FormData) {
  await getWorkspaceId()
  const admin = getAdminClient()

  const { error } = await admin.from('projects').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
    frente: formData.get('frente') as string || null,
    project_type: formData.get('project_type') as string || null,
  }).eq('id', projectId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('projects').delete().eq('id', projectId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function inviteMember(formData: FormData) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos para invitar' }
  }

  const email = (formData.get('email') as string).trim().toLowerCase()
  const role  = formData.get('role') as string
  const admin = getAdminClient()

  try {
    // 1. Guardar invitación en DB (siempre genera token nuevo y limpia accepted_at)
    const newToken = crypto.randomUUID()
    const { data: invite, error: inviteError } = await admin
      .from('workspace_invitations')
      .upsert(
        { workspace_id: workspaceId, email, role, invited_by: userId, token: newToken, accepted_at: null },
        { onConflict: 'workspace_id,email' }
      )
      .select('token')
      .single()

    if (inviteError) return { error: inviteError.message }
    if (!invite?.token) return { error: 'No se pudo generar el token de invitación' }

    // 2. Enviar email directamente con Resend
    const appUrl     = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app').replace(/\/$/, '')
    const acceptUrl  = `${appUrl}/invite/accept?token=${invite.token}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from:    'Builtek <no-reply@builtek.app>',
      to:      email,
      subject: 'Te invitaron a unirte a Builtek',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1A2744;margin-bottom:8px">Tienes una invitación</h2>
          <p style="color:#64748b;margin-bottom:24px">
            Te invitaron a unirte a un workspace en <strong>Builtek</strong> con el rol
            <strong>${role}</strong>.
          </p>
          <a href="${acceptUrl}"
            style="display:inline-block;background:#1A2744;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            Aceptar invitación
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">
            Si no esperabas esta invitación, ignora este correo.
          </p>
        </div>
      `,
    })

    if (emailError) return { error: `Error al enviar email: ${emailError.message}` }

    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error inesperado al enviar la invitación' }
  }
}

export async function cancelInvite(inviteId: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId)
    .eq('workspace_id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateMemberRole(targetUserId: string, role: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }
  if (role === 'owner') return { error: 'No se puede asignar el rol owner' }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single()

  if (target?.role === 'owner') return { error: 'No se puede cambiar el rol del owner' }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function removeMember(targetUserId: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single()

  if (target?.role === 'owner') return { error: 'No se puede remover al owner' }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function toggleFeature(feature: string, enabled: boolean) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos para gestionar módulos' }
  }

  const admin = getAdminClient()
  const { data: ws } = await admin.from('workspaces').select('features').eq('id', workspaceId).single()
  const features = { ...(ws?.features || {}) } as Record<string, boolean>
  if (enabled) features[feature] = true
  else delete features[feature]

  const { error } = await admin.from('workspaces').update({ features }).eq('id', workspaceId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/oficios')
  return { success: true }
}

// ── Empresas ──────────────────────────────────────────────────────────────────

export async function createCompany(data: { name: string; short_name: string | null }) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()
  const { error } = await admin.from('companies').insert({
    workspace_id: workspaceId,
    name:         data.name.trim(),
    short_name:   data.short_name?.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateCompany(companyId: string, data: { name: string; short_name: string | null; is_active: boolean }) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('companies').update({
    name:       data.name.trim(),
    short_name: data.short_name?.trim() || null,
    is_active:  data.is_active,
  }).eq('id', companyId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteCompany(companyId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('companies').delete().eq('id', companyId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateWorkspace(formData: FormData) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('workspaces').update({
    name: formData.get('name') as string,
  }).eq('id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Catálogo MIC de Nomenclaturas ─────────────────────────────────────────────

export async function createMicNomenclature(data: {
  segment:     string
  code:        string
  name:        string
  description: string | null
  sort_order:  number
}) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('mic_nomenclatures').insert({
    workspace_id: workspaceId,
    segment:      data.segment,
    code:         data.code.trim().toUpperCase(),
    name:         data.name.trim(),
    description:  data.description?.trim() || null,
    sort_order:   data.sort_order,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true }
}

export async function updateMicNomenclature(id: string, data: {
  code:        string
  name:        string
  description: string | null
  is_active:   boolean
  sort_order:  number
}) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('mic_nomenclatures')
    .update({
      code:        data.code.trim().toUpperCase(),
      name:        data.name.trim(),
      description: data.description?.trim() || null,
      is_active:   data.is_active,
      sort_order:  data.sort_order,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true }
}

export async function deleteMicNomenclature(id: string) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('mic_nomenclatures')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true }
}

export async function seedMicTipoPlano() {
  return seedAllMicNomenclatures()
}

export async function syncIdentificadoresFromProjects() {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  // Leer mic_identifier directamente desde el campo del proyecto — nunca recalcular
  const { data: projects } = await admin
    .from('projects')
    .select('id, name, mic_identifier')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .not('mic_identifier', 'is', null)
    .order('mic_identifier', { ascending: true })

  if (!projects?.length) return { success: true, count: 0 }

  const rows = projects.map((p, i) => ({
    workspace_id: workspaceId,
    segment:      'IDENTIFICADOR',
    code:         p.mic_identifier!,
    name:         p.name,
    sort_order:   i + 1,
  }))

  // Borrar IDENTIFICADOR existentes y reemplazar con los del campo projects
  await admin
    .from('mic_nomenclatures')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('segment', 'IDENTIFICADOR')

  const { error } = await admin.from('mic_nomenclatures').insert(rows)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true, count: rows.length }
}

export async function seedAllMicNomenclatures() {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const catalog: { segment: string; code: string; name: string; description?: string; sort_order: number }[] = [
    // ── TRONCAL ──────────────────────────────────────────────────────────────
    { segment: 'TRONCAL', code: 'TQM',  name: 'Tren México-Querétaro',       sort_order: 1 },

    // ── IDENTIFICADOR: generado automáticamente desde syncIdentificadoresFromProjects ──

    // ── TIPO_DOC ──────────────────────────────────────────────────────────────
    { segment: 'TIPO_DOC', code: 'PLA', name: 'Plano',                      sort_order: 1  },
    { segment: 'TIPO_DOC', code: 'MEM', name: 'Memoria de Cálculo',         sort_order: 2  },
    { segment: 'TIPO_DOC', code: 'ESP', name: 'Especificación Técnica',     sort_order: 3  },
    { segment: 'TIPO_DOC', code: 'INF', name: 'Informe / Reporte',          sort_order: 4  },
    { segment: 'TIPO_DOC', code: 'PRO', name: 'Procedimiento Constructivo', sort_order: 5  },
    { segment: 'TIPO_DOC', code: 'OFI', name: 'Oficio',                     sort_order: 6  },
    { segment: 'TIPO_DOC', code: 'MIN', name: 'Minuta de Reunión',          sort_order: 7  },
    { segment: 'TIPO_DOC', code: 'ACT', name: 'Acta',                       sort_order: 8  },
    { segment: 'TIPO_DOC', code: 'PRE', name: 'Presupuesto',                sort_order: 9  },
    { segment: 'TIPO_DOC', code: 'PRG', name: 'Programa de Obra',           sort_order: 10 },
    { segment: 'TIPO_DOC', code: 'CON', name: 'Contrato',                   sort_order: 11 },
    { segment: 'TIPO_DOC', code: 'TAR', name: 'Tarjeta / Formato',          sort_order: 12 },

    // ── ESPECIALIDAD ──────────────────────────────────────────────────────────
    // Técnicas
    { segment: 'ESPECIALIDAD', code: 'AARQ', name: 'Arquitectura',                  sort_order: 1  },
    { segment: 'ESPECIALIDAD', code: 'EEST', name: 'Estructuras',                   sort_order: 2  },
    { segment: 'ESPECIALIDAD', code: 'GEOM', name: 'Geométrico',                    sort_order: 3  },
    { segment: 'ESPECIALIDAD', code: 'GECT', name: 'Geotecnia',                     sort_order: 4  },
    { segment: 'ESPECIALIDAD', code: 'GEOF', name: 'Geofísica',                     sort_order: 5  },
    { segment: 'ESPECIALIDAD', code: 'HIDR', name: 'Hidráulica',                    sort_order: 6  },
    { segment: 'ESPECIALIDAD', code: 'ELEC', name: 'Eléctrico',                     sort_order: 7  },
    { segment: 'ESPECIALIDAD', code: 'MECA', name: 'Mecánico',                      sort_order: 8  },
    { segment: 'ESPECIALIDAD', code: 'SANI', name: 'Sanitario',                     sort_order: 9  },
    { segment: 'ESPECIALIDAD', code: 'TOPO', name: 'Topografía',                    sort_order: 10 },
    { segment: 'ESPECIALIDAD', code: 'VIAL', name: 'Vialidad',                      sort_order: 11 },
    { segment: 'ESPECIALIDAD', code: 'CARR', name: 'Carreteras',                    sort_order: 12 },
    { segment: 'ESPECIALIDAD', code: 'URBA', name: 'Urbanización',                  sort_order: 13 },
    { segment: 'ESPECIALIDAD', code: 'PAIS', name: 'Paisaje',                       sort_order: 14 },
    { segment: 'ESPECIALIDAD', code: 'ACAB', name: 'Acabados',                      sort_order: 15 },
    { segment: 'ESPECIALIDAD', code: 'SENL', name: 'Señalética',                    sort_order: 16 },
    { segment: 'ESPECIALIDAD', code: 'INES', name: 'Instalaciones Especiales',      sort_order: 17 },
    { segment: 'ESPECIALIDAD', code: 'SEST', name: 'Seguridad Estructural',         sort_order: 18 },
    { segment: 'ESPECIALIDAD', code: 'SUBC', name: 'Subestructura y Cimentación',   sort_order: 19 },
    { segment: 'ESPECIALIDAD', code: 'SUPE', name: 'Superestructura',               sort_order: 20 },
    { segment: 'ESPECIALIDAD', code: 'PROC', name: 'Proceso Constructivo',          sort_order: 21 },
    // Seguridad
    { segment: 'ESPECIALIDAD', code: 'SEHI', name: 'Seguridad e Higiene',           sort_order: 22 },
    { segment: 'ESPECIALIDAD', code: 'AMBI', name: 'Ambiental',                     sort_order: 23 },
    { segment: 'ESPECIALIDAD', code: 'PCIV', name: 'Protección Civil',              sort_order: 24 },

    // ── TIPO_PLANO ────────────────────────────────────────────────────────────
    { segment: 'TIPO_PLANO', code: 'PLT', name: 'Planta',          sort_order: 1 },
    { segment: 'TIPO_PLANO', code: 'COR', name: 'Corte',           sort_order: 2 },
    { segment: 'TIPO_PLANO', code: 'ALZ', name: 'Alzado',          sort_order: 3 },
    { segment: 'TIPO_PLANO', code: 'PER', name: 'Perfil',          sort_order: 4 },
    { segment: 'TIPO_PLANO', code: 'DET', name: 'Detalle',         sort_order: 5 },
    { segment: 'TIPO_PLANO', code: 'ISO', name: 'Isométrico',      sort_order: 6 },
    { segment: 'TIPO_PLANO', code: 'DIA', name: 'Diagrama',        sort_order: 7 },
    { segment: 'TIPO_PLANO', code: 'CUA', name: 'Cuadro / Tabla',  sort_order: 8 },
    { segment: 'TIPO_PLANO', code: 'GEN', name: 'General',         sort_order: 9 },
  ]

  const rows = catalog.map(d => ({
    workspace_id: workspaceId,
    segment:      d.segment,
    code:         d.code,
    name:         d.name,
    sort_order:   d.sort_order,
  }))

  const { error } = await admin
    .from('mic_nomenclatures')
    .upsert(rows, { onConflict: 'workspace_id,segment,code', ignoreDuplicates: true })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true, count: rows.length }
}
