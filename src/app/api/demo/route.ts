import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, sector, teamSize } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y correo son requeridos.' }, { status: 400 })
    }

    const sectorLabels: Record<string, string> = {
      civil:      'Obra Civil e Infraestructura',
      building:   'Edificación',
      industrial: 'Industrial',
      road:       'Carreteras y Vialidades',
      hydraulic:  'Obras Hidráulicas',
      other:      'Otro',
    }

    const teamLabels: Record<string, string> = {
      '1':     'Solo yo',
      '2-10':  '2–10 personas',
      '11-50': '11–50 personas',
      '50+':   'Más de 50',
    }

    const { error } = await resend.emails.send({
      from: 'Builtek <hola@builtek.app>',
      to: ['celestinlacp@gmail.com'],
      subject: `[Builtek] Nuevo lead: ${name} — ${company || 'sin empresa'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
          <div style="background: #1A2744; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">🏗️ Nuevo cliente potencial en Builtek</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px; width: 120px;">Nombre</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px; font-weight: 600; color: #1A2744;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px;">Correo</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px;"><a href="mailto:${email}" style="color: #00C2FF;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px;">Empresa</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px; color: #1A2744;">${company || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 13px;">Sector</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-size: 13px; color: #1A2744;">${sectorLabels[sector] || sector || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-size: 13px;">Equipo</td>
              <td style="padding: 10px 0; font-size: 13px; color: #1A2744;">${teamLabels[teamSize] || teamSize || '—'}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 14px; background: #00C2FF15; border-radius: 8px; border-left: 3px solid #00C2FF;">
            <p style="margin: 0; font-size: 12px; color: #1A2744;">Respondido en menos de 24h — hola@builtek.app</p>
          </div>
          <p style="margin-top: 16px; font-size: 11px; color: #adb5bd;">Formulario "Solicitar demo" — builtek.app · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
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
