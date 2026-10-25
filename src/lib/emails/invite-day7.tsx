// Email template — Day 7 post-invite registration
// Subject: "Tus sesiones de personalización en Builtek, [nombre]"

export function inviteDay7Html(
  recipientName: string,
  recipientCompany: string | null,
  ownerEmail: string,
  appUrl: string
): string {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '521XXXXXXXXXX'
  const companyLine = recipientCompany
    ? `para adaptar Builtek a cómo trabaja ${recipientCompany}.`
    : 'para adaptar Builtek a tu equipo.'

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px">

          <tr>
            <td style="background:#060e1c;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center">
              <span style="color:#00C2FF;font-size:24px;font-weight:800;letter-spacing:-0.5px">Builtek</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
              <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1A2744;line-height:1.3">
                Tus sesiones de personalización en Builtek, ${recipientName}
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#64748b;line-height:1.7">
                Hola ${recipientName},
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#64748b;line-height:1.7">
                Ya llevas 7 días en Builtek — espero que hayas tenido oportunidad de explorar la plataforma.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#64748b;line-height:1.7">
                Como parte de tu acceso exclusivo, tienes 2 sesiones conmigo ${companyLine} En esas sesiones revisamos tus necesidades específicas y construimos lo que haga falta.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">
                ¿Qué día de esta semana te funciona para una llamada de 30 minutos?<br>
                Mis disponibles: <strong>lunes a sábado a partir de la 1:00 pm</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">
                Responde este email o escríbeme directo por WhatsApp.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:8px;background:#25D366;margin-right:12px">
                    <a href="https://wa.me/${whatsappNumber}"
                      style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">
                      Escribir por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6">
                Luis Celestin<br>
                <span style="color:#94a3b8">Fundador, Builtek</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center">
              <p style="margin:0;font-size:12px;color:#94a3b8">
                © 2026 Builtek &nbsp;·&nbsp;
                <a href="${appUrl}" style="color:#94a3b8;text-decoration:none">builtek.mx</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
