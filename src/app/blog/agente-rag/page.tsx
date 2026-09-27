import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Por qué ChatGPT no puede ser el asistente de tu obra | Builtek Blog',
  description: 'Descubre qué es el Agente RAG y por qué cambia todo para la gestión de proyectos de construcción en LATAM.',
}

export default function BlogRAGPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* Hero */}
      <div className="bg-[#0D1729] text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0D1729] text-xs font-bold">B</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Builtek</span>
          </Link>
          <Link href="/#rag" className="text-white/50 hover:text-white text-sm transition-colors">
            ← Volver a la landing
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-16 pt-8">
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Educación</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
            Tu proyecto tiene 300 planos.<br />
            <span className="text-[#00C2FF]">ChatGPT no puede leerlos todos.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
            Por qué el constructor del futuro no busca en PDFs — le pregunta al proyecto.
            Una comparación honesta entre subir archivos a ChatGPT y usar un Agente RAG integrado en tu plataforma de obra.
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

        {/* Intro hook */}
        <div className="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
          <p className="text-lg leading-relaxed font-light">
            Un residente de obra lleva 3 horas buscando en qué plano especificaron el tipo de acero
            para las zapatas del Tramo 2. Abre PDF tras PDF. Revisa el índice. Le pregunta al director.
            Nadie recuerda. Finalmente lo encuentra — en la página 47 de un documento de 90 páginas
            que nadie había abierto en 6 semanas.
          </p>
          <p className="text-white/50 text-base leading-relaxed font-light mt-4">
            Eso no es un problema de disciplina. Es un problema de herramienta.
          </p>
        </div>

        <div className="prose prose-slate max-w-none">

          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">El experimento que todo constructor hace</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            En algún punto, alguien en el equipo tuvo la idea: <em>"¿Por qué no subimos los planos a ChatGPT y le preguntamos?"</em>
            Y funciona. La primera vez. Con un documento. Con una pregunta sencilla.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            El problema aparece en la segunda semana, cuando el proyecto ya tiene 40 documentos,
            3 revisiones de planos y un oficio de supervisión que contradice la especificación original.
            ChatGPT no sabe nada de eso a menos que se lo pegues todo de nuevo, en cada sesión, manualmente.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <p className="text-amber-800 font-semibold text-sm mb-2">El límite que nadie te explica</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              ChatGPT tiene una <strong>ventana de contexto</strong> — la cantidad de texto que puede "ver" a la vez.
              Un plano estructural en PDF, al convertirse a texto, puede ocupar 10,000-50,000 tokens. La ventana
              de GPT-4 es de ~128,000 tokens. Eso equivale a 3-12 planos. Tu proyecto real tiene decenas o cientos.
              El resto simplemente no existe para la IA.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Qué es RAG (sin rodeos)</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            RAG son las siglas de <strong>Retrieval-Augmented Generation</strong>. En cristiano:
            antes de responder, la IA <em>busca</em> en tu biblioteca de documentos los fragmentos más
            relevantes para tu pregunta — y solo entonces genera la respuesta usando esa información específica.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            No necesita que le pegues todo el proyecto. No tiene límite de documentos. No olvida nada entre sesiones.
            Y lo más importante para construcción: <strong>te dice exactamente de qué documento y sección viene cada dato</strong>.
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-4 text-left font-semibold text-slate-700 w-1/3"></th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-500">ChatGPT / Claude con archivos</th>
                  <th className="px-5 py-4 text-left font-semibold text-[#1A2744]">Agente RAG de Builtek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Capacidad de documentos', 'Limitado por ventana de contexto (~3-12 planos)', 'Ilimitado — indexa toda tu biblioteca'],
                  ['Memoria entre sesiones', 'Ninguna. Empieza de cero cada vez', 'Permanente y siempre actualizada'],
                  ['Fuentes citadas', 'A veces. Sin referencia exacta al documento', 'Siempre: plano, sección y revisión'],
                  ['Documentos nuevos', 'Tienes que subirlos manualmente cada vez', 'Se indexan automáticamente al subir'],
                  ['Integración con el proyecto', 'Ninguna — no sabe de tus tareas, oficios ni aprobaciones', 'Sabe qué docs tienen observaciones, qué tareas están pendientes'],
                  ['Privacidad de tus planos', 'Tus documentos pasan por servidores de OpenAI/Anthropic', 'Tus datos en tu workspace cifrado en Builtek'],
                  ['Alucinaciones', 'Alta probabilidad si el doc no está en contexto', 'Mínimas — responde solo con lo que encontró en tus docs'],
                ].map(([aspect, chatgpt, builtek], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-5 py-4 text-slate-700 font-medium text-xs">{aspect}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs">{chatgpt}</td>
                    <td className="px-5 py-4 text-[#1A2744] font-medium text-xs">{builtek}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Lo que cambia en obra</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Veamos casos concretos. Estos son los momentos donde un Agente RAG integrado en tu plataforma
            de gestión de obra marca una diferencia real:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                title: 'Revisión de especificaciones',
                before: 'Abrir 5 PDFs, buscar con Ctrl+F, no encontrar nada porque el término exacto es diferente en cada doc.',
                after: '"¿Qué resistencia de concreto se especifica para vigas secundarias?" → Respuesta en 3 segundos con cita exacta.',
              },
              {
                title: 'Contradicciones entre documentos',
                before: 'Nadie sabe que el plano Rev.B contradice la especificación técnica del año pasado hasta que el error ya está vaciado.',
                after: 'El agente detecta inconsistencias cuando le preguntas y te dice en cuál documento está el dato más reciente.',
              },
              {
                title: 'Incorporación de nuevos ingenieros',
                before: '2 semanas de curva de aprendizaje leyendo documentación. El veterano que sabe todo está de viaje.',
                after: 'El ingeniero nuevo pregunta al proyecto. El proyecto le responde con fuentes verificables.',
              },
              {
                title: 'Respuesta a supervisión',
                before: 'Buscar manualmente qué dice el contrato, el plano y la especificación sobre el punto que observó el supervisor.',
                after: '"¿Qué dice el contrato sobre el recubrimiento de armado en elementos a intemperie?" → Copia, cita, listo.',
              },
            ].map(item => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#1A2744] mb-3">{item.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-xs font-bold mt-0.5 flex-shrink-0">Antes</span>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.before}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 text-xs font-bold mt-0.5 flex-shrink-0">RAG</span>
                    <p className="text-slate-700 text-xs leading-relaxed">{item.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Por qué nadie lo tiene integrado en LATAM</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Procore, el gigante de la gestión de construcción, lleva años con IA pero orientada a
            empresas con contratos millonarios en dólares. Su acceso mínimo es una negociación de meses.
            Autodesk Construction Cloud va en la misma línea.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            En México, Brasil, Colombia, Argentina — el 95% de los proyectos de construcción se gestionan
            con Excel, WhatsApp y PDFs enviados por correo. No porque los ingenieros no quieran tecnología.
            Sino porque las herramientas existentes son para otro mercado, en otro idioma, a otro precio.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Builtek nació específicamente para este gap. Y el Agente RAG, integrado con el control documental,
            las tareas, los oficios y el Drive del proyecto — es el paso que convierte la plataforma en el
            sistema operativo real de la obra.
          </p>

          <div className="bg-[#0D1729] text-white rounded-2xl p-8 mb-10">
            <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">La diferencia clave</p>
            <p className="text-xl font-light leading-relaxed mb-2">
              ChatGPT es un asistente genérico que puedes cargar con tus docs.
            </p>
            <p className="text-xl font-bold leading-relaxed">
              El Agente RAG de Builtek <em>vive</em> dentro de tu proyecto, conoce su historia y habla el idioma de la construcción.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1A2744] mb-4">Lo que viene en Builtek</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            El Agente RAG de Builtek está en desarrollo activo. Cuando llegue, los usuarios PRO podrán
            hacer preguntas en lenguaje natural a todos sus documentos del proyecto — planos, especificaciones,
            oficios, reportes — y obtendrán respuestas citadas y verificables.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Los usuarios Contractor tendrán acceso al RAG multiproyecto: preguntarle a <em>toda la empresa</em>.
            "¿En qué proyectos hemos usado pilotes de 40cm?" — y el sistema revisa todos los proyectos activos simultáneamente.
          </p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
            <h3 className="text-white text-2xl font-bold mb-3">¿Quieres ser de los primeros en probarlo?</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
              Regístrate ahora con el plan PRO y te notificamos en cuanto el Agente RAG esté disponible.
              Los usuarios actuales tienen acceso prioritario.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors"
              >
                Crear cuenta gratis →
              </Link>
              <a
                href="mailto:hola@builtek.app"
                className="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors"
              >
                Solicitar demo
              </a>
            </div>
          </div>

        </div>
      </article>

      {/* Footer mini */}
      <div className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
          <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-600 transition-colors">Inicio</Link>
            <Link href="/#precios" className="hover:text-slate-600 transition-colors">Precios</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
