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
  project_id: string
  name: string
  specialty: string
  file_url: string
  dropbox_path: string
  file_type: string
  version: number
}) {
  const { user } = await getUser()
  const admin = getAdminClient()

  const { error } = await admin.from('documents').insert({
    ...data,
    uploaded_by: user.id,
    status: 'draft',
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

export async function deleteDocument(docId: string) {
  await getUser()
  const admin = getAdminClient()
  const { error } = await admin.from('documents').delete().eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath('/documents')
  return { success: true }
}
