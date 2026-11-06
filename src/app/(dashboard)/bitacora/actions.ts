'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET, r2IsConfigured } from '@/lib/r2/client'
import type { PhotoTag } from '@/types'

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

async function deleteFromR2(storageKey: string | null) {
  if (!storageKey || !r2IsConfigured()) return
  try {
    await getR2Client().send(new DeleteObjectCommand({
      Bucket: R2_BUCKET(),
      Key: storageKey,
    }))
  } catch (e) {
    console.error('[R2] Error al eliminar objeto:', storageKey, e)
  }
}

export async function deletePhotos(photoIds: string[], workspaceId: string) {
  const { supabase } = await getUser()
  const admin = getAdminClient()

  // Verify photos belong to this workspace before deleting
  const { data: photos } = await supabase
    .from('photos')
    .select('id, storage_key_hot, storage_key_cold')
    .in('id', photoIds)
    .eq('workspace_id', workspaceId)

  if (!photos?.length) {
    revalidatePath('/bitacora')
    return { success: true }
  }

  // Delete from R2 (hot and cold)
  await Promise.all(
    photos.flatMap(p => [
      deleteFromR2(p.storage_key_hot),
      deleteFromR2(p.storage_key_cold),
    ])
  )

  // Delete from DB
  const idsToDelete = photos.map(p => p.id)
  const { error } = await admin.from('photos').delete().in('id', idsToDelete)
  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { success: true }
}

export async function toggleFavorite(photoId: string, isFavorite: boolean) {
  const { supabase } = await getUser()
  const admin = getAdminClient()

  // Verify membership via RLS
  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Foto no encontrada' }

  const { error } = await admin
    .from('photos')
    .update({ is_favorite: isFavorite })
    .eq('id', photoId)

  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { success: true }
}

export async function updatePhotoTags(photoId: string, tagIds: string[]) {
  const { supabase } = await getUser()
  const admin = getAdminClient()

  // Verify access via RLS
  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Foto no encontrada' }

  // Replace assignments: delete all then insert new ones
  await admin.from('photo_tag_assignments').delete().eq('photo_id', photoId)

  if (tagIds.length > 0) {
    const assignments = tagIds.map(tag_id => ({ photo_id: photoId, tag_id }))
    const { error } = await admin.from('photo_tag_assignments').insert(assignments)
    if (error) return { error: error.message }
  }

  revalidatePath('/bitacora')
  return { success: true }
}

export async function createPhotoTag(
  workspaceId: string,
  name: string,
  color: string
): Promise<{ tag?: PhotoTag; error?: string }> {
  const { user } = await getUser()
  const admin = getAdminClient()

  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'El nombre del tag no puede estar vacío' }

  const { data: tag, error } = await admin
    .from('photo_tags')
    .insert({
      workspace_id: workspaceId,
      name: trimmedName,
      color,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: `Ya existe un tag con el nombre "${trimmedName}" en este workspace` }
    }
    return { error: error.message }
  }

  revalidatePath('/bitacora')
  return { tag: tag as PhotoTag }
}

export async function updatePhotoMeta(
  photoId: string,
  data: { name?: string; project_id?: string | null }
) {
  const { supabase } = await getUser()
  const admin = getAdminClient()

  // Verify access via RLS
  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .single()

  if (!photo) return { error: 'Foto no encontrada' }

  const updates: Record<string, unknown> = {}
  if ('name' in data) updates.name = data.name ?? null
  if ('project_id' in data) updates.project_id = data.project_id ?? null

  const { error } = await admin.from('photos').update(updates).eq('id', photoId)
  if (error) return { error: error.message }

  revalidatePath('/bitacora')
  return { success: true }
}
