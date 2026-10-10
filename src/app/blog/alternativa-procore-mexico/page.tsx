import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Por qué Procore es demasiado caro para constructoras mexicanas | Builtek',
  description: 'Procore cobra hasta $80,000 USD/año. Conoce la alternativa construida para constructoras en México: control documental, módulo de oficios y agente AI, desde $3,790 MXN/mes.',
  keywords: 'alternativa Procore México, software gestión obra México, Procore precio México, control documental constructora México',
  openGraph: {
    title: 'Por qué Procore es demasiado caro para constructoras mexicanas (y qué usar en su lugar)',
    description: 'Procore cobra hasta $80,000 USD/año. Conoce la alternativa construida para constructoras en México.',
    url: 'https://builtek.app/blog/alternativa-procore-mexico',
    siteName: 'Builtek',
    locale: 'es_MX',
    type: 'article',
  },
}

export default function BlogProcorePage() {
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
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Comparativa</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
            Por qué Procore es demasiado caro<br />
            <span className="text-[#00C2FF]">para constructoras mexicanas</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
            Y qué usar en su lugar. Una comparativa honesta de costos, funciones y
            contexto mexicano para que tomes la mejor decisión sin gastar en lo que no necesitas.
          </p>
          <div className="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
            <span>Builtek · 2026</span>
            <span>·</span>
            <span>7 min de lectura</span>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-14">

        {/* Hook */}
        <div className="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
          <p className="text-lg leading-relaxed font-light">
            Si llegaste aquí, probablemente ya cotizaste Procore y te llevaste un susto con el precio.
            No estás solo. Es la historia de casi toda constructora mexicana que busca modernizar su operación.
          </p>
          <p className="text-white/50 text-base leading-relaxed font-light mt-4">
            En este artículo vamos a ver por qué Procore —siendo un producto excelente— no está pensado para
            el mercado mexicano, cuánto cuesta realmente, y qué alternativas existen hoy.
          </p>
        </div>

        <div className="prose prose-slate max-w-none">

          {/* Sección 1 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">¿Cuánto cuesta Procore en México?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Procore no publica su precio en su sitio web. Tienes que agendar una llamada con ventas para
            obtener una cotización. Eso ya te dice algo.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Lo que se sabe del mercado: Procore cobra por <strong>volumen de construcción anual</strong> (Construction
            Volume Pricing). Para una empresa con $50–200 millones de pesos en obra activa, el costo anual
            ronda los <strong>$25,000–80,000 USD/año</strong> — entre $460,000 y $1,480,000 MXN.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Para empresas más chicas, existe un plan de entrada cerca de los <strong>$375 USD/mes</strong> para un solo módulo.
            Con el tipo de cambio actual, eso es más de <strong>$6,900 MXN al mes</strong> — y eso es solo para empezar.
            Suma implementación, capacitación, soporte en inglés e integración con tus procesos actuales.
            El costo real en el primer año fácilmente supera los $100,000 USD para una empresa mediana.
          </p>

          {/* Sección 2 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">El problema no es solo el precio</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            El precio es el síntoma. El problema de fondo es que <strong>Procore fue construido para el mercado
            norteamericano</strong>. Y eso se nota en puntos que duelen especialmente en México:
          </p>

          <div className="space-y-5 mb-8">
            {[
              {
                n: '1',
                title: 'No genera CFDI',
                body: 'En México, todo pago de servicio requiere factura electrónica con CFDI. Procore no tiene integración nativa con el SAT ni con las addendas que exigen clientes como PEMEX, CFE o gobierno federal. Tienes que resolver eso aparte.',
              },
              {
                n: '2',
                title: 'Soporte en inglés (o inglés con acento)',
                body: 'El soporte técnico de Procore opera principalmente en inglés. Cuando tienes un problema urgente en obra —y los problemas en obra siempre son urgentes— esperar traducción no es una opción.',
              },
              {
                n: '3',
                title: 'Flujos que no corresponden al contexto mexicano',
                body: 'El módulo de "Submittals" de Procore es equivalente a lo que en México llamamos oficios o correspondencia técnica. Pero la lógica, la nomenclatura y los flujos de aprobación están diseñados para proyectos en EE.UU. Adaptar eso al contexto de una obra ferroviaria en México, con sus propias categorías (APC, RFI, protocolos SEDENA) requiere configuración y consultoría adicional.',
              },
              {
                n: '4',
                title: 'Exceso de funcionalidades que no usarás',
                body: 'Procore tiene módulos para ERP, nómina, finanzas, BI avanzado. Si lo que necesitas es controlar planos, gestionar oficios y hacer seguimiento de avance de obra, estás pagando por un avión cuando solo necesitas un automóvil confiable.',
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

          {/* Sección 3 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">¿Qué buscan realmente las constructoras mexicanas?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Cuando hablamos con residentes de obra y directores de proyecto en México, los tres dolores que
            aparecen siempre son:
          </p>
          <ul className="space-y-3 mb-8">
            {[
              '¿Dónde está la última versión del plano? ¿El que está en obra es el vigente?',
              '¿Qué oficios están sin respuesta? ¿Cuánto tiempo llevan sin respuesta?',
              '¿Qué tan avanzada está la obra? Por frente, por especialidad, por estructura.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mb-8">
            Tres problemas concretos. Ninguno requiere un sistema de $80,000 USD al año para resolverse.
          </p>

          {/* Sección 4 — alternativas */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Qué alternativas existen hoy</h2>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Alternativas internacionales (también caras o incompletas para México)</h3>
          <div className="space-y-3 mb-6">
            {[
              { name: 'Autodesk Construction Cloud (BIM 360)', desc: 'Excelente para proyectos con BIM, pero igual de caro que Procore y orientado a arquitectura, no a obra civil.' },
              { name: 'Fieldwire', desc: 'Más económico (~$54 USD/usuario/mes), pero sin módulo de oficios ni control documental completo. Fuerte en planos y punch lists.' },
              { name: 'Monday.com / Asana', desc: 'Herramientas genéricas de gestión de tareas. No tienen concepto de "plano", "versión de documento" ni "oficio técnico". Terminas armando algo a medias.' },
              { name: 'Contractor Foreman', desc: 'El más económico (~$49 USD/mes para equipo ilimitado), pero interfaz desactualizada y soporte solo en inglés.' },
            ].map(({ name, desc }) => (
              <div key={name} className="p-4 rounded-lg border border-slate-200 bg-white">
                <p className="font-semibold text-slate-700 text-sm">{name}</p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Builtek highlight */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1a3a5c] text-white rounded-2xl p-8 mb-8">
            <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">La alternativa construida para México</p>
            <h3 className="text-2xl font-bold mb-4">Builtek</h3>
            <p className="text-white/70 leading-relaxed mb-5">
              No reemplaza Procore con más funciones. Lo reemplaza con <strong className="text-white">las funciones correctas para el contexto mexicano</strong>:
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Control documental con versiones', desc: 'Planos, especificaciones, memorias de cálculo. Siempre sabes qué versión está vigente y quién la aprobó.' },
                { label: 'Módulo de Oficios nativo', desc: 'Seguimiento de correspondencia técnica con folio, categoría, asignado, estado y trazabilidad. El flujo que usan equipos de obra ferroviaria e infraestructura en México.' },
                { label: 'Agente AI que lee planos', desc: 'Sube un PDF con planos estructurales y el agente extrae cuantificación automáticamente. Nadie más en el mercado LATAM tiene esto integrado en un PM tool.' },
                { label: 'Notificaciones por WhatsApp', desc: 'Cuando se asigna una tarea o se sube un plano, el responsable recibe un mensaje de WhatsApp — no un correo que nadie lee.' },
                { label: 'Precios en MXN', desc: 'Sin conversiones de tipo de cambio, sin sorpresas. El plan Obra cuesta $3,790 MXN/mes para un equipo completo.' },
              ].map(({ label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0" />
                  <span className="text-white/80 text-sm leading-relaxed"><strong className="text-white">{label}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tabla comparativa */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Comparativa directa</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1A2744] text-white">
                  <th className="text-left px-4 py-3 font-semibold rounded-tl-xl">Criterio</th>
                  <th className="text-center px-4 py-3 font-semibold">Procore</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#00C2FF] rounded-tr-xl">Builtek</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Precio mensual (equipo mediano)', '$6,900–$40,000+ MXN', '$3,790–$12,990 MXN'],
                  ['Moneda', 'USD (riesgo cambiario)', 'MXN'],
                  ['CFDI', '✗ No nativo', '✓ En planes pagados'],
                  ['Módulo de Oficios técnicos', 'Submittals (no adaptado)', '✓ Nativo para México'],
                  ['Soporte', 'Inglés principalmente', '✓ Español, México'],
                  ['Agente AI para planos', '✗ No', '✓ Gemini 2.5 Flash'],
                  ['Notificaciones WhatsApp', '✗ No', '✓ Sí'],
                  ['Tiempo de implementación', '3–6 meses + consultoría', '✓ El mismo día'],
                ].map(([criterio, procore, builtek], i) => (
                  <tr key={criterio} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">{criterio}</td>
                    <td className="px-4 py-3 text-slate-500 text-center border-b border-slate-100">{procore}</td>
                    <td className="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">{builtek}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Para quién NO */}
          <div className="border-l-4 border-[#00C2FF] pl-5 mb-8">
            <h3 className="font-bold text-[#1A2744] mb-2">¿Para quién NO es Builtek?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Si tienes una empresa con 500+ personas, proyectos en múltiples países, necesitas integración con SAP
              o tienes un equipo dedicado de BIM, Procore probablemente es la herramienta correcta para ti a pesar del precio.
              Builtek es para <strong>constructoras medianas y equipos de obra civil en México</strong> que necesitan control
              real sobre su operación sin pagar precios de empresa Fortune 500.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
            <h3 className="text-white text-2xl font-bold mb-3">¿Quieres ver Builtek con datos reales de obra?</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
              Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
              Sin compromiso. Sin presión.
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
