'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity'
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
    // Proyectos raíz: buscar el MAX numérico de builtek_id raíz
    const { data } = await admin
      .from('projects')
      .select('builtek_id')
      .eq('workspace_id', workspaceId)
      .is('parent_project_id', null)
      .not('builtek_id', 'is', null)

    const max = (data || []).reduce((acc, p) => {
      const n = parseInt(p.builtek_id ?? '0', 10)
      return isNaN(n) ? acc : Math.max(acc, n)
    }, 0)
    return String(max + 1).padStart(4, '0')
  } else {
    // Subproyecto: heredar número del padre + siguiente sub-índice
    const { data: parent } = await admin
      .from('projects')
      .select('builtek_id')
      .eq('id', parentProjectId)
      .single()

    const parentNum = parent?.builtek_id?.split('.')[0] ?? '0000'

    const { data: siblings } = await admin
      .from('projects')
      .select('builtek_id')
      .eq('workspace_id', workspaceId)
      .eq('parent_project_id', parentProjectId)
      .not('builtek_id', 'is', null)

    const maxSub = (siblings || []).reduce((acc, p) => {
      const parts = p.builtek_id?.split('.')
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
  const builtek_id  = await nextMicIdentifier(workspaceId, parentProjectId)

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
    builtek_id,
    is_inah:          formData.get('is_inah') === 'on',
    cruce_vial:       formData.get('cruce_vial') as string || null,
    cauces_federales: formData.get('cauces_federales') === 'on',
  })

  if (error) return { error: error.message }
  await syncIdentificadoresFromProjects()
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/documents')
  return { success: true }
}

