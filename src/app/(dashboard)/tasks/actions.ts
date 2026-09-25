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

  const projectId = formData.get('project_id') as string
  if (!projectId) return { error: 'Selecciona un proyecto' }

  const { error } = await admin.from('tasks').insert({
    project_id: projectId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    specialty: formData.get('specialty') as string || null,
    assignee_id: formData.get('assignee_id') as string || null,
    priority: formData.get('priority') as string || 'medium',
    due_date: formData.get('due_date') as string || null,
    status: 'pending',
  })

  if (error) return { error: error.message }
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
  const { userId } = await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('comments').insert({
    task_id: taskId,
    user_id: userId,
    content: content.trim(),
  })
  if (error) return { error: error.message }
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
