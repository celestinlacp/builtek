'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'

async function deleteFromR2(storageKey: string | null) {
  if (!storageKey || !r2IsConfigured()) return
  try {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET(), Key: storageKey }))
  } catch (e) {
    console.error('[R2] Error al eliminar:', storageKey, e)
  }
}

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
  const { data: file } = await admin.from('drive_files').select('storage_key').eq('id', fileId).single()
  const { error } = await admin.from('drive_files').delete().eq('id', fileId)
  if (error) return { error: error.message }
  await deleteFromR2(file?.storage_key ?? null)
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

export async function getWorkspaceOficiosSalida(workspaceId: string) {
  await getUser()
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('oficios')
    .select('id, no_oficio, asunto')
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'salida')
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { oficios: (data ?? []) as { id: string; no_oficio: string | null; asunto: string }[] }
}

export async function updateShare(shareId: string, data: { oficio_id?: string | null }) {
  await getUser()
  const admin = getAdminClient()
  const update: Record<string, unknown> = {}
  if ('oficio_id' in data) update.oficio_id = data.oficio_id || null
  const { error } = await admin.from('drive_shares').update(update).eq('id', shareId)
  if (error) return { error: error.message }
  revalidatePath('/drive')
  return { success: true }
}

export async function createShare(data: {
  workspace_id: string
  file_id?:     string | null
  folder_id?:   string | null
  label?:       string
  expires_at?:  string | null
  oficio_id?:   string | null
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { data: share, error } = await admin.from('drive_shares').insert({
    workspace_id: data.workspace_id,
    file_id:      data.file_id   || null,
    folder_id:    data.folder_id || null,
    label:        data.label     || null,
    expires_at:   data.expires_at || null,
    oficio_id:    data.oficio_id || null,
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
    .select('id, token, label, is_active, expires_at, access_count, last_accessed, created_at, created_by, folder_id, oficio_id, drive_files(name, file_type, folder_id, drive_folders(name)), drive_folders(name), oficios(no_oficio, asunto)')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  // Enriquecer con nombre del creador
  const creatorIds = [...new Set((data ?? []).map((s: any) => s.created_by).filter(Boolean))]
  const creatorMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: users } = await admin.from('users').select('id, full_name').in('id', creatorIds)
    for (const u of (users ?? [])) {
      if (u.id && u.full_name) creatorMap[u.id] = u.full_name
    }
  }

  const enriched = (data ?? []).map((s: any) => ({
    ...s,
    created_by_name:  creatorMap[s.created_by] ?? null,
    file_folder_name: (s.drive_files as any)?.drive_folders?.name ?? null,
    folder_name:      (s.drive_folders as any)?.name ?? null,
    oficio_no:        (s.oficios as any)?.no_oficio ?? null,
    oficio_asunto:    (s.oficios as any)?.asunto ?? null,
  }))

  return { shares: enriched }
}
