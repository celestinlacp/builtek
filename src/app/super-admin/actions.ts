'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? 'celestinlacp@gmail.com'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyMasterAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== MASTER_ADMIN_EMAIL) {
    throw new Error('Acceso denegado')
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error?: string }> {
  try {
    await verifyMasterAdmin()
    const admin = getAdminClient()
    const { error } = await admin.from('workspaces').delete().eq('id', workspaceId)
    if (error) return { error: error.message }
    revalidatePath('/super-admin')
    return {}
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function changeWorkspacePlan(workspaceId: string, plan: string): Promise<{ error?: string }> {
  try {
    await verifyMasterAdmin()
    const admin = getAdminClient()
    const { error } = await admin.from('workspaces').update({ plan }).eq('id', workspaceId)
    if (error) return { error: error.message }
    revalidatePath('/super-admin')
    return {}
  } catch (e: any) {
    return { error: e.message }
  }
}
