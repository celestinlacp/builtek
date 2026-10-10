'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendMenvioWhatsApp, normalizePhone } from '@/lib/menvio'
import { logActivity } from '@/lib/activity'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return { supabase, user, workspaceId: data?.workspace_id as string }
}

export async function createOficio(data: {
  tipo:            'entrada' | 'salida'
  tipo_documento?: 'oficio' | 'tarjeta' | null
  asunto:          string
  no_oficio?:       string | null
  fecha_documento?: string | null
  fecha_recepcion?: string | null
  proyecto_id?:     string | null
  proyecto2_id?:    string | null
  especialidad?:    string | null
  tema?:            string | null
  remitente?:       string | null
  destinatario?:    string | null
  assignee_id?:     string | null
  assignee2_id?:    string | null
  responde_a_id?:   string | null
  storage_key?:     string | null
  file_name?:       string | null
  file_type?:       string | null
  file_size?:       number | null
  notas?:           string | null
  mesa_id?:         string | null
  copia_a?:         string | null
  para_conocimiento?: string | null
  antecedentes?:    Array<{ ref_texto: string; antecedente_oficio_id?: string | null }>
  anexos?:          Array<{ tipo: 'link' | 'archivo'; nombre: string; url?: string | null; storage_key?: string | null; file_name?: string | null; file_size?: number | null }>
  auto_task?:       { name: string; priority: string; due_date?: string | null; description?: string | null } | null
}) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()

  const { data: created, error } = await admin.from('oficios').insert({
    workspace_id:    workspaceId,
    tipo:            data.tipo,
    tipo_documento:  data.tipo_documento || 'oficio',
    asunto:          data.asunto,
    no_oficio:       data.no_oficio       || null,
    fecha_documento: data.fecha_documento || null,
    fecha_recepcion: data.fecha_recepcion || null,
    proyecto_id:     data.proyecto_id     || null,
    proyecto2_id:    data.proyecto2_id    || null,
    especialidad:    data.especialidad    || null,
    tema:            data.tema            || null,
    estado:          'pendiente',
    remitente:       data.remitente       || null,
    destinatario:    data.destinatario    || null,
    assignee_id:     data.assignee_id     || null,
    assignee2_id:    data.assignee2_id    || null,
    responde_a_id:   data.responde_a_id   || null,
    storage_key:     data.storage_key     || null,
    file_name:       data.file_name       || null,
    file_type:       data.file_type       || null,
    file_size:       data.file_size       || null,
    notas:           data.notas           || null,
    mesa_id:         data.mesa_id         || null,
    copia_a:         data.copia_a         || null,
    para_conocimiento: data.para_conocimiento || null,
    created_by:      user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // Crear antecedentes
  if (data.antecedentes?.length && created) {
    await admin.from('oficio_antecedentes').insert(
      data.antecedentes.map(a => ({
        oficio_id:             created.id,
        ref_texto:             a.ref_texto,
        antecedente_oficio_id: a.antecedente_oficio_id || null,
      }))
    )
  }

  // Crear anexos (links y archivos pre-subidos)
  if (data.anexos?.length && created) {
    await admin.from('oficio_anexos').insert(
      data.anexos.map(a => ({
        oficio_id:   created.id,
        workspace_id: workspaceId,
        tipo:        a.tipo,
        nombre:      a.nombre,
        url:         a.url         || null,
        storage_key: a.storage_key || null,
        file_name:   a.file_name   || null,
        file_size:   a.file_size   || null,
        created_by:  user.id,
      }))
    )
  }

  // Crear tarea automáticamente si se solicitó
  if (data.auto_task && data.proyecto_id && created) {
    const { data: task } = await admin.from('tasks').insert({
      project_id:  data.proyecto_id,
      name:        data.auto_task.name,
      description: data.auto_task.description || null,
      specialty:   data.especialidad ?? null,
      assignee_id: data.assignee_id ?? null,
      priority:    data.auto_task.priority || 'medium',
      due_date:    data.auto_task.due_date || null,
      status:      'pending',
    }).select('id').single()

    if (task?.id) {
      const assigneeInserts = []
      if (data.assignee_id)  assigneeInserts.push({ task_id: task.id, user_id: data.assignee_id })
      if (data.assignee2_id) assigneeInserts.push({ task_id: task.id, user_id: data.assignee2_id })
      if (assigneeInserts.length) await admin.from('task_assignees').insert(assigneeInserts)
      // Vincular oficio ↔ tarea
      await admin.from('oficios').update({ task_id: task.id }).eq('id', created.id)
    }
  }

  // Notificar a los asignados
  const { data: assignerProfile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
  const assignerName = assignerProfile?.full_name ?? 'Un manager'
  const notifyIds = [data.assignee_id, data.assignee2_id].filter((id): id is string => !!id && id !== user.id)
  for (const mentionId of notifyIds) {
    await admin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      sender_id:    null,
      type:         'system',
      content:      `📋 ${assignerName} te asignó el oficio "${data.asunto}"${data.no_oficio ? ` (${data.no_oficio})` : ''}`,
      metadata:     { action: 'oficio_assigned', mention_to: mentionId, from_user: user.id },
    })
  }

  revalidatePath('/oficios')
  return { success: true }
}

