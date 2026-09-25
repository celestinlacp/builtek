'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { parseDocKey } from './utils'

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

  // Detectar nomenclatura AEC
  const parsed = parseDocKey(data.file_name)

  let previousVersionId: string | null = null
  let newVersionNumber = 1

  if (parsed) {
    // Buscar versión vigente con el mismo doc_key en este workspace
    const { data: existing } = await admin
      .from('documents')
      .select('id, version_number')
      .eq('workspace_id', data.workspace_id)
      .eq('doc_key', parsed.doc_key)
      .eq('is_current', true)
      .maybeSingle()

    if (existing) {
      previousVersionId = existing.id
      newVersionNumber  = (existing.version_number ?? 0) + 1

      // Archivar versión anterior
      await admin.from('documents').update({
        is_current: false,
        doc_status: 'archived',
      }).eq('id', existing.id)
    }

    newVersionNumber = parsed.version_number
  }

  // Insertar nueva versión
  const { data: inserted, error } = await admin.from('documents').insert({
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
    version:          newVersionNumber,
    doc_key:          parsed?.doc_key          ?? null,
    version_number:   parsed?.version_number   ?? null,
    is_current:       true,
    status:           'draft',
    doc_status:       'active',
    uploaded_by:      user.id,
    embedding_status: 'pending',
  }).select('id').single()

  if (error) return { error: error.message }

  // Enlazar versión anterior con la nueva (superseded_by)
  if (previousVersionId && inserted?.id) {
    await admin.from('documents').update({
      superseded_by: inserted.id,
    }).eq('id', previousVersionId)
  }

  revalidatePath('/documents')
  return {
    success:             true,
    archivedPrevious:    !!previousVersionId,
    versionNumber:       parsed?.version_number ?? null,
  }
}

export async function getDocumentVersions(docKey: string, workspaceId: string) {
  const { supabase } = await getUser()
  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, version_number, status, doc_status, is_current, emission_date, uploaded_by, created_at, uploader:profiles!documents_uploaded_by_fkey(full_name, initials)')
    .eq('workspace_id', workspaceId)
    .eq('doc_key', docKey)
    .order('version_number', { ascending: false })

  if (error) return { error: error.message }
  return { data }
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

// ── Flujo de aprobación ELAB → REV → APR ─────────────────────────────────────

export async function submitForReview(docId: string) {
  const { user } = await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').update({
    status:               'review',
    review_requested_by:  user.id,
    review_requested_at:  new Date().toISOString(),
    rejection_note:       null,
  }).eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function approveDocument(docId: string) {
  const { user } = await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').update({
    status:      'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

export async function rejectDocument(docId: string, note: string) {
  const { user } = await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').update({
    status:         'rejected',
    rejection_note: note || null,
    approved_by:    null,
    approved_at:    null,
  }).eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}

// ── Comentarios de control de cambios ─────────────────────────────────────────

export async function addDocumentComment(documentId: string, workspaceId: string, content: string) {
  const { user } = await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('document_comments').insert({
    document_id:  documentId,
    workspace_id: workspaceId,
    user_id:      user.id,
    content:      content.trim(),
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteDocumentComment(commentId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('document_comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  return { success: true }
}
