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
  remitente?:       string | null
  destinatario?:    string | null
  assignee_id?:     string | null
  storage_key?:     string | null
  file_name?:       string | null
  file_type?:       string | null
  file_size?:       number | null
  notas?:           string | null
}) {
  const { user, workspaceId } = await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('oficios').insert({
    workspace_id:    workspaceId,
    tipo:            data.tipo,
    asunto:          data.asunto,
    no_oficio:       data.no_oficio       || null,
    fecha_documento: data.fecha_documento || null,
    fecha_recepcion: data.fecha_recepcion || null,
    proyecto_id:     data.proyecto_id     || null,
    especialidad:    data.especialidad    || null,
    estado:          'pendiente',
    remitente:       data.remitente       || null,
    destinatario:    data.destinatario    || null,
    assignee_id:     data.assignee_id     || null,
    storage_key:     data.storage_key     || null,
    file_name:       data.file_name       || null,
    file_type:       data.file_type       || null,
    file_size:       data.file_size       || null,
    notas:           data.notas           || null,
    created_by:      user.id,
  })

  if (error) return { error: error.message }

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
