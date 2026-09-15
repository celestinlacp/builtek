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
