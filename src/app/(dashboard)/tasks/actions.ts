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
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const projectId   = formData.get('project_id')  as string
  const assigneeIds = (formData.getAll('assignee_ids') as string[]).filter(Boolean).slice(0, 2)
  const dueDate     = formData.get('due_date')    as string || null
  const taskName    = formData.get('name')        as string
  const primaryAssigneeId = assigneeIds[0] ?? null

  if (!projectId) return { error: 'Selecciona un proyecto' }

  const { data: task, error } = await admin.from('tasks').insert({
    project_id:  projectId,
    name:        taskName,
    description: formData.get('description') as string || null,
    specialty:   formData.get('specialty')   as string || null,
    assignee_id: primaryAssigneeId,
    priority:    formData.get('priority')    as string || 'medium',
    due_date:    dueDate,
    status:      'pending',
  }).select('id').single()

  if (error) return { error: error.message }

  // Insertar en task_assignees
  if (assigneeIds.length > 0 && task?.id) {
    await admin.from('task_assignees').insert(
      assigneeIds.map(uid => ({ task_id: task.id, user_id: uid }))
    )
  }

  // Notificar a TODOS los asignados por WhatsApp
  if (assigneeIds.length > 0 && task?.id) {
    const [profilesRes, projectRes] = await Promise.all([
      admin.from('profiles').select('id, full_name, phone').in('id', assigneeIds),
      admin.from('projects').select('name').eq('id', projectId).single(),
    ])

    const projectName = projectRes.data?.name ?? 'Proyecto'
    const dueDateStr  = dueDate
      ? new Date(dueDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Sin fecha'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
    const taskUrl = `${baseUrl}/tasks?task=${task.id}`

    for (const profile of (profilesRes.data ?? [])) {
      const phone = normalizePhone(profile.phone)
      if (!phone) continue
      const assigneeName = profile.full_name ?? 'Responsable'
      const waResult = await sendMenvioWhatsApp('tarea_asignada', phone, [assigneeName, taskName, projectName, dueDateStr], taskUrl)
      if (workspaceId) {
        logActivity({ workspace_id: workspaceId, user_id: userId ?? null, action: waResult.ok ? 'whatsapp_sent' : 'whatsapp_error', entity_type: 'task', entity_id: task.id, entity_name: taskName, metadata: { template: 'tarea_asignada', phone, ...(waResult.ok ? { messageSid: waResult.messageSid } : { error: waResult.error }) } })
      }
    }
  }

  if (task?.id && workspaceId) {
    logActivity({ workspace_id: workspaceId, user_id: userId ?? null, action: 'task_created', entity_type: 'task', entity_id: task.id, entity_name: taskName, metadata: { project_id: projectId } })
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTaskName(taskId: string, name: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('tasks').update({ name: name.trim() }).eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()
  const { data: task } = await admin.from('tasks').select('name').eq('id', taskId).single()
  const { error } = await admin.from('tasks').update({ status }).eq('id', taskId)
  if (error) return { error: error.message }
  if (status === 'done' && workspaceId) {
    logActivity({ workspace_id: workspaceId, user_id: userId ?? null, action: 'task_completed', entity_type: 'task', entity_id: taskId, entity_name: task?.name ?? null })
  }
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

export async function addComment(taskId: string, content: string, imageUrl?: string | null) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const trimmed = content.trim()
  const { error } = await admin.from('comments').insert({
    task_id:   taskId,
    user_id:   userId,
    content:   trimmed || ' ',
    image_url: imageUrl || null,
  })
  if (error) return { error: error.message }

  // Notify workspace on every comment + extra notification for @mentions
  if (workspaceId) {
    const mentionMatches = trimmed.match(/@([\wáéíóúÁÉÍÓÚüÜñÑ]+(?:\s[\wáéíóúÁÉÍÓÚüÜñÑ]+)?)/g)
    const hasMentions = !!mentionMatches?.length

    const [taskRes, authorRes, membersRes] = await Promise.all([
      admin.from('tasks').select('name').eq('id', taskId).single(),
      admin.from('profiles').select('full_name').eq('id', userId).single(),
      hasMentions
        ? admin.from('workspace_members').select('user_id').eq('workspace_id', workspaceId)
        : Promise.resolve({ data: [] }),
    ])

    const taskName   = taskRes.data?.name       ?? 'una tarea'
    const authorName = authorRes.data?.full_name ?? 'Alguien'
    const snippet    = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed

    // General comment notification (visible to the whole workspace)
    await admin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      sender_id:    null,
      type:         'system',
      content:      `💬 ${authorName} comentó en "${taskName}": "${snippet}"`,
      metadata:     { action: 'comment', entity_type: 'task', entity_id: taskId, task_name: taskName },
    })

    // @mention notifications
    if (hasMentions) {
      const memberIds = ((membersRes as any).data ?? []).map((m: any) => m.user_id)
      const { data: memberProfiles } = await admin
        .from('profiles').select('id, full_name').in('id', memberIds)
      const profilesMap: Record<string, string> = Object.fromEntries(
        (memberProfiles ?? []).map((p: any) => [p.id, p.full_name as string])
      )

      for (const match of mentionMatches!) {
        const query = match.slice(1).toLowerCase().trim()
        const found = Object.entries(profilesMap).find(([, name]) =>
          name.toLowerCase().startsWith(query) || name.toLowerCase().includes(query)
        )
        if (!found) continue
        const [mentionedId] = found
        if (mentionedId === userId) continue

        await admin.from('workspace_messages').insert({
          workspace_id: workspaceId,
          sender_id:    null,
          type:         'system',
          content:      `💬 ${authorName} te mencionó en "${taskName}": "${snippet}"`,
          metadata:     { action: 'mention', mention_to: mentionedId, entity_type: 'task', entity_id: taskId, task_name: taskName, from_user: userId },
        })
      }
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

  // Obtener el assignee_id de la tarea para asignarlo al oficio
  const { data: task } = await admin.from('tasks').select('assignee_id').eq('id', taskId).single()

  const { error } = await admin.from('oficios').update({
    task_id:     taskId,
    estado:      'en_atencion',
    assignee_id: task?.assignee_id ?? null,
  }).eq('id', oficioId)

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

export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const { workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()
  const capped = userIds.slice(0, 2)
  await admin.from('task_assignees').delete().eq('task_id', taskId)
  if (capped.length > 0) {
    await admin.from('task_assignees').insert(capped.map(uid => ({ task_id: taskId, user_id: uid })))
  }
  const primaryAssigneeId = capped[0] ?? null
  await admin.from('tasks').update({ assignee_id: primaryAssigneeId }).eq('id', taskId)

  // Notificar al nuevo asignado principal por WhatsApp
  if (primaryAssigneeId) {
    const [taskRes, assigneeRes] = await Promise.all([
      admin.from('tasks').select('name, due_date, projects(name)').eq('id', taskId).single(),
      admin.from('profiles').select('full_name, phone').eq('id', primaryAssigneeId).single(),
    ])

    const phone = normalizePhone(assigneeRes.data?.phone)
    if (phone) {
      const assigneeName = assigneeRes.data?.full_name ?? 'Responsable'
      const taskName     = taskRes.data?.name ?? 'Tarea'
      const projectName  = (taskRes.data?.projects as any)?.name ?? 'Proyecto'
      const dueDateStr   = taskRes.data?.due_date
        ? new Date(taskRes.data.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin fecha'
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
      const taskUrl = `${baseUrl}/tasks?task=${taskId}`
      const waResult = await sendMenvioWhatsApp('tarea_asignada', phone, [assigneeName, taskName, projectName, dueDateStr], taskUrl)
      if (workspaceId) {
        logActivity({ workspace_id: workspaceId, user_id: null, action: waResult.ok ? 'whatsapp_sent' : 'whatsapp_error', entity_type: 'task', entity_id: taskId, entity_name: taskName, metadata: { template: 'tarea_asignada', phone, ...(waResult.ok ? { messageSid: waResult.messageSid } : { error: waResult.error }) } })
      }
    }
  }

  revalidatePath('/tasks')
  return { success: true }
}

// ── Reenviar notificación WhatsApp ────────────────────────────────────────────

export async function resendTaskNotification(taskId: string): Promise<{ ok: boolean; sent: number; error?: string }> {
  const { workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { data: task } = await admin
    .from('tasks')
    .select('name, due_date, projects(name), task_assignees(user_id)')
    .eq('id', taskId)
    .single()

  if (!task) return { ok: false, sent: 0, error: 'Tarea no encontrada' }

  const assigneeIds = (task.task_assignees as { user_id: string }[]).map(a => a.user_id)
  if (!assigneeIds.length) return { ok: false, sent: 0, error: 'La tarea no tiene asignados' }

  const { data: profiles } = await admin.from('profiles').select('id, full_name, phone').in('id', assigneeIds)

  const taskName    = task.name
  const projectName = (task.projects as any)?.name ?? 'Proyecto'
  const dueDateStr  = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin fecha'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
  const taskUrl = `${baseUrl}/tasks?task=${taskId}`

  let sent = 0
  for (const profile of (profiles ?? [])) {
    const phone = normalizePhone(profile.phone)
    if (!phone) continue
    const assigneeName = profile.full_name ?? 'Responsable'
    const waResult = await sendMenvioWhatsApp('tarea_asignada', phone, [assigneeName, taskName, projectName, dueDateStr], taskUrl)
    if (workspaceId) {
      logActivity({ workspace_id: workspaceId, user_id: profile.id, action: waResult.ok ? 'whatsapp_sent' : 'whatsapp_error', entity_type: 'task', entity_id: taskId, entity_name: taskName, metadata: { template: 'tarea_asignada', phone, resend: true, ...(waResult.ok ? { messageSid: waResult.messageSid } : { error: waResult.error }) } })
    }
    if (waResult.ok) sent++
  }

  return { ok: sent > 0, sent }
}

// ── Drive Temporal ────────────────────────────────────────────────────────────

export async function getOrCreateTempFolder(workspaceId: string): Promise<{ folderId?: string; error?: string }> {
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { data: existing } = await admin
    .from('drive_folders')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_system', true)
    .is('parent_folder_id', null)
    .maybeSingle()

  if (existing?.id) return { folderId: existing.id }

  const { data: created, error } = await admin
    .from('drive_folders')
    .insert({ workspace_id: workspaceId, name: 'Archivos Temporales', parent_folder_id: null, created_by: userId, is_system: true })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { folderId: created.id }
}

export async function saveTempAndLink(data: {
  workspaceId: string
  taskId:      string
  storageKey:  string
  fileName:    string
  fileType:    string
  fileSize:    number
  folderId:    string
}) {
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { data: file, error } = await admin.from('drive_files').insert({
    workspace_id: data.workspaceId,
    folder_id:    data.folderId,
    name:         data.fileName,
    file_name:    data.fileName,
    storage_key:  data.storageKey,
    file_type:    data.fileType,
    file_size:    data.fileSize,
    uploaded_by:  userId,
  }).select('id').single()

  if (error) return { error: error.message }

  await admin.from('task_documents').insert({
    task_id:       data.taskId,
    drive_file_id: file.id,
    linked_by:     userId,
  })

  revalidatePath('/tasks')
  revalidatePath('/drive')
  return { success: true }
}

export async function reprogramTask(taskId: string, newDueDate: string, reason: string) {
  const { userId, workspaceId } = await getWorkspaceId()
  const admin = getAdminClient()

  const { error } = await admin.from('tasks').update({ due_date: newDueDate }).eq('id', taskId)
  if (error) return { error: error.message }

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  const name = profile?.full_name || 'Usuario'
  const formatted = new Date(newDueDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const content = `📅 Reprogramada al ${formatted}\nMotivo: ${reason}\n— ${name}`

  await admin.from('comments').insert({ task_id: taskId, user_id: userId, content })

  if (workspaceId) {
    logActivity({ workspace_id: workspaceId, user_id: userId ?? null, action: 'task_reprogram', entity_type: 'task', entity_id: taskId, metadata: { new_due_date: newDueDate, reason } })
  }

  revalidatePath('/tasks')
  return { success: true }
}
