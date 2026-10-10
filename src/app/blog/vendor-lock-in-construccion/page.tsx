import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vendor lock-in en construcción: cómo no quedar atrapado en tu software | Builtek',
  description: 'Qué es el vendor lock-in, cómo afecta a constructoras y qué preguntar antes de contratar cualquier software de gestión de obra. Guía práctica para equipos AEC en México.',
  keywords: 'vendor lock-in construcción, software gestión obra México, portabilidad datos construcción, cambiar software constructora, control documental sin ataduras',
  openGraph: {
    title: 'Vendor lock-in en construcción: cómo no quedar atrapado en tu software',
    description: 'Qué es el vendor lock-in, cómo afecta a constructoras y qué preguntar antes de contratar cualquier software de gestión de obra.',
    url: 'https://builtek.app/blog/vendor-lock-in-construccion',
    siteName: 'Builtek',
    locale: 'es_MX',
    type: 'article',
  },
}

export default function BlogVendorLockInPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* Nav */}
      <div className="bg-[#0D1729] text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0D1729] text-xs font-bold">B</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Builtek</span>
          </Link>
          <Link href="/blog" className="text-white/50 hover:text-white text-sm transition-colors">
            ← Blog
          </Link>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pb-16 pt-8">
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Estrategia</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
            Vendor lock-in en construcción:<br />
            <span className="text-[#00C2FF]">cómo no quedar atrapado en tu software</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
            Contratas un software para gestionar tu obra, y tres años después descubres que no puedes salir sin perder
            todos tus datos. Así funciona el vendor lock-in — y así lo evitas.
          </p>
          <div className="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
            <span>Builtek · 2026</span>
            <span>·</span>
            <span>8 min de lectura</span>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-14">

        {/* Hook */}
        <div className="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
          <p className="text-lg leading-relaxed font-light">
            Imagina esto: llevas dos años usando un software para gestionar tus proyectos.
            Tienes 4,000 documentos subidos, 200 oficios registrados, el historial completo de dos frentes de obra.
            Un día decides cambiar de herramienta porque encontraste algo mejor o más barato.
          </p>
          <p className="text-white/50 text-base leading-relaxed font-light mt-4">
            Y entonces descubres que no puedes exportar nada. O que la exportación te cuesta un fee adicional.
            O que los archivos salen en un formato propietario que ningún otro sistema entiende.
            Eso es vendor lock-in — y en la industria de la construcción es más común de lo que parece.
          </p>
        </div>

        <div className="prose prose-slate max-w-none">

          {/* Sección 1 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">¿Qué es exactamente el vendor lock-in?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            El término vendor lock-in (dependencia del proveedor) describe la situación en la que un cliente
            se vuelve tan dependiente de un proveedor específico que cambiar a otra solución se vuelve
            costoso, complicado o directamente imposible.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            En software de construcción, esto puede manifestarse de varias formas:
          </p>
          <ul className="space-y-3 mb-8">
            {[
              'Tus datos están en un formato propietario que solo ese software puede leer',
              'La exportación de datos está restringida, limitada o cuesta dinero extra',
              'Tus integraciones con otros sistemas (ERP, contabilidad, BIM) solo funcionan dentro del ecosistema del proveedor',
              'Capacitaste a todo tu equipo en esa interfaz y el costo humano de cambiar es enorme',
              'El contrato tiene penalizaciones por cancelación anticipada o renovación automática difícil de detener',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mb-8">
            Ninguno de estos puntos es accidental. Muchos proveedores los diseñan deliberadamente para
            aumentar el costo de salida y retener clientes que de otro modo se irían.
          </p>

          {/* Sección 2 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Por qué la construcción es especialmente vulnerable</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            En industrias como e-commerce o SaaS, cambiar de CRM o de herramienta de analytics es relativamente
            sencillo: exportas un CSV, importas en el nuevo sistema, listo. En construcción, el problema es más profundo.
          </p>

          <div className="space-y-5 mb-8">
            {[
              {
                n: '1',
                title: 'El historial documental es crítico y difícil de migrar',
                body: 'Los planos, especificaciones y oficios de una obra tienen valor legal y contractual durante años después de que termina el proyecto. Si tu proveedor no te deja exportar eso de forma usable, quedas atado indefinidamente — incluso para proyectos ya terminados.',
              },
              {
                n: '2',
                title: 'Los flujos de aprobación acumulan datos difíciles de replicar',
                body: 'Quién aprobó qué plano, en qué fecha, con qué revisión — esa trazabilidad es exactamente lo que piden las auditorías técnicas y los clientes gubernamentales. Está enterrada en la base de datos del proveedor, no en un archivo que puedes llevarte.',
              },
              {
                n: '3',
                title: 'La capacitación crea inercia organizacional',
                body: 'Entrenar a un equipo de obra en una nueva plataforma toma tiempo y genera resistencia. Los proveedores lo saben y cuentan con eso: entre más profunda sea la adopción, más alto es el costo de cambio — y menos probable que lo hagas aunque tengas razones para hacerlo.',
              },
              {
                n: '4',
                title: 'Los contratos plurianuales amplifican el riesgo',
                body: 'Es común que software de construcción enterprise (Procore, Autodesk CC) pida compromisos de 2–3 años. Si el proveedor sube precios, cambia funciones clave o simplemente no cumple, tu margen de maniobra es mínimo hasta que venza el contrato.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                <div>
                  <p className="font-semibold text-[#1A2744] mb-1">{title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sección 3 — señales */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Las señales de que ya estás (o puedes quedar) atrapado</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Antes de firmar con cualquier proveedor — o si ya tienes uno y quieres evaluar tu situación —
            hazte estas preguntas:
          </p>

          <div className="space-y-3 mb-8">
            {[
              { signal: '¿Puedo exportar todos mis datos hoy, ahora, sin costo adicional?', risk: 'Alto riesgo' },
              { signal: '¿El formato de exportación es estándar (CSV, JSON, PDF)? ¿O es propietario?', risk: 'Medio riesgo' },
              { signal: '¿Qué pasa con mis datos si cancelo la suscripción? ¿Cuánto tiempo tengo para descargarlos?', risk: 'Alto riesgo' },
              { signal: '¿El contrato tiene renovación automática con aviso menor a 60 días?', risk: 'Medio riesgo' },
              { signal: '¿Hay penalización económica por cancelar antes del vencimiento?', risk: 'Alto riesgo' },
              { signal: '¿El proveedor ha subido precios más del 20% en los últimos 2 años?', risk: 'Señal de alerta' },
            ].map(({ signal, risk }) => (
              <div key={signal} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${
                  risk === 'Alto riesgo'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : risk === 'Medio riesgo'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}>{risk}</span>
                <p className="text-slate-600 text-sm leading-relaxed">{signal}</p>
              </div>
            ))}
          </div>

          {/* Sección 4 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">El costo real de cambiar de plataforma (cuando ya es tarde)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Cuando una empresa constructora intenta migrar de una plataforma enterprise a otra, los costos
            suelen distribuirse así:
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1A2744] text-white">
                  <th className="text-left px-4 py-3 font-semibold rounded-tl-xl">Concepto</th>
                  <th className="text-left px-4 py-3 font-semibold rounded-tr-xl">Rango típico (empresa mediana en México)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Migración de datos (consultoría técnica)', '$15,000–$80,000 MXN'],
                  ['Penalización por cancelación anticipada', '$30,000–$200,000 MXN'],
                  ['Capacitación del equipo en nueva plataforma', '$10,000–$40,000 MXN + tiempo improductivo'],
                  ['Período de operación paralela (doble plataforma)', '1–3 meses de doble costo'],
                  ['Datos históricos inaccesibles o mal migrados', 'Riesgo legal / contractual difícil de cuantificar'],
                ].map(([concepto, rango], i) => (
                  <tr key={concepto} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">{concepto}</td>
                    <td className="px-4 py-3 text-slate-500 border-b border-slate-100">{rango}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mb-8">
            El vendor lock-in no se siente en el momento de contratar. Se siente cuando quieres salir
            y descubres que el costo de cambio es igual o mayor al costo de quedarte con una herramienta
            que ya no te funciona.
          </p>

          {/* Sección 5 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Qué preguntar antes de contratar cualquier software de construcción</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Si estás evaluando plataformas ahora, estas son las preguntas que deberías hacerle a cualquier
            proveedor antes de firmar:
          </p>
          <div className="space-y-4 mb-8">
            {[
              {
                q: '1. "¿Puedo exportar todos mis datos en cualquier momento, sin costo adicional?"',
                context: 'La respuesta debe ser "sí, en formatos estándar". Si vacilan, pregunten específicamente por documentos, oficios, tareas, comentarios e historial de versiones.',
              },
              {
                q: '2. "¿Qué pasa con mis datos si cancelo?"',
                context: 'Deben garantizar un período razonable (mínimo 30 días) para descargar todo. Si los datos desaparecen al cancelar, es una señal de alerta enorme.',
              },
              {
                q: '3. "¿El contrato tiene renovación automática? ¿Con cuánto aviso puedo cancelar?"',
                context: 'Renovaciones automáticas con avisos de 30 días o menos son trampas. Busca contratos mensuales o anuales con cancelación simple.',
              },
              {
                q: '4. "¿Tienen API abierta o webhooks para integrar con mis otros sistemas?"',
                context: 'Un proveedor que no ofrece API pública generalmente no quiere que salgas fácilmente de su ecosistema.',
              },
              {
                q: '5. "¿Han subido precios en los últimos 2 años? ¿Cuánto?"',
                context: 'No es una pregunta incómoda. Es información que necesitas para calcular el costo total de propiedad a 3 años, no solo el precio de hoy.',
              },
            ].map(({ q, context }) => (
              <div key={q} className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-[#1A2744] text-sm mb-2">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{context}</p>
              </div>
            ))}
          </div>

          {/* Builtek highlight */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1a3a5c] text-white rounded-2xl p-8 mb-8">
            <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">Cómo lo resuelve Builtek</p>
            <h3 className="text-2xl font-bold mb-4">Sin vendor lock-in. Tus datos, tus reglas.</h3>
            <p className="text-white/70 leading-relaxed mb-5">
              Builtek fue diseñado desde el inicio con portabilidad como principio, no como afterthought:
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Exportación libre en todo momento', desc: 'Cualquier usuario con rol Owner puede exportar documentos, oficios y metadatos del proyecto en cualquier momento, sin costo adicional, en formatos estándar (PDF, CSV, JSON).' },
                { label: 'Sin contratos plurianuales', desc: 'Builtek opera en modelo mensual. Si decides que no es la herramienta correcta para ti, cancelas y listo — sin penalizaciones, sin letras chicas.' },
                { label: 'Almacenamiento en Cloudflare R2', desc: 'Los archivos que subes se almacenan en R2 con URLs directas. No están en una caja negra propietaria: son archivos reales, accesibles.' },
                { label: 'Stack abierto y documentado', desc: 'Nuestro backend es PostgreSQL en Supabase. Si algún día necesitas migrar tus datos a otra plataforma o a tu propia infraestructura, el schema es estándar y está documentado.' },
              ].map(({ label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0" />
                  <span className="text-white/80 text-sm leading-relaxed"><strong className="text-white">{label}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conclusión */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">La pregunta que pocas constructoras se hacen antes de comprar</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Cuando evalúas software de construcción, lo natural es enfocarte en funciones: ¿tiene módulo de oficios?,
            ¿puedo subir planos?, ¿manda notificaciones?
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Pero hay una pregunta más importante que casi nadie hace al momento de comprar, y que todos
            se arrepienten de no haber hecho tres años después:
          </p>
          <div className="border-l-4 border-[#00C2FF] pl-5 mb-6">
            <p className="text-[#1A2744] font-semibold text-lg leading-relaxed">
              "¿Qué tan fácil es salir de aquí si algún día quiero hacerlo?"
            </p>
          </div>
          <p className="text-slate-600 leading-relaxed mb-8">
            Un proveedor que te da una respuesta clara, directa y sin condiciones a esa pregunta
            es un proveedor que no necesita atraparte para retenerte. Y eso, en el largo plazo,
            es exactamente el tipo de proveedor con quien quieres trabajar.
          </p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
            <h3 className="text-white text-2xl font-bold mb-3">¿Quieres ver Builtek con datos reales de obra?</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
              Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
              Sin compromiso. Sin presión. Y sí, puedes exportar todo lo que subas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors"
              >
                Solicitar demo gratuita →
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          <p className="text-slate-400 text-xs text-center mt-8">
            Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br />
            ¿Tienes preguntas? Escríbenos a hola@menvio.app
          </p>

        </div>
      </article>

      {/* Footer mini */}
      <div className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
          <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-600 transition-colors">Inicio</Link>
            <Link href="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link href="/#precios" className="hover:text-slate-600 transition-colors">Precios</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
