'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  asunto:          string
  no_oficio?:       string | null
  fecha_documento?: string | null
  fecha_recepcion?: string | null
  proyecto_id?:     string | null
  especialidad?:    string | null
  tema?:            string | null
  remitente?:       string | null
  destinatario?:    string | null
  assignee_id?:     string | null
  responde_a_id?:   string | null
  storage_key?:     string | null
  file_name?:       string | null
  file_type?:       string | null
  file_size?:       number | null
  notas?:           string | null
  antecedentes?:    Array<{ ref_texto: string; antecedente_oficio_id?: string | null }>
  anexos?:          Array<{ tipo: 'link' | 'archivo'; nombre: string; url?: string | null; storage_key?: string | null; file_name?: string | null; file_size?: number | null }>
}) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()

  const { data: created, error } = await admin.from('oficios').insert({
    workspace_id:    workspaceId,
    tipo:            data.tipo,
    asunto:          data.asunto,
    no_oficio:       data.no_oficio       || null,
    fecha_documento: data.fecha_documento || null,
    fecha_recepcion: data.fecha_recepcion || null,
    proyecto_id:     data.proyecto_id     || null,
    especialidad:    data.especialidad    || null,
    tema:            data.tema            || null,
    estado:          'pendiente',
    remitente:       data.remitente       || null,
    destinatario:    data.destinatario    || null,
    assignee_id:     data.assignee_id     || null,
    responde_a_id:   data.responde_a_id   || null,
    storage_key:     data.storage_key     || null,
    file_name:       data.file_name       || null,
    file_type:       data.file_type       || null,
    file_size:       data.file_size       || null,
    notas:           data.notas           || null,
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

  // Notificar al asignado si se especificó uno
  if (data.assignee_id && data.assignee_id !== user.id && workspaceId) {
    const { data: assignerProfile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
    const assignerName = assignerProfile?.full_name ?? 'Un manager'
    await admin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      sender_id:    null,
      type:         'system',
      content:      `📋 ${assignerName} te asignó el oficio "${data.asunto}"${data.no_oficio ? ` (${data.no_oficio})` : ''}`,
      metadata:     { action: 'oficio_assigned', mention_to: data.assignee_id, from_user: user.id },
    })
  }

  revalidatePath('/oficios')
  return { success: true }
}

export async function updateOficio(id: string, data: {
  asunto?:          string
  no_oficio?:       string | null
  fecha_documento?: string | null
  fecha_recepcion?: string | null
  proyecto_id?:     string | null
  especialidad?:    string | null
  tema?:            string | null
  estado?:          string
  remitente?:       string | null
  destinatario?:    string | null
  assignee_id?:     string | null
  notas?:           string | null
}) {
  await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('oficios').update({
    ...data,
    proyecto_id:  data.proyecto_id  ?? undefined,
    assignee_id:  data.assignee_id  ?? undefined,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/oficios')
  revalidatePath('/especificaciones')
  return { success: true }
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
