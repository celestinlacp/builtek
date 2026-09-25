'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendMenvioTemplate, normalizePhone } from '@/lib/menvio'

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

  return { userId: user.id, workspaceId: data?.workspace_id }
}

export async function createTask(formData: FormData) {
  const { workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const projectId  = formData.get('project_id')  as string
  const assigneeId = formData.get('assignee_id') as string || null
  const dueDate    = formData.get('due_date')    as string || null
  const taskName   = formData.get('name')        as string

  if (!projectId) return { error: 'Selecciona un proyecto' }

  const { data: task, error } = await admin.from('tasks').insert({
    project_id:  projectId,
    name:        taskName,
    description: formData.get('description') as string || null,
    specialty:   formData.get('specialty')   as string || null,
    assignee_id: assigneeId,
    priority:    formData.get('priority')    as string || 'medium',
    due_date:    dueDate,
    status:      'pending',
  }).select('id').single()

  if (error) return { error: error.message }

  // Trigger 1 — notificar al asignado por WhatsApp
  if (assigneeId && task?.id) {
    const [assigneeProfile, projectRes] = await Promise.all([
      admin.from('profiles').select('full_name, phone').eq('id', assigneeId).single(),
      admin.from('projects').select('name').eq('id', projectId).single(),
    ])

    const phone = normalizePhone(assigneeProfile.data?.phone)
    if (phone) {
      const assigneeName  = assigneeProfile.data?.full_name ?? 'Responsable'
      const projectName   = projectRes.data?.name           ?? 'Proyecto'
      const dueDateStr    = dueDate
        ? new Date(dueDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin fecha'

      await sendMenvioTemplate({
        contacts:      [{ name: assigneeName, phone }],
        template_name: 'builtek_tarea_asignada',
        variables:     [projectName, taskName, assigneeName, dueDateStr],
        button_url:    `https://builtek.app/tasks/${task.id}`,
      })
    }
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('tasks').update({ status }).eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTask(taskId: string, formData: FormData) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('tasks').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    specialty: formData.get('specialty') as string || null,
    priority: formData.get('priority') as string,
    due_date: formData.get('due_date') as string || null,
    status: formData.get('status') as string,
  }).eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('tasks').delete().eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function addComment(taskId: string, content: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const trimmed = content.trim()
  const { error } = await admin.from('comments').insert({
    task_id: taskId,
    user_id: userId,
    content: trimmed,
  })
  if (error) return { error: error.message }

  // Detect @mentions and notify in workspace chat
  const mentionMatches = trimmed.match(/@([\wáéíóúÁÉÍÓÚüÜñÑ]+(?:\s[\wáéíóúÁÉÍÓÚüÜñÑ]+)?)/g)
  if (mentionMatches?.length && workspaceId) {
    const [taskRes, authorRes, membersRes] = await Promise.all([
      admin.from('tasks').select('name').eq('id', taskId).single(),
      admin.from('profiles').select('full_name').eq('id', userId).single(),
      admin.from('workspace_members').select('user_id').eq('workspace_id', workspaceId),
    ])

    const taskName   = taskRes.data?.name    ?? 'una tarea'
    const authorName = authorRes.data?.full_name ?? 'Alguien'

    const memberIds = (membersRes.data ?? []).map((m: any) => m.user_id)
    const { data: memberProfiles } = await admin
      .from('profiles').select('id, full_name').in('id', memberIds)

    const profilesMap: Record<string, string> = Object.fromEntries(
      (memberProfiles ?? []).map((p: any) => [p.id, p.full_name as string])
    )

    const snippet = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed

    for (const match of mentionMatches) {
      const query = match.slice(1).toLowerCase().trim()
      const found = Object.entries(profilesMap).find(([, name]) =>
        name.toLowerCase().startsWith(query) || name.toLowerCase().includes(query)
      )
      if (!found) continue
      const [mentionedId] = found
      if (mentionedId === userId) continue // no notificar a uno mismo

      await admin.from('workspace_messages').insert({
        workspace_id: workspaceId,
        sender_id:    null,
        type:         'system',
        content:      `💬 ${authorName} te mencionó en la tarea "${taskName}": "${snippet}"`,
        metadata:     { action: 'mention', mention_to: mentionedId, task_id: taskId, from_user: userId },
      })
    }
  }

  return { success: true }
}

export async function deleteComment(commentId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function linkDocument(data: {
  task_id:       string
  document_id?:  string
  drive_file_id?: string
}) {
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('task_documents').insert({
    task_id:       data.task_id,
    document_id:   data.document_id   || null,
    drive_file_id: data.drive_file_id || null,
    linked_by:     userId,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function unlinkDocument(taskDocId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('task_documents').delete().eq('id', taskDocId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Entregables ───────────────────────────────────────────────────────────────

export async function uploadEntregable(data: {
  taskId:      string
  workspaceId: string
  storageKey:  string
  fileName:    string
  fileType:    string
  fileSize:    number
}) {
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()

  // Insertar entregable
  const { error } = await admin.from('entregables').insert({
    task_id:      data.taskId,
    workspace_id: data.workspaceId,
    uploaded_by:  userId,
    file_url:     data.storageKey,
    file_name:    data.fileName,
    file_type:    data.fileType,
    file_size:    data.fileSize,
    status:       'pending',
  })
  if (error) return { error: error.message }

  // Mover tarea a "en revisión" automáticamente
  await admin.from('tasks').update({ status: 'review' }).eq('id', data.taskId)

  revalidatePath('/tasks')
  revalidatePath('/deliverables')
  return { success: true }
}

export async function approveEntregable(entregableId: string, taskId: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  // Obtener info del entregable para la notificación
  const { data: ent } = await admin
    .from('entregables')
    .select('file_name, uploaded_by, task_id, tasks(name)')
    .eq('id', entregableId)
    .single()

  if (!ent) return { error: 'Entregable no encontrado' }

  // Aprobar entregable
  await admin.from('entregables').update({
    status:      'approved',
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', entregableId)

  // Mover tarea a done
  await admin.from('tasks').update({ status: 'done' }).eq('id', taskId)

  // Obtener nombre del revisor
  const { data: reviewer } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  const reviewerName = reviewer?.full_name || 'Un manager'
  const taskName = (ent.tasks as any)?.name || 'Tarea'

  // Notificación sistema en workspace chat
  await admin.from('workspace_messages').insert({
    workspace_id: workspaceId,
    sender_id:    null,
    type:         'system',
    content:      `✅ Entregable aprobado: "${ent.file_name}" de la tarea "${taskName}" fue aprobado por ${reviewerName}.`,
    metadata:     { entregable_id: entregableId, task_id: taskId, action: 'approved', for_user: ent.uploaded_by },
  })

  revalidatePath('/tasks')
  revalidatePath('/deliverables')
  return { success: true }
}

export async function rejectEntregable(entregableId: string, taskId: string, note: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { data: ent } = await admin
    .from('entregables')
    .select('file_name, uploaded_by, tasks(name)')
    .eq('id', entregableId)
    .single()

  if (!ent) return { error: 'Entregable no encontrado' }

  // Rechazar entregable
  await admin.from('entregables').update({
    status:      'rejected',
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    review_note: note,
  }).eq('id', entregableId)

  // Regresar tarea a en_progreso
  await admin.from('tasks').update({ status: 'in_progress' }).eq('id', taskId)

  // Obtener nombre del revisor
  const { data: reviewer } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  const reviewerName = reviewer?.full_name || 'Un manager'
  const taskName = (ent.tasks as any)?.name || 'Tarea'

  // Notificación sistema
  await admin.from('workspace_messages').insert({
    workspace_id: workspaceId,
    sender_id:    null,
    type:         'system',
    content:      `❌ Entregable rechazado: "${ent.file_name}" de "${taskName}" fue rechazado por ${reviewerName}. Motivo: ${note}`,
    metadata:     { entregable_id: entregableId, task_id: taskId, action: 'rejected', for_user: ent.uploaded_by },
  })

  revalidatePath('/tasks')
  revalidatePath('/deliverables')
  return { success: true }
}

export async function archiveEntregable(entregableId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('entregables').update({ is_archived: true }).eq('id', entregableId)
  if (error) return { error: error.message }
  revalidatePath('/deliverables')
  return { success: true }
}

export async function deleteEntregable(entregableId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('entregables').delete().eq('id', entregableId)
  if (error) return { error: error.message }
  revalidatePath('/deliverables')
  revalidatePath('/tasks')
  return { success: true }
}

// ── Oficios vinculados a tarea ─────────────────────────────────────────────────

export async function linkOficioToTask(oficioId: string, taskId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').update({ task_id: taskId }).eq('id', oficioId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  revalidatePath('/oficios')
  return { success: true }
}

export async function unlinkOficioFromTask(oficioId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('oficios').update({ task_id: null }).eq('id', oficioId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  revalidatePath('/oficios')
  return { success: true }
}

export async function reprogramTask(taskId: string, newDueDate: string, reason: string) {
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { error } = await admin.from('tasks').update({ due_date: newDueDate }).eq('id', taskId)
  if (error) return { error: error.message }

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  const name = profile?.full_name || 'Usuario'
  const formatted = new Date(newDueDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const content = `📅 Reprogramada al ${formatted}\nMotivo: ${reason}\n— ${name}`

  await admin.from('comments').insert({ task_id: taskId, user_id: userId, content })

  revalidatePath('/tasks')
  return { success: true }
}