export async function updateOficio(id: string, data: {
  asunto?:            string
  tipo_documento?:    'oficio' | 'tarjeta' | null
  no_oficio?:         string | null
  fecha_documento?:   string | null
  fecha_recepcion?:   string | null
  proyecto_id?:       string | null
  proyecto2_id?:      string | null
  especialidad?:      string | null
  tema?:              string | null
  estado?:            string
  remitente?:         string | null
  destinatario?:      string | null
  assignee_id?:       string | null
  assignee2_id?:      string | null
  notas?:             string | null
  mesa_id?:           string | null
  copia_a?:           string | null
  para_conocimiento?: string | null
  storage_key?:       string | null
  file_name?:         string | null
  file_type?:         string | null
  file_size?:         number | null
}) {
  await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('oficios').update({
    ...data,
    proyecto_id:   data.proyecto_id   ?? undefined,
    proyecto2_id:  data.proyecto2_id  ?? undefined,
    assignee_id:   data.assignee_id   ?? undefined,
    assignee2_id:  data.assignee2_id  ?? undefined,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true }
}

export async function createTaskFromOficio(oficioId: string, data: {
  proyecto_id: string
  name: string
  priority: string
  due_date?: string | null
  description?: string | null
  assignee_id?: string | null
  assignee2_id?: string | null
}) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()

  const { data: oficio } = await admin
    .from('oficios')
    .select('especialidad, assignee_id, assignee2_id, task_id')
    .eq('id', oficioId)
    .single()

  if (!oficio) return { error: 'Oficio no encontrado' }
  if (oficio.task_id)  return { error: 'Este oficio ya tiene una tarea vinculada' }

  // Usar los assignees pasados directamente (estado del form) o los del DB como fallback
  const a1 = data.assignee_id  !== undefined ? data.assignee_id  : oficio.assignee_id
  const a2 = data.assignee2_id !== undefined ? data.assignee2_id : oficio.assignee2_id

  const { data: task, error } = await admin.from('tasks').insert({
    project_id:  data.proyecto_id,
    name:        data.name,
    description: data.description || null,
    specialty:   oficio.especialidad ?? null,
    assignee_id: a1 ?? null,
    priority:    data.priority || 'medium',
    due_date:    data.due_date || null,
    status:      'pending',
  }).select('id').single()

  if (error) return { error: error.message }

  const assigneeInserts = []
  if (a1) assigneeInserts.push({ task_id: task.id, user_id: a1 })
  if (a2) assigneeInserts.push({ task_id: task.id, user_id: a2 })
  if (assigneeInserts.length) await admin.from('task_assignees').insert(assigneeInserts)

  await admin.from('oficios').update({ task_id: task.id }).eq('id', oficioId)

  // Notificar a los asignados
  const assigneeNotifyIds = [a1, a2].filter((id): id is string => !!id && id !== user.id)
  const [assignerProfileRes, oficioFullRes, projectRes, assigneeProfilesRes] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('oficios').select('asunto, no_oficio').eq('id', oficioId).single(),
    admin.from('projects').select('name').eq('id', data.proyecto_id).single(),
    assigneeNotifyIds.length
      ? admin.from('profiles').select('id, full_name, phone').in('id', assigneeNotifyIds)
      : Promise.resolve({ data: [] }),
  ])

  const assignerName = assignerProfileRes.data?.full_name ?? 'Un manager'
  const oficioFull   = oficioFullRes.data
  const projectName  = projectRes.data?.name ?? 'Proyecto'
  const dueDateStr   = data.due_date
    ? new Date(data.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin fecha'
  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
  const taskUrl  = `${baseUrl}/tasks?task=${task.id}`

  for (const profile of (assigneeProfilesRes.data ?? [])) {
    // WhatsApp
    const phone = normalizePhone(profile.phone)
    if (phone) {
      const assigneeName = profile.full_name ?? 'Responsable'
      const waResult = await sendMenvioWhatsApp('tarea_asignada', phone, [assigneeName, data.name, projectName, dueDateStr], taskUrl)
      logActivity({ workspace_id: workspaceId, user_id: user.id, action: waResult.ok ? 'whatsapp_sent' : 'whatsapp_error', entity_type: 'task', entity_id: task.id, entity_name: data.name, metadata: { template: 'tarea_asignada', phone, ...(waResult.ok ? { messageSid: waResult.messageSid } : { error: waResult.error }) } })
    }

    // In-app message
    await admin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      sender_id:    null,
      type:         'system',
      content:      `📋 ${assignerName} creó una tarea para el oficio "${oficioFull?.asunto ?? ''}"${oficioFull?.no_oficio ? ` (${oficioFull.no_oficio})` : ''}`,
      metadata:     { action: 'task_created', mention_to: profile.id, from_user: user.id },
    })
  }

  logActivity({ workspace_id: workspaceId, user_id: user.id, action: 'task_created', entity_type: 'task', entity_id: task.id, entity_name: data.name, metadata: { oficio_id: oficioId } })

  revalidatePath('/oficios')
  revalidatePath('/tasks')
  return { success: true, task_id: task.id }
}

