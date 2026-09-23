'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  let data, error
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    data = result.data
    error = result.error
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Error de conexión con el servidor' }
  }

  if (error) return { error: error.message || 'Error al registrarse. Intenta con otro correo o inicia sesión.' }

  // Sin sesión y sin error = email ya registrado (Supabase no lo revela por seguridad)
  if (!data?.session) {
    return { error: 'Este correo ya tiene una cuenta. Usa "Iniciar sesión" en su lugar.' }
  }

  // Crear perfil explícitamente (por si el trigger falla)
  if (data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
    })
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
