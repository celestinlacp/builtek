// Email template — Day 14 of trial (trial expired today)
// Subject: "Tu prueba venció — tus datos están seguros"

export function trialDay14Html(ownerName: string, appUrl: string): string {
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
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A2744;line-height:1.3">
                Tu prueba venció — tus datos están seguros
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.7">
                Hola ${ownerName},<br><br>
                Tu período de prueba ha terminado. Mientras no actives un plan, podrás ver todo lo que creaste pero no podrás crear ni editar contenido nuevo.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">
                Tus proyectos, documentos y extracciones de IA están completamente seguros y disponibles cuando actives tu plan.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:8px;background:#00C2FF">
                    <a href="${appUrl}/pricing"
                      style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#060e1c;text-decoration:none;border-radius:8px">
                      Elegir mi plan →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
                ¿Tienes dudas? Responde este email.<br>
                — Luis Celestin, fundador de Builtek
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
