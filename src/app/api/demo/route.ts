import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const MODULE_LABELS: Record<string, string> = {
  proyectos:  'Gestión de Proyectos',
  documental: 'Control Documental',
  ai:         'Agente AI (extracción de planos)',
  whatsapp:   'Notificaciones WhatsApp',
  drive:      'Drive (almacenamiento)',
  oficios:    'Módulo Oficios',
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, company, priorities } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y correo son requeridos.' }, { status: 400 })
    }

    // Build module priority rows for email
    const selectedModules = Object.entries(priorities ?? {})
      .filter(([, v]) => v !== null)
      .sort((a, b) => (a[1] as number) - (b[1] as number))

    const moduleRows = selectedModules.length
      ? selectedModules.map(([id, prio]) =>
          `<tr>
            <td style="padding:6px 0;color:#6c757d;font-size:13px;width:30px;font-weight:700;color:#00C2FF;">${prio}</td>
            <td style="padding:6px 0;font-size:13px;color:#1A2744;">${MODULE_LABELS[id] ?? id}</td>
          </tr>`
        ).join('')
      : `<tr><td colspan="2" style="padding:6px 0;font-size:13px;color:#adb5bd;">Sin selección</td></tr>`

    const { error } = await resend.emails.send({
      from: 'Builtek <hola@menvio.app>',
      to: ['celestinlacp@gmail.com', 'hola@menvio.app'],
      subject: `[Builtek] Nuevo lead: ${name} — ${company || 'sin empresa'}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8f9fa;border-radius:12px;">
          <div style="background:#1A2744;color:white;padding:20px 24px;border-radius:8px;margin-bottom:20px;">
            <h2 style="margin:0;font-size:18px;">🏗️ Nuevo lead — Builtek</h2>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:13px;width:120px;">Nombre</td>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;font-size:13px;font-weight:600;color:#1A2744;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:13px;">Celular</td>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;font-size:13px;color:#1A2744;">${phone || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:13px;">Correo</td>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;font-size:13px;"><a href="mailto:${email}" style="color:#00C2FF;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:13px;">Empresa</td>
              <td style="padding:10px 0;border-bottom:1px solid #e9ecef;font-size:13px;color:#1A2744;">${company || '—'}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:14px;background:#f1f3f5;border-radius:8px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase;letter-spacing:1px;">Módulos de interés (prioridad)</p>
            <table style="width:100%;border-collapse:collapse;">${moduleRows}</table>
          </div>
          <div style="margin-top:16px;padding:14px;background:#00C2FF15;border-radius:8px;border-left:3px solid #00C2FF;">
            <p style="margin:0;font-size:12px;color:#1A2744;">Responder en menos de 24h — hola@menvio.app</p>
          </div>
          <p style="margin-top:16px;font-size:11px;color:#adb5bd;">builtek.app · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Error al enviar el correo.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Demo route error:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
