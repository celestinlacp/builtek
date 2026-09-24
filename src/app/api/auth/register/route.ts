import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Crear usuario con email ya confirmado
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      const msg = createError.message && createError.message !== '{}' && createError.message !== ''
        ? createError.message
        : `Error Supabase (${createError.status ?? 400}): ${JSON.stringify(createError)}`
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Crear perfil
    if (created?.user) {
      await admin.from('profiles').upsert({ id: created.user.id, full_name })
    }

    // Iniciar sesión
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return NextResponse.json({ error: 'Cuenta creada. Inicia sesión manualmente.' }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Error inesperado al crear la cuenta' },
      { status: 500 }
    )
  }
}