export async function updateOficioStatus(id: string, estado: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  return { success: true }
}

export async function assignOficio(id: string, assignee_id: string | null) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').update({ assignee_id }).eq('id', id)
  if (error) return { error: error.message }

  // Notificar al asignado en workspace chat
  if (assignee_id && assignee_id !== user.id && workspaceId) {
    const [oficioRes, assignerRes] = await Promise.all([
      admin.from('oficios').select('asunto, no_oficio').eq('id', id).single(),
      admin.from('profiles').select('full_name').eq('id', user.id).single(),
    ])
    const asunto      = oficioRes.data?.asunto   ?? 'un oficio'
    const noOficio    = oficioRes.data?.no_oficio ? ` (${oficioRes.data.no_oficio})` : ''
    const assignerName = assignerRes.data?.full_name ?? 'Un manager'

    await admin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      sender_id:    null,
      type:         'system',
      content:      `📋 ${assignerName} te asignó el oficio "${asunto}"${noOficio}`,
      metadata:     { action: 'oficio_assigned', oficio_id: id, mention_to: assignee_id, from_user: user.id },
    })
  }

  revalidatePath('/oficios')
  return { success: true }
}

export async function responderOficio(originalId: string, data: {
  no_oficio?:       string | null
  fecha_documento?: string | null
  storage_key?:     string | null
  file_name?:       string | null
  file_type?:       string | null
  file_size?:       number | null
  notas?:           string | null
}) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()

  // Datos del oficio original para heredar contexto
  const { data: original } = await admin
    .from('oficios')
    .select('asunto, proyecto_id, especialidad, destinatario, remitente')
    .eq('id', originalId)
    .single()
  if (!original) return { error: 'Oficio no encontrado' }

  // Crear oficio de salida (la respuesta)
  const { error: insertError } = await admin.from('oficios').insert({
    workspace_id:    workspaceId,
    tipo:            'salida',
    asunto:          original.asunto,
    no_oficio:       data.no_oficio       || null,
    fecha_documento: data.fecha_documento || null,
    proyecto_id:     original.proyecto_id,
    especialidad:    original.especialidad,
    estado:          'vigente',
    remitente:       original.destinatario,
    destinatario:    original.remitente,
    responde_a_id:   originalId,
    storage_key:     data.storage_key || null,
    file_name:       data.file_name   || null,
    file_type:       data.file_type   || null,
    file_size:       data.file_size   || null,
    notas:           data.notas       || null,
    created_by:      user.id,
  })
  if (insertError) return { error: insertError.message }

  // Marcar el original como respondido
  const { error: updateError } = await admin
    .from('oficios')
    .update({ estado: 'respondido' })
    .eq('id', originalId)
  if (updateError) return { error: updateError.message }

  revalidatePath('/oficios')
  return { success: true }
}

export async function deleteOficio(id: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  return { success: true }
}

export async function deleteOficios(ids: string[]) {
  if (ids.length === 0) return { success: true }
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  return { success: true }
}

// ── Antecedentes ──────────────────────────────────────────────────────────────

export async function addOficioAntecedente(
  oficioId: string,
  refTexto: string,
  antecedenteOficioId?: string | null
) {
  await getUser()
  const admin = getAdminClient()
  const { data, error } = await admin.from('oficio_antecedentes').insert({
    oficio_id:             oficioId,
    ref_texto:             refTexto,
    antecedente_oficio_id: antecedenteOficioId || null,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true, id: data.id }
}

export async function removeOficioAntecedente(id: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficio_antecedentes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true }
}

// ── Anexos ────────────────────────────────────────────────────────────────────

export async function addOficioAnexo(
  oficioId: string,
  workspaceId: string,
  tipo: 'link' | 'archivo',
  nombre: string,
  opts: { url?: string | null; storage_key?: string | null; file_name?: string | null; file_size?: number | null }
) {
  const { user } = await getUser()
  const admin = getAdminClient()
  const { data, error } = await admin.from('oficio_anexos').insert({
    oficio_id:   oficioId,
    workspace_id: workspaceId,
    tipo,
    nombre,
    url:         opts.url         || null,
    storage_key: opts.storage_key || null,
    file_name:   opts.file_name   || null,
    file_size:   opts.file_size   || null,
    created_by:  user.id,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true, id: data.id }
}

export async function removeOficioAnexo(id: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('oficio_anexos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true }
}
