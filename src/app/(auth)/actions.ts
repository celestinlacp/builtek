'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  let error
  try {
    const result = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    error = result.error
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Error de conexión con el servidor' }
  }

  if (error) return { error: error.message || JSON.stringify(error) || 'Credenciales incorrectas' }

  return { success: true }
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const admin = getAdminClient()

  // Crear usuario con email ya confirmado (sin mandar email de confirmación)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError) return { error: createError.message || 'Error al crear la cuenta' }

  // Crear perfil
  if (created?.user) {
    await admin.from('profiles').upsert({ id: created.user.id, full_name: fullName })
  }

  // Iniciar sesión con las credenciales recién creadas
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: 'Cuenta creada. Inicia sesión manualmente.' }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
