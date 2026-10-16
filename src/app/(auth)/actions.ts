'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

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

  try {
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
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Error inesperado al crear la cuenta' }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(email: string) {
  const admin  = getAdminClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app').replace(/\/$/, '')

  // Generar token de recuperación sin depender del redirect URL de Supabase
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) return { error: error.message }
  if (!data?.properties?.hashed_token) return { error: 'No se pudo generar el link de recuperación' }

  // Construir URL directa a nuestra página (bypasea el whitelist de Supabase)
  const resetUrl = `${appUrl}/reset-password?token_hash=${data.properties.hashed_token}&type=recovery`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from:    'Builtek <no-reply@builtek.app>',
    to:      email,
    subject: 'Restablece tu contraseña de Builtek',
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px">

          <!-- Logo header -->
          <tr>
            <td style="background:#1A2744;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center">
              <span style="color:#00C2FF;font-size:24px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">Builtek</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
              <div style="width:48px;height:48px;background:#eff6ff;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px">
                <span style="font-size:24px">🔑</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A2744;line-height:1.3">
                Restablece tu contraseña
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Builtek.
                Da clic en el botón de abajo para elegir una nueva.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:8px;background:#1A2744">
                    <a href="${resetUrl}"
                      style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.1px">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
                Si no solicitaste este cambio, puedes ignorar este correo — tu contraseña seguirá siendo la misma.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
                Este link expira en <strong style="color:#64748b">1 hora</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center">
              <p style="margin:0;font-size:12px;color:#94a3b8">
                © 2026 Builtek &nbsp;·&nbsp;
                <a href="https://builtek.app" style="color:#94a3b8;text-decoration:none">builtek.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })

  if (emailError) return { error: emailError.message }
  return { success: true }
}