export async function updateProject(projectId: string, formData: FormData) {
  await getWorkspaceId()
  const admin = getAdminClient()

  const micIdentifierRaw = (formData.get('builtek_id') as string)?.trim() || null
  // Si el campo vino vacío, leer el valor actual para no borrar un identificador existente
  let micIdentifier = micIdentifierRaw
  if (!micIdentifier) {
    const { data: current } = await admin.from('projects').select('builtek_id').eq('id', projectId).single()
    micIdentifier = current?.builtek_id ?? null
  }

  const { error } = await admin.from('projects').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    status: (formData.get('status') as string) || 'active',
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
    frente: formData.get('frente') as string || null,
    project_type: formData.get('project_type') as string || null,
    builtek_id: micIdentifier,
    is_inah:          formData.get('is_inah') === 'on',
    cruce_vial:       formData.get('cruce_vial') as string || null,
    cauces_federales: formData.get('cauces_federales') === 'on',
  }).eq('id', projectId)

  if (error) return { error: error.message }
  await syncIdentificadoresFromProjects()
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/documents')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('projects').delete().eq('id', projectId)
  if (error) return { error: error.message }
  await syncIdentificadoresFromProjects()
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  revalidatePath('/documents')
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

    // 2. Obtener datos para personalizar el email
    const appUrl       = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app').replace(/\/$/, '')
    const acceptUrl    = `${appUrl}/invite/accept?token=${invite.token}`

    const { data: workspace } = await admin.from('workspaces').select('name').eq('id', workspaceId).single()
    const { data: inviter }   = await admin.from('profiles').select('full_name').eq('id', userId).single()

    const workspaceName = workspace?.name || 'un workspace'
    const inviterName   = inviter?.full_name || 'Un colega'

    const roleLabels: Record<string, string> = {
      admin:    'Administrador',
      manager:  'Manager',
      engineer: 'Ingeniero',
      viewer:   'Visualizador',
    }
    const roleLabel = roleLabels[role] || role

    // 3. Enviar email con Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from:    'Builtek <no-reply@builtek.app>',
      to:      email,
      subject: `${inviterName} te invitó a ${workspaceName} en Builtek`,
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px">

          <!-- Logo header -->
          <tr>
            <td style="background:#1A2744;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center">
              <span style="color:#00C2FF;font-size:24px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">Builtek</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
              <div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px">
                <span style="font-size:24px">👋</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A2744;line-height:1.3">
                Te invitaron a unirte
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.7">
                <strong style="color:#1A2744">${inviterName}</strong> te invitó a colaborar en
                <strong style="color:#1A2744">${workspaceName}</strong> dentro de Builtek.
              </p>

              <!-- Role badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:28px">
                <tr>
                  <td style="background:#f1f5f9;border-radius:6px;padding:8px 16px">
                    <span style="font-size:13px;color:#475569;font-weight:600">Tu rol: </span>
                    <span style="font-size:13px;color:#1A2744;font-weight:700">${roleLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:8px;background:#1A2744">
                    <a href="${acceptUrl}"
                      style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
                Si no esperabas esta invitación, puedes ignorar este correo.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center">
              <p style="margin:0;font-size:12px;color:#94a3b8">
                © 2026 Builtek &nbsp;·&nbsp;
                <a href="https://builtek.app" style="color:#94a3b8;text-decoration:none">builtek.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    if (emailError) return { error: `Error al enviar email: ${emailError.message}` }

    logActivity({ workspace_id: workspaceId!, user_id: userId, action: 'member_invited', entity_name: email, metadata: { role } })

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

// Asigna builtek_id a todos los proyectos que no lo tienen aún
export async function backfillMicIdentifiers() {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  // Obtener todos los proyectos del workspace ordenados por created_at
  const { data: projects } = await admin
    .from('projects')
    .select('id, parent_project_id, builtek_id, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (!projects) return { error: 'No se pudieron obtener proyectos' }

  const missing = projects.filter(p => !p.builtek_id)
  if (missing.length === 0) return { success: true, assigned: 0 }

  let assigned = 0
  for (const p of missing) {
    const newId = await nextMicIdentifier(workspaceId, p.parent_project_id)
    await admin.from('projects').update({ builtek_id: newId }).eq('id', p.id)
    assigned++
  }

  await syncIdentificadoresFromProjects()
  revalidatePath('/admin')
  revalidatePath('/documents')
  return { success: true, assigned }
}

export async function syncIdentificadoresFromProjects() {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  // Leer builtek_id directamente desde el campo del proyecto — nunca recalcular
  const { data: projects } = await admin
    .from('projects')
    .select('id, name, builtek_id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .not('builtek_id', 'is', null)
    .order('builtek_id', { ascending: true })

  if (!projects?.length) return { success: true, count: 0 }

  const rows = projects.map((p, i) => ({
    workspace_id: workspaceId,
    segment:      'IDENTIFICADOR',
    code:         p.builtek_id!,
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

export async function updateMemberProfile(
  targetUserId: string,
  data: { full_name: string; phone: string | null; birthday?: string | null }
) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  // Solo owner/admin puede editar a otros; cualquier rol puede editarse a sí mismo
  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  const isSelf   = targetUserId === userId
  const isAdmin  = ['owner', 'admin'].includes(myMembership?.role || '')
  if (!isSelf && !isAdmin) return { error: 'Sin permisos' }

  // Verificar que el target pertenece al workspace
  const { data: target } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single()

  if (!target) return { error: 'Usuario no encontrado en el workspace' }

  const trimmedName = data.full_name.trim()
  if (!trimmedName) return { error: 'El nombre no puede estar vacío' }

  // Generar siglas desde el nombre
  const words    = trimmedName.split(/\s+/).filter(Boolean)
  const initials = words.map(w => w[0].toUpperCase()).join('').slice(0, 4)

  // Usar admin client para bypassear RLS al editar el perfil de otro usuario
  const admin = getAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ full_name: trimmedName, phone: data.phone || null, initials, ...(data.birthday !== undefined && { birthday: data.birthday || null }) })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateDocKey(docId: string, fullCode: string) {
  const admin   = getAdminClient()
  const trimmed = fullCode.trim()
  if (!trimmed) return { error: 'Código vacío' }

  // Si el código tiene 6 segmentos (ej. TQM-0004-INF-GECT-GEN-0001), separar versión
  const parts = trimmed.split('-')
  let docKey      = trimmed
  let versionNum: number | null = null

  if (parts.length === 6 && /^\d{4}$/.test(parts[5])) {
    docKey     = parts.slice(0, 5).join('-')
    versionNum = parseInt(parts[5], 10)
  } else if (parts.length === 5) {
    // Solo base sin versión → asumir versión 1
    docKey     = trimmed
    versionNum = 1
  }

  const { error } = await admin
    .from('documents')
    .update({ doc_key: docKey, version_number: versionNum })
    .eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateDocSegments(docId: string, segments: {
  troncal:      string
  identificador: string
  tipo_doc:     string
  especialidad: string
  tipo_plano:   string
  version:      number
}) {
  const admin  = getAdminClient()
  const docKey = `${segments.troncal}-${segments.identificador}-${segments.tipo_doc}-${segments.especialidad}-${segments.tipo_plano}`
  const { error } = await admin
    .from('documents')
    .update({ doc_key: docKey, version_number: segments.version })
    .eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function getProjectShare(projectId: string) {
  const admin = getAdminClient()
  const { data } = await admin
    .from('project_shares')
    .select('token, expires_at, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as { token: string; expires_at: string; created_at: string } | null
}

// ── Mesas Técnicas (BD Oficios) ───────────────────────────────────────────────

export async function createMesaTecnica(data: {
  nombre:      string
  codigo?:     string | null
  especialidad?: string | null
  sort_order?: number
}) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()
  const { data: created, error } = await admin.from('mesas_tecnicas').insert({
    workspace_id: workspaceId,
    nombre:       data.nombre.trim(),
    codigo:       data.codigo?.trim()  || null,
    especialidad: data.especialidad   || null,
    sort_order:   data.sort_order     ?? 0,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/oficios')
  return { success: true, id: created.id }
}

export async function updateMesaTecnica(id: string, data: {
  nombre:      string
  codigo?:     string | null
  especialidad?: string | null
  is_active:   boolean
  sort_order?: number
}) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('mesas_tecnicas').update({
    nombre:       data.nombre.trim(),
    codigo:       data.codigo?.trim()  || null,
    especialidad: data.especialidad   || null,
    is_active:    data.is_active,
    sort_order:   data.sort_order     ?? 0,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/oficios')
  return { success: true }
}

export async function deleteMesaTecnica(id: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('mesas_tecnicas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/oficios')
  return { success: true }
}

export async function upsertProjectShare(projectId: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()
  const token     = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error } = await admin
    .from('project_shares')
    .upsert({ project_id: projectId, token, expires_at: expiresAt, created_by: userId }, { onConflict: 'project_id' })
  if (error) return { error: error.message }
  const { data: proj } = await admin.from('projects').select('name').eq('id', projectId).single()
  if (workspaceId) {
    logActivity({ workspace_id: workspaceId, user_id: userId ?? null, action: 'share_project_created', entity_type: 'project', entity_id: projectId, entity_name: proj?.name ?? null })
  }
  return { token, expiresAt }
}
