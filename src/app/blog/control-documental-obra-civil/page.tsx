import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cómo llevar el control documental en una obra civil sin volverse loco | Builtek',
  description: 'Los 5 errores más comunes de control documental en obra y cómo evitarlos. Guía práctica para residentes y directores de proyecto en México.',
  keywords: 'control documental obra civil, control de planos constructora, gestión documentos construcción México, versiones de planos obra',
  openGraph: {
    title: 'Cómo llevar el control documental en una obra civil sin volverse loco',
    description: 'Los 5 errores más comunes de control documental en obra y cómo evitarlos. Guía práctica para equipos de construcción en México.',
    url: 'https://builtek.app/blog/control-documental-obra-civil',
    siteName: 'Builtek',
    locale: 'es_MX',
    type: 'article',
  },
}

export default function BlogControlDocumentalPage() {
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
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Guía práctica</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
            Cómo llevar el control documental<br />
            <span className="text-[#00C2FF]">en una obra civil sin volverse loco</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
            Los 5 errores más comunes que retrasan proyectos de infraestructura en México
            y cómo evitarlos con un sistema que tu equipo realmente use.
          </p>
          <div className="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
            <span>Builtek · 2026</span>
            <span>·</span>
            <span>6 min de lectura</span>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-14">

        {/* Hook */}
        <div className="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
          <p className="text-lg leading-relaxed font-light">
            El residente de obra tiene dos versiones del mismo plano en su carpeta.
            No sabe cuál es la vigente. El maestro de obra está construyendo con la versión anterior.
            Nadie lo nota hasta que hay que demoler.
          </p>
          <p className="text-white/50 text-base leading-relaxed font-light mt-4">
            Eso no es un problema de disciplina del equipo. Es un problema de sistema.
            O más exactamente: de no tener ningún sistema.
          </p>
        </div>

        <div className="prose prose-slate max-w-none">

          <p className="text-slate-600 leading-relaxed mb-8">
            El control documental en obra civil es uno de esos temas que todo director de proyecto
            sabe que es crítico, pero que casi nadie resuelve bien hasta que algo sale mal.
            En este artículo vamos a ver los 5 errores más comunes y qué hacer con cada uno.
          </p>

          {/* Error 1 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Error #1 — Los planos viven en WhatsApp</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            El arquitecto o el proyectista manda la revisión del plano por WhatsApp. El residente lo descarga,
            lo guarda en su celular, quizás lo pasa al grupo del equipo. Tres semanas después hay 4 versiones
            del mismo plano distribuidas entre 6 personas y nadie sabe cuál tiene la nota de revisión más reciente.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <p className="text-amber-800 text-sm font-semibold mb-1">El costo real de este error</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              En proyectos ferroviarios e infraestructura, construir con un plano desactualizado puede
              significar retrabajos de decenas de miles de pesos y semanas de retraso en el programa de obra.
              El costo de un sistema de control documental es pequeño comparado con un solo retrabajo.
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Un repositorio central donde cada documento tiene una versión oficial marcada como vigente.
            Cuando llega una nueva revisión, la versión anterior queda archivada pero visible.
            El equipo en campo siempre accede al mismo repositorio — no a lo que llegó por WhatsApp.
          </p>

          {/* Error 2 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Error #2 — Carpetas en Drive sin estructura</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Google Drive o Dropbox resuelven el problema de "dónde está el archivo", pero no el de
            "cuál versión es la vigente" ni "quién aprobó este plano". Una carpeta llamada
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm mx-1">Planos_FINAL_v3_revisado_nuevo.pdf</code>
            no es control documental — es caos organizado.
          </p>
          <p className="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
          <p className="text-slate-600 leading-relaxed mb-8">
            La estructura de carpetas importa, pero más importante es que el sistema registre
            metadatos por documento: disciplina, número de plano, versión, responsable, fecha de emisión
            y estado (en revisión / aprobado / supersedido). Eso no lo da Google Drive nativo.
          </p>

          {/* Error 3 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Error #3 — Los oficios sin seguimiento</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Un oficio sale. El receptor lo recibe. Nadie lo registra formalmente. Tres semanas después,
            la supervisión pide evidencia de que se notificó al contratista sobre una desviación.
            Se busca en el correo, en WhatsApp, en carpetas físicas. Se pierde media jornada.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            En proyectos con clientes como CFE, SEDENA o SCT, la trazabilidad de oficios no es
            opcional — es un requisito contractual. Un oficio sin folio, sin fecha de recepción
            y sin estado de respuesta es un pasivo legal.
          </p>
          <p className="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Cada oficio debe tener número de folio consecutivo, categoría, asignado, fecha de
            vencimiento de respuesta y estado visible para todo el equipo. No en Excel — en un
            sistema donde el cambio de estado queda registrado con fecha y usuario.
          </p>

          {/* Error 4 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Error #4 — El avance de obra en Excel</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            El superintendente actualiza el Excel del avance los viernes. El lunes, el director de
            proyecto lo revisa en una junta. El martes ya está desactualizado. El Excel es un snapshot,
            no un sistema vivo. Y cuando hay múltiples frentes de obra, mantener ese Excel actualizado
            se convierte en un trabajo de medio tiempo.
          </p>
          <p className="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
          <p className="text-slate-600 leading-relaxed mb-8">
            El avance debe capturarse donde ocurre el trabajo: cuando el responsable completa
            una tarea, el sistema actualiza los KPIs automáticamente. El director ve el estado
            real en cualquier momento, desde cualquier dispositivo, sin esperar el reporte del viernes.
          </p>

          {/* Error 5 */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Error #5 — Nadie sabe leer los planos rápido</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Un plano estructural de 90 páginas llega a revisión. El residente necesita saber si las
            especificaciones de acero del Tramo 3 cambiaron respecto a la versión anterior. Abre el
            PDF, busca manualmente, compara dos documentos a la vez. Una hora después, tiene la respuesta
            — o no la tiene y decide continuar con lo que recuerda.
          </p>
          <p className="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Un agente AI entrenado en documentación técnica de construcción puede leer ese plano
            en segundos y responder preguntas específicas: "¿Qué diámetro de varilla especifica para
            la zapata tipo Z-3?" La respuesta llega citada, con número de página. No reemplaza al
            ingeniero — le devuelve una hora de su día.
          </p>

          {/* Resumen visual */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-5">Resumen: los 5 errores y su solución</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1A2744] text-white">
                  <th className="text-left px-4 py-3 font-semibold rounded-tl-xl">Error</th>
                  <th className="text-left px-4 py-3 font-semibold rounded-tr-xl">Lo que necesitas</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Planos distribuidos por WhatsApp', 'Repositorio central con versión vigente marcada'],
                  ['Carpetas en Drive sin metadatos', 'Sistema con disciplina, versión, estado y responsable por doc'],
                  ['Oficios sin folio ni seguimiento', 'Registro formal con número, estado y fecha de respuesta'],
                  ['Avance en Excel actualizado los viernes', 'KPIs en tiempo real vinculados a las tareas del equipo'],
                  ['Planos que nadie lee completos', 'Agente AI que responde preguntas sobre tus documentos técnicos'],
                ].map(([error, solucion], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">{error}</td>
                    <td className="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">{solucion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cierre */}
          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">¿Por dónde empezar?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            No necesitas resolver los 5 errores al mismo tiempo. La secuencia que funciona en la práctica:
          </p>
          <ol className="space-y-3 mb-8 list-none">
            {[
              'Primero: centraliza los planos vigentes en un solo lugar. Que todos sepan que ahí está la versión oficial.',
              'Segundo: implementa el registro de oficios. Es lo que más duele en auditorías y lo más fácil de formalizar.',
              'Tercero: conecta el avance de obra a las tareas del equipo. Deja de actualizar el Excel manualmente.',
              'Cuarto: suma el agente AI cuando ya tienes documentos organizados. Sin orden, la AI no puede ayudarte.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <span className="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <p className="text-slate-600 leading-relaxed mb-8">
            El objetivo no es la herramienta perfecta desde el día uno. Es que tu equipo tenga
            un sistema que realmente use — uno que no requiera 3 horas de capacitación y que
            funcione desde el primer día en obra.
          </p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
            <h3 className="text-white text-2xl font-bold mb-3">¿Quieres ver cómo se ve esto en la práctica?</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
              Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
              Control documental, oficios, tareas y agente AI — todo integrado.
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
