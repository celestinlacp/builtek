'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  full_name: string
  phone: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const payload: Record<string, string> = {
    id: user.id,
    full_name: data.full_name.trim(),
    phone: data.phone.trim(),
    updated_at: new Date().toISOString(),
  }
  if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url

  const { error } = await supabase.from('profiles').upsert(payload)
  if (error) return { error: error.message }

  // Sync full_name to auth metadata
  await supabase.auth.updateUser({ data: { full_name: data.full_name.trim() } })

  revalidatePath('/settings/profile')
  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}
