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
  return { supabase, user }
}

export async function saveDocument(data: {
  project_id:    string
  workspace_id:  string
  specialty_id:  string | null
  file_name:     string
  display_name:  string | null
  emission_date: string | null
  author:        string
  notes:         string | null
  storage_key:   string
  file_type:     string
  file_size:     number
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('documents').insert({
    project_id:       data.project_id,
    workspace_id:     data.workspace_id,
    specialty_id:     data.specialty_id,
    name:             data.display_name || data.file_name,
    file_name:        data.file_name,
    display_name:     data.display_name,
    emission_date:    data.emission_date,
    author:           data.author,
    notes:            data.notes,
    storage_key:      data.storage_key,
    file_url:         data.storage_key,
    file_type:        data.file_type,
    file_size:        data.file_size,
    version:          1,
    status:           'draft',
    doc_status:       'active',
    uploaded_by:      user.id,
    embedding_status: 'pending',
  })

  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function updateDocumentStatus(docId: string, status: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').update({ status }).eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

// Soft delete: solicita borrado en lugar de eliminar directamente
export async function requestDeleteDocument(docId: string, reason?: string) {
  const { user } = await getUser()
  const admin = getAdminClient()

  // Marcar doc como pending_delete
  await admin.from('documents').update({ doc_status: 'pending_delete' }).eq('id', docId)

  // Crear solicitud de borrado para que admin apruebe
  const { error } = await admin.from('delete_requests').insert({
    document_id:  docId,
    requested_by: user.id,
    reason:       reason || null,
    status:       'pending',
  })

  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function deleteDocument(docId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').delete().eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function approveDeleteRequest(requestId: string, docId: string) {
  const { user } = await getUser()
  const admin = getAdminClient()

  await admin.from('delete_requests').update({
    status:      'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  await admin.from('documents').update({ doc_status: 'deleted' }).eq('id', docId)

  revalidatePath('/documents')
  return { success: true }
}

export async function rejectDeleteRequest(requestId: string, docId: string, note: string) {
  const { user } = await getUser()
  const admin = getAdminClient()

  await admin.from('delete_requests').update({
    status:      'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_note: note,
  }).eq('id', requestId)

  await admin.from('documents').update({ doc_status: 'active' }).eq('id', docId)

  revalidatePath('/documents')
  return { success: true }
}
