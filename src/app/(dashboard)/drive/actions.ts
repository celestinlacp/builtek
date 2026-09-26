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

export async function createFolder(data: {
  workspace_id: string
  parent_folder_id: string | null
  name: string
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('drive_folders').insert({
    workspace_id:     data.workspace_id,
    parent_folder_id: data.parent_folder_id,
    name:             data.name.trim(),
    created_by:       user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function saveDriveFile(data: {
  workspace_id: string
  folder_id:    string | null
  name:         string
  file_name:    string
  storage_key:  string
  file_type:    string
  file_size:    number
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { data: file, error } = await admin.from('drive_files').insert({
    workspace_id: data.workspace_id,
    folder_id:    data.folder_id,
    name:         data.name,
    file_name:    data.file_name,
    storage_key:  data.storage_key,
    file_type:    data.file_type,
    file_size:    data.file_size,
    uploaded_by:  user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // Registrar evento de upload para trazabilidad
  await admin.from('drive_upload_logs').insert({
    workspace_id: data.workspace_id,
    file_id:      file.id,
    file_name:    data.file_name,
    storage_key:  data.storage_key,
    uploaded_by:  user.id,
    action:       'upload',
  })

  revalidatePath('/drive')
  return { success: true }
}

export async function replaceFile(data: {
  file_id:      string
  workspace_id: string
  file_name:    string
  storage_key:  string
  file_type:    string
  file_size:    number
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('drive_files').update({
    file_name:   data.file_name,
    storage_key: data.storage_key,
    file_type:   data.file_type,
    file_size:   data.file_size,
  }).eq('id', data.file_id)

  if (error) return { error: error.message }

  // Registrar evento de reemplazo
  await admin.from('drive_upload_logs').insert({
    workspace_id: data.workspace_id,
    file_id:      data.file_id,
    file_name:    data.file_name,
    storage_key:  data.storage_key,
    uploaded_by:  user.id,
    action:       'replace',
  })

  revalidatePath('/drive')
  return { success: true }
}

export async function deleteFolder(folderId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('drive_folders').delete().eq('id', folderId)
  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function deleteDriveFile(fileId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('drive_files').delete().eq('id', fileId)
  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function renameFolder(folderId: string, name: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('drive_folders').update({ name: name.trim(), updated_at: new Date().toISOString() }).eq('id', folderId)
  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function createShare(data: {
  workspace_id: string
  file_id:      string
  label?:       string
  expires_at?:  string | null
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { data: share, error } = await admin.from('drive_shares').insert({
    workspace_id: data.workspace_id,
    file_id:      data.file_id,
    label:        data.label || null,
    expires_at:   data.expires_at || null,
    created_by:   user.id,
  }).select('token').single()

  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { token: share.token }
}

export async function revokeShare(shareId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('drive_shares').update({ is_active: false }).eq('id', shareId)
  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function getWorkspaceShares(workspaceId: string) {
  await getUser()
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('drive_shares')
    .select('id, token, label, is_active, expires_at, access_count, last_accessed, created_at, drive_files(name, file_type)')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { shares: data }
}
