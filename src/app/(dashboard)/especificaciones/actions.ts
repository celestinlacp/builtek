'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function saveDesignSpec(data: {
  workspace_id:   string
  specialty_code: string | null
  title:          string
  spec_code:      string | null
  version:        string
  issued_by:      string | null
  company_id:     string | null
  oficio_id:      string | null
  issued_date:    string | null
  notes:          string | null
  storage_key:    string | null
  file_name:      string | null
  file_type:      string | null
  file_size:      number | null
}) {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('design_specs').insert({
    ...data,
    status:     'vigente',
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/especificaciones')
}

export async function updateSpecStatus(id: string, status: 'vigente' | 'en_revision' | 'supersedida') {
  const { supabase } = await getUser()
  const { error } = await supabase.from('design_specs').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/especificaciones')
}

export async function deleteDesignSpec(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('design_specs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/especificaciones')
}
