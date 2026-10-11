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

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  return { userId: user.id, workspaceId: data?.workspace_id as string }
}

// ── Flows ──────────────────────────────────────────────────────────────────────

export async function createFlow(data: {
  name: string
  description?: string | null
  project_id?: string | null
}) {
  const { userId, workspaceId } = await getCtx()
  const admin = getAdminClient()
  const { data: flow, error } = await admin.from('flows').insert({
    workspace_id: workspaceId,
    project_id: data.project_id || null,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    created_by: userId,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true, id: flow.id }
}

export async function updateFlow(flowId: string, data: {
  name?: string
  description?: string | null
  project_id?: string | null
}) {
  await getCtx()
  const admin = getAdminClient()
  const { error } = await admin.from('flows').update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq('id', flowId)
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true }
}

export async function deleteFlow(flowId: string) {
  await getCtx()
  const admin = getAdminClient()
  const { error } = await admin.from('flows').delete().eq('id', flowId)
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true }
}

// ── Flow Steps ─────────────────────────────────────────────────────────────────

export async function addFlowStep(data: {
  flow_id: string
  name: string
  fecha_documento?: string | null
  estado?: string
  especialidad?: string | null
  position: number
  is_decision?: boolean
  note?: string | null
  document_id?: string | null
}) {
  const { workspaceId } = await getCtx()
  const admin = getAdminClient()
  const { error } = await admin.from('flow_steps').insert({
    flow_id: data.flow_id,
    workspace_id: workspaceId,
    name: data.name.trim(),
    fecha_documento: data.fecha_documento || null,
    estado: data.estado || 'pending',
    especialidad: data.especialidad || null,
    position: data.position,
    is_decision: data.is_decision || false,
    note: data.note?.trim() || null,
    document_id: data.document_id || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true }
}

export async function updateFlowStep(stepId: string, data: {
  name?: string
  fecha_documento?: string | null
  estado?: string
  especialidad?: string | null
  is_decision?: boolean
  note?: string | null
  document_id?: string | null
}) {
  await getCtx()
  const admin = getAdminClient()
  const update: Record<string, unknown> = { ...data }
  if (data.name) update.name = data.name.trim()
  if (data.note !== undefined) update.note = data.note?.trim() || null
  const { error } = await admin.from('flow_steps').update(update).eq('id', stepId)
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true }
}

export async function deleteFlowStep(stepId: string) {
  await getCtx()
  const admin = getAdminClient()
  const { error } = await admin.from('flow_steps').delete().eq('id', stepId)
  if (error) return { error: error.message }
  revalidatePath('/flows')
  return { success: true }
}

export async function swapFlowSteps(a: { id: string; position: number }, b: { id: string; position: number }) {
  await getCtx()
  const admin = getAdminClient()
  await Promise.all([
    admin.from('flow_steps').update({ position: b.position }).eq('id', a.id),
    admin.from('flow_steps').update({ position: a.position }).eq('id', b.id),
  ])
  revalidatePath('/flows')
  return { success: true }
}
