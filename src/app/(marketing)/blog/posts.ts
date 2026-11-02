export type Post = {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  htmlContent: string
  faqs?: { question: string; answer: string }[]
  metadata: {
    title: string
    description: string
    keywords?: string
  }
}

export const POSTS: Post[] = [
  {
    slug: 'control-documental-obra-civil',
    category: 'Guía práctica',
    title: 'Cómo llevar el control documental en una obra civil sin volverse loco',
    excerpt: 'Los 5 errores más comunes que retrasan proyectos de infraestructura en México y cómo evitarlos con un sistema que tu equipo realmente use.',
    readTime: '6 min',
    date: 'Oct 2026',
    metadata: {
      title: 'Cómo llevar el control documental en una obra civil sin volverse loco | Builtek',
      description: 'Los 5 errores más comunes de control documental en obra y cómo evitarlos. Guía práctica para residentes y directores de proyecto en México.',
      keywords: 'control documental obra civil, control de planos constructora, gestión documentos construcción México, versiones de planos obra',
    },
    faqs: [
      {
        question: '¿Qué es el control documental en obra civil?',
        answer: 'El control documental en obra civil es el sistema que permite gestionar todas las versiones de planos, especificaciones, oficios y documentos técnicos de un proyecto, asegurando que el equipo siempre trabaje con la versión vigente y que exista trazabilidad de cambios.',
      },
      {
        question: '¿Cuáles son los errores más comunes de control documental en construcción?',
        answer: 'Los 5 errores más comunes son: planos distribuidos por WhatsApp sin versión oficial, carpetas en Drive sin metadatos, oficios sin folio ni seguimiento, avance de obra en Excel actualizado manualmente y planos que nadie lee completos por falta de herramientas.',
      },
      {
        question: '¿Cómo puede un agente AI ayudar en el control documental de obra?',
        answer: 'Un agente AI entrenado en documentación técnica de construcción puede leer planos PDF en segundos y responder preguntas específicas como "¿Qué diámetro de varilla especifica para la zapata tipo Z-3?", citando el número de página. No reemplaza al ingeniero — le devuelve horas de búsqueda manual.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Guía práctica</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Cómo llevar el control documental<br>
        <span class="text-[#00C2FF]">en una obra civil sin volverse loco</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Los 5 errores más comunes que retrasan proyectos de infraestructura en México
        y cómo evitarlos con un sistema que tu equipo realmente use.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>6 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El residente de obra tiene dos versiones del mismo plano en su carpeta.
        No sabe cuál es la vigente. El maestro de obra está construyendo con la versión anterior.
        Nadie lo nota hasta que hay que demoler.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Eso no es un problema de disciplina del equipo. Es un problema de sistema.
        O más exactamente: de no tener ningún sistema.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        El control documental en obra civil es uno de esos temas que todo director de proyecto
        sabe que es crítico, pero que casi nadie resuelve bien hasta que algo sale mal.
        En este artículo vamos a ver los 5 errores más comunes y qué hacer con cada uno.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Error #1 — Los planos viven en WhatsApp</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El arquitecto o el proyectista manda la revisión del plano por WhatsApp. El residente lo descarga,
        lo guarda en su celular, quizás lo pasa al grupo del equipo. Tres semanas después hay 4 versiones
        del mismo plano distribuidas entre 6 personas y nadie sabe cuál tiene la nota de revisión más reciente.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">El costo real de este error</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          En proyectos ferroviarios e infraestructura, construir con un plano desactualizado puede
          significar retrabajos de decenas de miles de pesos y semanas de retraso en el programa de obra.
          El costo de un sistema de control documental es pequeño comparado con un solo retrabajo.
        </p>
      </div>
      <p class="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Un repositorio central donde cada documento tiene una versión oficial marcada como vigente.
        Cuando llega una nueva revisión, la versión anterior queda archivada pero visible.
        El equipo en campo siempre accede al mismo repositorio — no a lo que llegó por WhatsApp.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Error #2 — Carpetas en Drive sin estructura</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Google Drive o Dropbox resuelven el problema de "dónde está el archivo", pero no el de
        "cuál versión es la vigente" ni "quién aprobó este plano". Una carpeta llamada
        <code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm mx-1">Planos_FINAL_v3_revisado_nuevo.pdf</code>
        no es control documental — es caos organizado.
      </p>
      <p class="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
      <p class="text-slate-600 leading-relaxed mb-8">
        La estructura de carpetas importa, pero más importante es que el sistema registre
        metadatos por documento: disciplina, número de plano, versión, responsable, fecha de emisión
        y estado (en revisión / aprobado / supersedido). Eso no lo da Google Drive nativo.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Error #3 — Los oficios sin seguimiento</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un oficio sale. El receptor lo recibe. Nadie lo registra formalmente. Tres semanas después,
        la supervisión pide evidencia de que se notificó al contratista sobre una desviación.
        Se busca en el correo, en WhatsApp, en carpetas físicas. Se pierde media jornada.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        En proyectos con clientes como CFE, SEDENA o SCT, la trazabilidad de oficios no es
        opcional — es un requisito contractual. Un oficio sin folio, sin fecha de recepción
        y sin estado de respuesta es un pasivo legal.
      </p>
      <p class="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Cada oficio debe tener número de folio consecutivo, categoría, asignado, fecha de
        vencimiento de respuesta y estado visible para todo el equipo. No en Excel — en un
        sistema donde el cambio de estado queda registrado con fecha y usuario.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Error #4 — El avance de obra en Excel</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El superintendente actualiza el Excel del avance los viernes. El lunes, el director de
        proyecto lo revisa en una junta. El martes ya está desactualizado. El Excel es un snapshot,
        no un sistema vivo. Y cuando hay múltiples frentes de obra, mantener ese Excel actualizado
        se convierte en un trabajo de medio tiempo.
      </p>
      <p class="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
      <p class="text-slate-600 leading-relaxed mb-8">
        El avance debe capturarse donde ocurre el trabajo: cuando el responsable completa
        una tarea, el sistema actualiza los KPIs automáticamente. El director ve el estado
        real en cualquier momento, desde cualquier dispositivo, sin esperar el reporte del viernes.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Error #5 — Nadie sabe leer los planos rápido</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un plano estructural de 90 páginas llega a revisión. El residente necesita saber si las
        especificaciones de acero del Tramo 3 cambiaron respecto a la versión anterior. Abre el
        PDF, busca manualmente, compara dos documentos a la vez. Una hora después, tiene la respuesta
        — o no la tiene y decide continuar con lo que recuerda.
      </p>
      <p class="text-slate-600 leading-relaxed mb-2 font-semibold">La solución:</p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Un agente AI entrenado en documentación técnica de construcción puede leer ese plano
        en segundos y responder preguntas específicas: "¿Qué diámetro de varilla especifica para
        la zapata tipo Z-3?" La respuesta llega citada, con número de página. No reemplaza al
        ingeniero — le devuelve una hora de su día.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-5">Resumen: los 5 errores y su solución</h2>
      <div class="overflow-x-auto mb-8">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-[#1A2744] text-white">
              <th class="text-left px-4 py-3 font-semibold rounded-tl-xl">Error</th>
              <th class="text-left px-4 py-3 font-semibold rounded-tr-xl">Lo que necesitas</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-white">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Planos distribuidos por WhatsApp</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Repositorio central con versión vigente marcada</td>
            </tr>
            <tr class="bg-slate-50">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Carpetas en Drive sin metadatos</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Sistema con disciplina, versión, estado y responsable por doc</td>
            </tr>
            <tr class="bg-white">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Oficios sin folio ni seguimiento</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Registro formal con número, estado y fecha de respuesta</td>
            </tr>
            <tr class="bg-slate-50">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Avance en Excel actualizado los viernes</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">KPIs en tiempo real vinculados a las tareas del equipo</td>
            </tr>
            <tr class="bg-white">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Planos que nadie lee completos</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Agente AI que responde preguntas sobre tus documentos técnicos</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Por dónde empezar?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        No necesitas resolver los 5 errores al mismo tiempo. La secuencia que funciona en la práctica:
      </p>
      <ol class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <span class="leading-relaxed">Primero: centraliza los planos vigentes en un solo lugar. Que todos sepan que ahí está la versión oficial.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <span class="leading-relaxed">Segundo: implementa el registro de oficios. Es lo que más duele en auditorías y lo más fácil de formalizar.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <span class="leading-relaxed">Tercero: conecta el avance de obra a las tareas del equipo. Deja de actualizar el Excel manualmente.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
          <span class="leading-relaxed">Cuarto: suma el agente AI cuando ya tienes documentos organizados. Sin orden, la AI no puede ayudarte.</span>
        </li>
      </ol>
      <p class="text-slate-600 leading-relaxed mb-8">
        El objetivo no es la herramienta perfecta desde el día uno. Es que tu equipo tenga
        un sistema que realmente use — uno que no requiera 3 horas de capacitación y que
        funcione desde el primer día en obra.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver cómo se ve esto en la práctica?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
          Control documental, oficios, tareas y agente AI — todo integrado.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'alternativa-procore-mexico',
    category: 'Comparativa',
    title: 'Por qué Procore es demasiado caro para constructoras mexicanas (y qué usar en su lugar)',
    excerpt: 'Procore cobra hasta $80,000 USD/año. Una comparativa honesta de costos, funciones y contexto mexicano.',
    readTime: '7 min',
    date: 'Oct 2026',
    metadata: {
      title: 'Por qué Procore es demasiado caro para constructoras mexicanas | Builtek',
      description: 'Procore cobra hasta $80,000 USD/año. Conoce la alternativa construida para constructoras en México: control documental, módulo de oficios y agente AI, desde $3,790 MXN/mes.',
      keywords: 'alternativa Procore México, software gestión obra México, Procore precio México, control documental constructora México',
    },
    faqs: [
      {
        question: '¿Cuánto cuesta Procore en México?',
        answer: 'Procore no publica su precio. Para empresas medianas en México, el costo ronda los $25,000–80,000 USD/año (entre $460,000 y $1,480,000 MXN). El plan de entrada está cerca de $375 USD/mes para un solo módulo, lo que equivale a más de $6,900 MXN al mes solo para comenzar.',
      },
      {
        question: '¿Por qué Procore no es ideal para constructoras mexicanas?',
        answer: 'Procore fue diseñado para el mercado norteamericano. No genera CFDI, el soporte es principalmente en inglés, los flujos de aprobación no corresponden al contexto mexicano (CFE, SEDENA, SCT) y tiene exceso de funcionalidades que constructoras medianas no utilizan.',
      },
      {
        question: '¿Cuál es la mejor alternativa a Procore en México?',
        answer: 'Builtek es la alternativa construida específicamente para constructoras mexicanas. Ofrece control documental con versiones, módulo de oficios nativo, agente AI que lee planos, notificaciones por WhatsApp y precios en MXN desde $3,790 MXN/mes para un equipo completo.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Comparativa</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Por qué Procore es demasiado caro<br>
        <span class="text-[#00C2FF]">para constructoras mexicanas</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Y qué usar en su lugar. Una comparativa honesta de costos, funciones y
        contexto mexicano para que tomes la mejor decisión sin gastar en lo que no necesitas.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span><span>·</span><span>7 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        Si llegaste aquí, probablemente ya cotizaste Procore y te llevaste un susto con el precio.
        No estás solo. Es la historia de casi toda constructora mexicana que busca modernizar su operación.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        En este artículo vamos a ver por qué Procore —siendo un producto excelente— no está pensado para
        el mercado mexicano, cuánto cuesta realmente, y qué alternativas existen hoy.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Cuánto cuesta Procore en México?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Procore no publica su precio en su sitio web. Tienes que agendar una llamada con ventas para
        obtener una cotización. Eso ya te dice algo.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Lo que se sabe del mercado: Procore cobra por <strong>volumen de construcción anual</strong>. Para una empresa
        con $50–200 millones de pesos en obra activa, el costo anual ronda los <strong>$25,000–80,000 USD/año</strong>
        — entre $460,000 y $1,480,000 MXN.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Para empresas más chicas, existe un plan de entrada cerca de los <strong>$375 USD/mes</strong> para un solo módulo.
        Con el tipo de cambio actual, eso es más de <strong>$6,900 MXN al mes</strong>. Suma implementación,
        capacitación, soporte en inglés e integración con tus procesos actuales.
        El costo real en el primer año fácilmente supera los $100,000 USD para una empresa mediana.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El problema no es solo el precio</h2>
      <p class="text-slate-600 leading-relaxed mb-6">
        El precio es el síntoma. El problema de fondo es que <strong>Procore fue construido para el mercado
        norteamericano</strong>. Y eso se nota en puntos que duelen especialmente en México:
      </p>
      <div class="space-y-5 mb-8">
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <div>
            <p class="font-semibold text-[#1A2744] mb-1">No genera CFDI</p>
            <p class="text-slate-500 text-sm leading-relaxed">En México, todo pago de servicio requiere factura electrónica con CFDI. Procore no tiene integración nativa con el SAT ni con las addendas que exigen clientes como PEMEX, CFE o gobierno federal. Tienes que resolver eso aparte.</p>
          </div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <div>
            <p class="font-semibold text-[#1A2744] mb-1">Soporte en inglés (o inglés con acento)</p>
            <p class="text-slate-500 text-sm leading-relaxed">El soporte técnico de Procore opera principalmente en inglés. Cuando tienes un problema urgente en obra —y los problemas en obra siempre son urgentes— esperar traducción no es una opción.</p>
          </div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <div>
            <p class="font-semibold text-[#1A2744] mb-1">Flujos que no corresponden al contexto mexicano</p>
            <p class="text-slate-500 text-sm leading-relaxed">El módulo de "Submittals" de Procore es equivalente a lo que en México llamamos oficios o correspondencia técnica. Pero la lógica, la nomenclatura y los flujos de aprobación están diseñados para proyectos en EE.UU. Adaptar eso al contexto de una obra ferroviaria en México requiere configuración y consultoría adicional.</p>
          </div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
          <div>
            <p class="font-semibold text-[#1A2744] mb-1">Exceso de funcionalidades que no usarás</p>
            <p class="text-slate-500 text-sm leading-relaxed">Procore tiene módulos para ERP, nómina, finanzas, BI avanzado. Si lo que necesitas es controlar planos, gestionar oficios y hacer seguimiento de avance de obra, estás pagando por un avión cuando solo necesitas un automóvil confiable.</p>
          </div>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Qué buscan realmente las constructoras mexicanas?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Cuando hablamos con residentes de obra y directores de proyecto en México, los tres dolores que
        aparecen siempre son:
      </p>
      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
          <span class="leading-relaxed">¿Dónde está la última versión del plano? ¿El que está en obra es el vigente?</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
          <span class="leading-relaxed">¿Qué oficios están sin respuesta? ¿Cuánto tiempo llevan sin respuesta?</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
          <span class="leading-relaxed">¿Qué tan avanzada está la obra? Por frente, por especialidad, por estructura.</span>
        </li>
      </ul>
      <p class="text-slate-600 leading-relaxed mb-8">
        Tres problemas concretos. Ninguno requiere un sistema de $80,000 USD al año para resolverse.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué alternativas existen hoy</h2>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1a3a5c] text-white rounded-2xl p-8 mb-8">
        <p class="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">La alternativa construida para México</p>
        <h3 class="text-2xl font-bold mb-4">Builtek</h3>
        <p class="text-white/70 leading-relaxed mb-5">
          No reemplaza Procore con más funciones. Lo reemplaza con <strong class="text-white">las funciones correctas para el contexto mexicano</strong>.
        </p>
        <ul class="space-y-3">
          <li class="flex items-start gap-3">
            <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
            <span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Control documental con versiones:</strong> Planos, especificaciones, memorias de cálculo. Siempre sabes qué versión está vigente y quién la aprobó.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
            <span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Módulo de Oficios nativo:</strong> Seguimiento de correspondencia técnica con folio, categoría, asignado, estado y trazabilidad.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
            <span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Agente AI que lee planos:</strong> Sube un PDF con planos estructurales y el agente extrae cuantificación automáticamente.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
            <span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Notificaciones por WhatsApp:</strong> Cuando se asigna una tarea o se sube un plano, el responsable recibe un mensaje de WhatsApp — no un correo que nadie lee.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span>
            <span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Precios en MXN:</strong> Sin conversiones de tipo de cambio, sin sorpresas. El plan Obra cuesta $3,790 MXN/mes para un equipo completo.</span>
          </li>
        </ul>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Comparativa directa</h2>
      <div class="overflow-x-auto mb-8">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-[#1A2744] text-white">
              <th class="text-left px-4 py-3 font-semibold rounded-tl-xl">Criterio</th>
              <th class="text-center px-4 py-3 font-semibold">Procore</th>
              <th class="text-center px-4 py-3 font-semibold text-[#00C2FF] rounded-tr-xl">Builtek</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-white"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Precio mensual (equipo mediano)</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">$6,900–$40,000+ MXN</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">$3,790–$12,990 MXN</td></tr>
            <tr class="bg-slate-50"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Moneda</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">USD (riesgo cambiario)</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">MXN</td></tr>
            <tr class="bg-white"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">CFDI</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">✗ No nativo</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ En planes pagados</td></tr>
            <tr class="bg-slate-50"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Módulo de Oficios técnicos</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">Submittals (no adaptado)</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ Nativo para México</td></tr>
            <tr class="bg-white"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Soporte</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">Inglés principalmente</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ Español, México</td></tr>
            <tr class="bg-slate-50"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Agente AI para planos</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">✗ No</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ Gemini 2.5 Flash</td></tr>
            <tr class="bg-white"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Notificaciones WhatsApp</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">✗ No</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ Sí</td></tr>
            <tr class="bg-slate-50"><td class="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">Tiempo de implementación</td><td class="px-4 py-3 text-slate-500 text-center border-b border-slate-100">3–6 meses + consultoría</td><td class="px-4 py-3 text-[#1A2744] font-semibold text-center border-b border-slate-100">✓ El mismo día</td></tr>
          </tbody>
        </table>
      </div>
      <div class="border-l-4 border-[#00C2FF] pl-5 mb-8">
        <h3 class="font-bold text-[#1A2744] mb-2">¿Para quién NO es Builtek?</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Si tienes una empresa con 500+ personas, proyectos en múltiples países, necesitas integración con SAP
          o tienes un equipo dedicado de BIM, Procore probablemente es la herramienta correcta para ti a pesar del precio.
          Builtek es para <strong>constructoras medianas y equipos de obra civil en México</strong> que necesitan control
          real sobre su operación sin pagar precios de empresa Fortune 500.
        </p>
      </div>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver Builtek con datos reales de obra?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
          Sin compromiso. Sin presión.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">Solicitar demo gratuita →</a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">Crear cuenta gratis</a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'vendor-lock-in-construccion',
    category: 'Estrategia',
    title: 'Vendor lock-in en construcción: cómo no quedar atrapado en tu software',
    excerpt: 'Contratas un software para gestionar tu obra y años después descubres que no puedes salir sin perder todo. Así funciona el vendor lock-in — y así lo evitas.',
    readTime: '8 min',
    date: 'Oct 2026',
    metadata: {
      title: 'Vendor lock-in en construcción: cómo no quedar atrapado en tu software | Builtek',
      description: 'Qué es el vendor lock-in, cómo afecta a constructoras y qué preguntar antes de contratar cualquier software de gestión de obra. Guía práctica para equipos AEC en México.',
      keywords: 'vendor lock-in construcción, software gestión obra México, portabilidad datos construcción, cambiar software constructora, control documental sin ataduras',
    },
    faqs: [
      {
        question: '¿Qué es el vendor lock-in en software de construcción?',
        answer: 'El vendor lock-in es la situación en que una constructora se vuelve tan dependiente de un proveedor de software que cambiar a otra solución se vuelve costoso o imposible. En construcción esto ocurre cuando los datos históricos (planos, oficios, trazabilidad de aprobaciones) quedan atrapados en formatos propietarios o cuando hay penalizaciones por cancelación anticipada.',
      },
      {
        question: '¿Qué preguntas hacer antes de contratar software de gestión de obra?',
        answer: 'Preguntas clave: ¿Puedo exportar todos mis datos en cualquier momento sin costo adicional? ¿Qué pasa con mis datos si cancelo? ¿El contrato tiene renovación automática? ¿Tienen API abierta? ¿Han subido precios en los últimos 2 años? Un proveedor que responde claramente estas preguntas no necesita atraparte para retenerte.',
      },
      {
        question: '¿Cómo evita Builtek el vendor lock-in?',
        answer: 'Builtek opera en modelo mensual sin contratos plurianuales. Los archivos se almacenan en Cloudflare R2 con URLs directas. Cualquier usuario Owner puede exportar documentos, oficios y metadatos en formatos estándar (PDF, CSV, JSON) sin costo adicional. El backend es PostgreSQL en Supabase con schema documentado.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Estrategia</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Vendor lock-in en construcción:<br>
        <span class="text-[#00C2FF]">cómo no quedar atrapado en tu software</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Contratas un software para gestionar tu obra, y tres años después descubres que no puedes salir sin perder
        todos tus datos. Así funciona el vendor lock-in — y así lo evitas.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span><span>·</span><span>8 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        Imagina esto: llevas dos años usando un software para gestionar tus proyectos.
        Tienes 4,000 documentos subidos, 200 oficios registrados, el historial completo de dos frentes de obra.
        Un día decides cambiar de herramienta porque encontraste algo mejor o más barato.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Y entonces descubres que no puedes exportar nada. O que la exportación te cuesta un fee adicional.
        O que los archivos salen en un formato propietario que ningún otro sistema entiende.
        Eso es vendor lock-in — y en la industria de la construcción es más común de lo que parece.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Qué es exactamente el vendor lock-in?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El término vendor lock-in describe la situación en la que un cliente se vuelve tan dependiente de un proveedor
        específico que cambiar a otra solución se vuelve costoso, complicado o directamente imposible.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">En software de construcción, esto puede manifestarse de varias formas:</p>
      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3 text-slate-600"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="leading-relaxed">Tus datos están en un formato propietario que solo ese software puede leer</span></li>
        <li class="flex items-start gap-3 text-slate-600"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="leading-relaxed">La exportación de datos está restringida, limitada o cuesta dinero extra</span></li>
        <li class="flex items-start gap-3 text-slate-600"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="leading-relaxed">Tus integraciones con otros sistemas solo funcionan dentro del ecosistema del proveedor</span></li>
        <li class="flex items-start gap-3 text-slate-600"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="leading-relaxed">Capacitaste a todo tu equipo en esa interfaz y el costo humano de cambiar es enorme</span></li>
        <li class="flex items-start gap-3 text-slate-600"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="leading-relaxed">El contrato tiene penalizaciones por cancelación anticipada o renovación automática difícil de detener</span></li>
      </ul>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por qué la construcción es especialmente vulnerable</h2>
      <div class="space-y-5 mb-8">
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <div><p class="font-semibold text-[#1A2744] mb-1">El historial documental es crítico y difícil de migrar</p><p class="text-slate-500 text-sm leading-relaxed">Los planos, especificaciones y oficios de una obra tienen valor legal y contractual durante años después de que termina el proyecto.</p></div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <div><p class="font-semibold text-[#1A2744] mb-1">Los flujos de aprobación acumulan datos difíciles de replicar</p><p class="text-slate-500 text-sm leading-relaxed">Quién aprobó qué plano, en qué fecha, con qué revisión — esa trazabilidad es exactamente lo que piden las auditorías técnicas y los clientes gubernamentales.</p></div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <div><p class="font-semibold text-[#1A2744] mb-1">La capacitación crea inercia organizacional</p><p class="text-slate-500 text-sm leading-relaxed">Entrenar a un equipo de obra en una nueva plataforma toma tiempo y genera resistencia. Los proveedores lo saben y cuentan con eso.</p></div>
        </div>
        <div class="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <span class="w-7 h-7 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
          <div><p class="font-semibold text-[#1A2744] mb-1">Los contratos plurianuales amplifican el riesgo</p><p class="text-slate-500 text-sm leading-relaxed">Es común que software enterprise (Procore, Autodesk CC) pida compromisos de 2–3 años. Si el proveedor sube precios o cambia funciones clave, tu margen de maniobra es mínimo hasta que venza el contrato.</p></div>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Las señales de que ya estás (o puedes quedar) atrapado</h2>
      <div class="space-y-3 mb-8">
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-red-50 text-red-600 border border-red-100">Alto riesgo</span><p class="text-slate-600 text-sm leading-relaxed">¿Puedo exportar todos mis datos hoy, ahora, sin costo adicional?</p></div>
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-amber-50 text-amber-600 border border-amber-100">Medio riesgo</span><p class="text-slate-600 text-sm leading-relaxed">¿El formato de exportación es estándar (CSV, JSON, PDF)? ¿O es propietario?</p></div>
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-red-50 text-red-600 border border-red-100">Alto riesgo</span><p class="text-slate-600 text-sm leading-relaxed">¿Qué pasa con mis datos si cancelo la suscripción? ¿Cuánto tiempo tengo para descargarlos?</p></div>
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-amber-50 text-amber-600 border border-amber-100">Medio riesgo</span><p class="text-slate-600 text-sm leading-relaxed">¿El contrato tiene renovación automática con aviso menor a 60 días?</p></div>
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-red-50 text-red-600 border border-red-100">Alto riesgo</span><p class="text-slate-600 text-sm leading-relaxed">¿Hay penalización económica por cancelar antes del vencimiento?</p></div>
        <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200"><span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 bg-slate-50 text-slate-500 border border-slate-100">Señal de alerta</span><p class="text-slate-600 text-sm leading-relaxed">¿El proveedor ha subido precios más del 20% en los últimos 2 años?</p></div>
      </div>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1a3a5c] text-white rounded-2xl p-8 mb-8">
        <p class="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">Cómo lo resuelve Builtek</p>
        <h3 class="text-2xl font-bold mb-4">Sin vendor lock-in. Tus datos, tus reglas.</h3>
        <ul class="space-y-3">
          <li class="flex items-start gap-3"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Exportación libre en todo momento:</strong> Cualquier usuario Owner puede exportar en formatos estándar sin costo adicional.</span></li>
          <li class="flex items-start gap-3"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Sin contratos plurianuales:</strong> Builtek opera en modelo mensual. Cancelas y listo — sin penalizaciones.</span></li>
          <li class="flex items-start gap-3"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Almacenamiento en Cloudflare R2:</strong> Los archivos que subes se almacenan con URLs directas, no en una caja negra propietaria.</span></li>
          <li class="flex items-start gap-3"><span class="mt-1 w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0"></span><span class="text-white/80 text-sm leading-relaxed"><strong class="text-white">Stack abierto y documentado:</strong> Backend es PostgreSQL en Supabase. El schema es estándar y está documentado.</span></li>
        </ul>
      </div>
      <div class="border-l-4 border-[#00C2FF] pl-5 mb-6">
        <p class="text-[#1A2744] font-semibold text-lg leading-relaxed">
          "¿Qué tan fácil es salir de aquí si algún día quiero hacerlo?"
        </p>
      </div>
      <p class="text-slate-600 leading-relaxed mb-8">
        Un proveedor que te da una respuesta clara, directa y sin condiciones a esa pregunta
        es un proveedor que no necesita atraparte para retenerte. Y eso, en el largo plazo,
        es exactamente el tipo de proveedor con quien quieres trabajar.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver Builtek con datos reales de obra?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos con datos reales de un proyecto ferroviario activo en México.
          Sin compromiso. Sin presión. Y sí, puedes exportar todo lo que subas.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">Solicitar demo gratuita →</a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">Crear cuenta gratis</a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'agente-rag',
    category: 'Educación',
    title: 'Tu proyecto tiene 300 planos. ChatGPT no puede leerlos todos.',
    excerpt: 'Por qué el constructor del futuro no busca en PDFs — le pregunta al proyecto. Una comparación honesta entre subir archivos a ChatGPT y usar un Agente RAG.',
    readTime: '8 min',
    date: 'Oct 2026',
    metadata: {
      title: 'Por qué ChatGPT no puede ser el asistente de tu obra | Builtek Blog',
      description: 'Descubre qué es el Agente RAG y por qué cambia todo para la gestión de proyectos de construcción en LATAM.',
    },
    faqs: [
      {
        question: '¿Qué es RAG y por qué es importante para la construcción?',
        answer: 'RAG (Retrieval-Augmented Generation) es una técnica donde la IA busca en tu biblioteca de documentos los fragmentos más relevantes antes de responder. Para construcción, significa que el agente puede responder preguntas sobre tus planos, especificaciones y oficios citando el documento y la sección exacta — sin límite de documentos y con memoria permanente entre sesiones.',
      },
      {
        question: '¿Por qué ChatGPT no es suficiente para gestionar documentación de obra?',
        answer: 'ChatGPT tiene una ventana de contexto limitada (~128,000 tokens) que equivale a 3-12 planos. Un proyecto real tiene decenas o cientos. Además, no tiene memoria entre sesiones — tienes que subir los documentos de nuevo cada vez. Y no está integrado con las tareas, oficios y aprobaciones de tu proyecto.',
      },
      {
        question: '¿Cuándo estará disponible el Agente RAG en Builtek?',
        answer: 'El Agente RAG de Builtek está en desarrollo activo. Los usuarios con plan Pro podrán hacer preguntas en lenguaje natural a todos sus documentos del proyecto. Los usuarios Contractor tendrán acceso al RAG multiproyecto. Los usuarios actuales tienen acceso prioritario al registro.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Educación</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Tu proyecto tiene 300 planos.<br>
        <span class="text-[#00C2FF]">ChatGPT no puede leerlos todos.</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Por qué el constructor del futuro no busca en PDFs — le pregunta al proyecto.
        Una comparación honesta entre subir archivos a ChatGPT y usar un Agente RAG integrado en tu plataforma de obra.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span><span>·</span><span>8 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        Un residente de obra lleva 3 horas buscando en qué plano especificaron el tipo de acero
        para las zapatas del Tramo 2. Abre PDF tras PDF. Revisa el índice. Le pregunta al director.
        Nadie recuerda. Finalmente lo encuentra — en la página 47 de un documento de 90 páginas
        que nadie había abierto en 6 semanas.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Eso no es un problema de disciplina. Es un problema de herramienta.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El experimento que todo constructor hace</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        En algún punto, alguien en el equipo tuvo la idea: <em>"¿Por qué no subimos los planos a ChatGPT y le preguntamos?"</em>
        Y funciona. La primera vez. Con un documento. Con una pregunta sencilla.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        El problema aparece en la segunda semana, cuando el proyecto ya tiene 40 documentos,
        3 revisiones de planos y un oficio de supervisión que contradice la especificación original.
        ChatGPT no sabe nada de eso a menos que se lo pegues todo de nuevo, en cada sesión, manualmente.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
        <p class="text-amber-800 font-semibold text-sm mb-2">El límite que nadie te explica</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          ChatGPT tiene una <strong>ventana de contexto</strong> — la cantidad de texto que puede "ver" a la vez.
          Un plano estructural en PDF, al convertirse a texto, puede ocupar 10,000-50,000 tokens. La ventana
          de GPT-4 es de ~128,000 tokens. Eso equivale a 3-12 planos. Tu proyecto real tiene decenas o cientos.
          El resto simplemente no existe para la IA.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué es RAG (sin rodeos)</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        RAG son las siglas de <strong>Retrieval-Augmented Generation</strong>. En cristiano:
        antes de responder, la IA <em>busca</em> en tu biblioteca de documentos los fragmentos más
        relevantes para tu pregunta — y solo entonces genera la respuesta usando esa información específica.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        No necesita que le pegues todo el proyecto. No tiene límite de documentos. No olvida nada entre sesiones.
        Y lo más importante para construcción: <strong>te dice exactamente de qué documento y sección viene cada dato</strong>.
      </p>
      <div class="overflow-x-auto rounded-2xl border border-slate-200 mb-10">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-5 py-4 text-left font-semibold text-slate-700 w-1/3"></th>
              <th class="px-5 py-4 text-left font-semibold text-slate-500">ChatGPT / Claude con archivos</th>
              <th class="px-5 py-4 text-left font-semibold text-[#1A2744]">Agente RAG de Builtek</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="bg-white"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Capacidad de documentos</td><td class="px-5 py-4 text-slate-400 text-xs">Limitado por ventana de contexto (~3-12 planos)</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Ilimitado — indexa toda tu biblioteca</td></tr>
            <tr class="bg-slate-50/50"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Memoria entre sesiones</td><td class="px-5 py-4 text-slate-400 text-xs">Ninguna. Empieza de cero cada vez</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Permanente y siempre actualizada</td></tr>
            <tr class="bg-white"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Fuentes citadas</td><td class="px-5 py-4 text-slate-400 text-xs">A veces. Sin referencia exacta al documento</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Siempre: plano, sección y revisión</td></tr>
            <tr class="bg-slate-50/50"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Documentos nuevos</td><td class="px-5 py-4 text-slate-400 text-xs">Tienes que subirlos manualmente cada vez</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Se indexan automáticamente al subir</td></tr>
            <tr class="bg-white"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Integración con el proyecto</td><td class="px-5 py-4 text-slate-400 text-xs">Ninguna — no sabe de tus tareas, oficios ni aprobaciones</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Sabe qué docs tienen observaciones, qué tareas están pendientes</td></tr>
            <tr class="bg-slate-50/50"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Privacidad de tus planos</td><td class="px-5 py-4 text-slate-400 text-xs">Tus documentos pasan por servidores de OpenAI/Anthropic</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Tus datos en tu workspace cifrado en Builtek</td></tr>
            <tr class="bg-white"><td class="px-5 py-4 text-slate-700 font-medium text-xs">Alucinaciones</td><td class="px-5 py-4 text-slate-400 text-xs">Alta probabilidad si el doc no está en contexto</td><td class="px-5 py-4 text-[#1A2744] font-medium text-xs">Mínimas — responde solo con lo que encontró en tus docs</td></tr>
          </tbody>
        </table>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Lo que cambia en obra</h2>
      <div class="grid sm:grid-cols-2 gap-4 mb-10">
        <div class="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-[#1A2744] mb-3">Revisión de especificaciones</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-2"><span class="text-red-400 text-xs font-bold mt-0.5 flex-shrink-0">Antes</span><p class="text-slate-500 text-xs leading-relaxed">Abrir 5 PDFs, buscar con Ctrl+F, no encontrar nada porque el término exacto es diferente en cada doc.</p></div>
            <div class="flex items-start gap-2"><span class="text-emerald-500 text-xs font-bold mt-0.5 flex-shrink-0">RAG</span><p class="text-slate-700 text-xs leading-relaxed">"¿Qué resistencia de concreto se especifica para vigas secundarias?" → Respuesta en 3 segundos con cita exacta.</p></div>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-[#1A2744] mb-3">Contradicciones entre documentos</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-2"><span class="text-red-400 text-xs font-bold mt-0.5 flex-shrink-0">Antes</span><p class="text-slate-500 text-xs leading-relaxed">Nadie sabe que el plano Rev.B contradice la especificación técnica del año pasado hasta que el error ya está vaciado.</p></div>
            <div class="flex items-start gap-2"><span class="text-emerald-500 text-xs font-bold mt-0.5 flex-shrink-0">RAG</span><p class="text-slate-700 text-xs leading-relaxed">El agente detecta inconsistencias cuando le preguntas y te dice en cuál documento está el dato más reciente.</p></div>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-[#1A2744] mb-3">Incorporación de nuevos ingenieros</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-2"><span class="text-red-400 text-xs font-bold mt-0.5 flex-shrink-0">Antes</span><p class="text-slate-500 text-xs leading-relaxed">2 semanas de curva de aprendizaje leyendo documentación. El veterano que sabe todo está de viaje.</p></div>
            <div class="flex items-start gap-2"><span class="text-emerald-500 text-xs font-bold mt-0.5 flex-shrink-0">RAG</span><p class="text-slate-700 text-xs leading-relaxed">El ingeniero nuevo pregunta al proyecto. El proyecto le responde con fuentes verificables.</p></div>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 class="text-sm font-bold text-[#1A2744] mb-3">Respuesta a supervisión</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-2"><span class="text-red-400 text-xs font-bold mt-0.5 flex-shrink-0">Antes</span><p class="text-slate-500 text-xs leading-relaxed">Buscar manualmente qué dice el contrato, el plano y la especificación sobre el punto que observó el supervisor.</p></div>
            <div class="flex items-start gap-2"><span class="text-emerald-500 text-xs font-bold mt-0.5 flex-shrink-0">RAG</span><p class="text-slate-700 text-xs leading-relaxed">"¿Qué dice el contrato sobre el recubrimiento de armado en elementos a intemperie?" → Copia, cita, listo.</p></div>
          </div>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por qué nadie lo tiene integrado en LATAM</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Procore, el gigante de la gestión de construcción, lleva años con IA pero orientada a
        empresas con contratos millonarios en dólares. Su acceso mínimo es una negociación de meses.
        Autodesk Construction Cloud va en la misma línea.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Builtek nació específicamente para este gap. Y el Agente RAG, integrado con el control documental,
        las tareas, los oficios y el Drive del proyecto — es el paso que convierte la plataforma en el
        sistema operativo real de la obra.
      </p>
      <div class="bg-[#0D1729] text-white rounded-2xl p-8 mb-10">
        <p class="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">La diferencia clave</p>
        <p class="text-xl font-light leading-relaxed mb-2">ChatGPT es un asistente genérico que puedes cargar con tus docs.</p>
        <p class="text-xl font-bold leading-relaxed">El Agente RAG de Builtek <em>vive</em> dentro de tu proyecto, conoce su historia y habla el idioma de la construcción.</p>
      </div>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ser de los primeros en probarlo?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Regístrate ahora con el plan PRO y te notificamos en cuanto el Agente RAG esté disponible.
          Los usuarios actuales tienen acceso prioritario.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/register" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">Crear cuenta gratis →</a>
          <a href="mailto:hola@menvio.app" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">Solicitar demo</a>
        </div>
      </div>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'metrados-automaticos-planos-ia',
    category: 'Kota AI',
    title: 'Metrados de planos estructurales con IA: de 3 días a 30 segundos',
    excerpt: 'El metrado manual de planos es el cuello de botella silencioso de todo presupuesto de obra. Así funciona la extracción automática con IA y por qué los equipos que la usan cierran propuestas 4× más rápido.',
    readTime: '7 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Metrados automáticos de planos estructurales con IA | Builtek Kota',
      description: 'Cómo la IA extrae automáticamente acero, concreto, longitudes y áreas de planos PDF en segundos. Guía técnica para estimadores y directores de proyecto en México.',
      keywords: 'metrados automáticos planos, cuantificación planos construcción, software metrados México, takeoff AI obra civil, cuantificación acero concreto, software presupuesto obra México',
    },
    faqs: [
      {
        question: '¿Qué son los metrados automáticos en construcción?',
        answer: 'Los metrados automáticos son el proceso de extraer cantidades de materiales (acero, concreto, madera, etc.) de planos PDF usando inteligencia artificial, sin necesidad de marcar o medir manualmente. Un sistema como Kota lee el plano, identifica los elementos estructurales, los clasifica por material y tipo de medición, y devuelve las cantidades en segundos.',
      },
      {
        question: '¿Con qué precisión extrae cantidades la IA de los planos?',
        answer: 'Depende de la calidad del plano. En planos bien estructurados con cuadros de cantidades explícitos, la precisión supera el 90%. En planos donde las cantidades están dispersas en notas y detalles, la IA extrae lo que puede ver y marca los elementos con confianza baja para revisión humana. La validación manual tarda minutos, no días.',
      },
      {
        question: '¿Funciona con planos en DWG o solo PDF?',
        answer: 'Actualmente Kota procesa planos en formato PDF, que es el formato de entrega estándar en México. Los planos DWG se pueden convertir a PDF desde AutoCAD o cualquier visor CAD antes de subirlos. El soporte nativo de DWG está en el roadmap.',
      },
      {
        question: '¿Qué pasa si el mismo plano se analiza dos veces?',
        answer: 'Kota detecta automáticamente que ya existe una extracción del mismo documento y usa solo la más reciente en los totales del proyecto. No acumula cantidades dobles cuando se re-analiza un plano corregido.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Kota AI</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Metrados de planos estructurales con IA:<br>
        <span class="text-[#00C2FF]">de 3 días a 30 segundos</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        El metrado manual es el cuello de botella silencioso de todo presupuesto de obra.
        Así funciona la extracción automática con IA y por qué los equipos que la usan cierran propuestas 4× más rápido.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · Nov 2026</span>
        <span>·</span>
        <span>7 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El estimador tiene 47 planos estructurales, 3 días para entregar el presupuesto y un Excel abierto frente a él.
        Va plano por plano, anotando varillas, calculando volúmenes, revisando notas generales.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Al tercer día entrega los números. Dos semanas después, en obra, descubren que faltó el plano MC-03.
        El estimador lo había contado como MC-02 duplicado.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        El metrado —contar y medir manualmente los materiales de un proyecto a partir de sus planos— es la tarea
        más crítica y más tediosa de cualquier presupuesto de obra civil. Es crítica porque un error del 5% en
        el metrado de acero puede costar cientos de miles de pesos. Es tediosa porque se hace a mano, plano
        por plano, y lleva días. La IA llegó para cambiar exactamente eso.
      </p>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué es el metrado y por qué importa tanto</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El metrado es el proceso de extraer cantidades de materiales de los planos de construcción:
        cuánto acero (kg o toneladas), cuánto concreto (m³), cuántas longitudes lineales (m), cuántas
        superficies (m²). Esos números alimentan directamente el presupuesto, los pedidos de material,
        el programa de suministros y la estimación de avance.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        En México, la práctica estándar es hacer el metrado en Excel, a mano, leyendo cada plano.
        Un proyecto mediano de infraestructura puede tener entre 50 y 300 planos. Cada uno puede tardar
        entre 20 minutos y 2 horas de análisis. El total: semanas de trabajo que solo un estimador
        experimentado puede hacer con precisión aceptable.
      </p>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <p class="text-slate-800 text-sm font-bold mb-3">El costo de hacerlo a mano</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-[#1A2744]">3–7 días</p>
            <p class="text-slate-500 text-xs mt-1">para metrear 50 planos estructurales</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-[#1A2744]">~12%</p>
            <p class="text-slate-500 text-xs mt-1">de error típico en metrado manual (estudio CMIC)</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-[#1A2744]">1 de 3</p>
            <p class="text-slate-500 text-xs mt-1">proyectos tiene sobrecosto por metrado incorrecto</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Cómo extrae cantidades la IA</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Los modelos de visión actuales (como Gemini 2.5 de Google o GPT-4o de OpenAI) pueden leer planos PDF
        con la misma capacidad que un ingeniero: ven texto, tablas, acotaciones, cuadros de cantidades y notas
        generales simultáneamente. La diferencia es la velocidad: lo que un estimador tarda 2 horas en revisar,
        la IA lo procesa en 15 a 30 segundos.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Kota, el motor de extracción de Builtek, aplica un pipeline específico para planos de construcción:
      </p>

      <div class="space-y-4 mb-8">
        <div class="flex gap-4 items-start">
          <div class="w-8 h-8 rounded-full bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-[#00C2FF] text-xs font-bold">1</span>
          </div>
          <div>
            <p class="font-semibold text-[#1A2744] text-sm mb-1">Lee el cuadro de referencia</p>
            <p class="text-slate-500 text-sm leading-relaxed">Extrae numero_plano, revisión, escala y disciplina del title block. Esto permite saber exactamente qué plano es, qué versión y de qué especialidad, sin confundir MC-01 con MC-02.</p>
          </div>
        </div>
        <div class="flex gap-4 items-start">
          <div class="w-8 h-8 rounded-full bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-[#00C2FF] text-xs font-bold">2</span>
          </div>
          <div>
            <p class="font-semibold text-[#1A2744] text-sm mb-1">Extrae elementos y cantidades</p>
            <p class="text-slate-500 text-sm leading-relaxed">Identifica cada elemento (viga, columna, losa, zapata, muro), su cantidad, su unidad y su tipo de medición: volumen para concreto, peso para acero, área para impermeabilizantes, lineal para tuberías.</p>
          </div>
        </div>
        <div class="flex gap-4 items-start">
          <div class="w-8 h-8 rounded-full bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-[#00C2FF] text-xs font-bold">3</span>
          </div>
          <div>
            <p class="font-semibold text-[#1A2744] text-sm mb-1">Captura especificaciones técnicas</p>
            <p class="text-slate-500 text-sm leading-relaxed">Lee las notas generales del plano y extrae specs de materiales: f'c del concreto, fy del acero, clase de acero estructural, diámetros de varilla. Estas especificaciones van directamente al presupuesto de materiales.</p>
          </div>
        </div>
        <div class="flex gap-4 items-start">
          <div class="w-8 h-8 rounded-full bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="text-[#00C2FF] text-xs font-bold">4</span>
          </div>
          <div>
            <p class="font-semibold text-[#1A2744] text-sm mb-1">Agrega sin duplicar</p>
            <p class="text-slate-500 text-sm leading-relaxed">Si el mismo plano se re-analiza (versión corregida), Kota usa solo la extracción más reciente. Los totales del proyecto reflejan siempre la última versión de cada documento, sin acumular dobles.</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué materiales clasifica y cómo</h2>
      <p class="text-slate-600 leading-relaxed mb-6">
        La clasificación por material es la parte más delicada del metrado automático. No basta con detectar
        cantidades: hay que saber si ese número es kilogramos de acero, metros cúbicos de concreto o metros
        lineales de tubería. Kota usa el campo <code class="bg-slate-100 px-1 rounded text-sm">tipo_medicion</code> para
        esto, que el modelo extrae directamente del contexto del plano:
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div class="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p class="text-red-600 font-bold text-sm mb-1">Acero</p>
          <p class="text-red-400 text-xs">kg · t · ton</p>
          <p class="text-slate-500 text-xs mt-2">Varillas, perfiles, placas</p>
        </div>
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p class="text-blue-700 font-bold text-sm mb-1">Concreto</p>
          <p class="text-blue-400 text-xs">m³ · m3</p>
          <p class="text-slate-500 text-xs mt-2">Estructural, plantilla, relleno</p>
        </div>
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p class="text-emerald-700 font-bold text-sm mb-1">Longitud</p>
          <p class="text-emerald-400 text-xs">m · ml · km</p>
          <p class="text-slate-500 text-xs mt-2">Tuberías, barreras, guías</p>
        </div>
        <div class="bg-violet-50 border border-violet-100 rounded-xl p-4 text-center">
          <p class="text-violet-700 font-bold text-sm mb-1">Área</p>
          <p class="text-violet-400 text-xs">m² · ha</p>
          <p class="text-slate-500 text-xs mt-2">Impermeabilizante, pintura</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El flujo real en un proyecto</h2>
      <p class="text-slate-600 leading-relaxed mb-6">
        Con Kota el flujo cambia completamente. En lugar de semanas de metrado manual, el equipo trabaja así:
      </p>

      <div class="bg-[#0D1729] rounded-2xl p-6 mb-8 font-mono text-sm">
        <div class="flex items-start gap-3 mb-3">
          <span class="text-[#00C2FF] flex-shrink-0">01</span>
          <span class="text-white/70">Sube los 47 planos PDF al proyecto en Builtek (drag &amp; drop, lote completo)</span>
        </div>
        <div class="flex items-start gap-3 mb-3">
          <span class="text-[#00C2FF] flex-shrink-0">02</span>
          <span class="text-white/70">Abre cualquier plano → pestaña Kota → "Analizar con Kota"</span>
        </div>
        <div class="flex items-start gap-3 mb-3">
          <span class="text-[#00C2FF] flex-shrink-0">03</span>
          <span class="text-white/70">Kota extrae: numero_plano · revisión · escala · elementos · cantidades · specs</span>
        </div>
        <div class="flex items-start gap-3 mb-3">
          <span class="text-[#00C2FF] flex-shrink-0">04</span>
          <span class="text-white/70">El estimador revisa en línea, corrige si hay un elemento fuera de rango</span>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-[#00C2FF] flex-shrink-0">05</span>
          <span class="text-white/70">Dashboard del proyecto: totales acumulados Acero · Concreto · Longitud · Área</span>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Lo que no hace (y por qué es honesto decirlo)</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Kota no reemplaza al estimador. No hace cálculos de ingeniería: no convierte diámetros a pesos por metro,
        no calcula factores de desperdicio, no aplica costos unitarios. Lo que hace es eliminar la parte más lenta
        y propensa a errores: la lectura manual de cada plano para anotar qué hay y cuánto hay.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        El estimador sigue haciendo lo que agrega valor: validar los números, aplicar su criterio técnico,
        negociar con proveedores. Solo que en lugar de tardar 3 días en llegar a los números base, tarda 30 minutos.
      </p>

      <div class="bg-[#0D1729] text-white rounded-2xl p-8 mb-10">
        <p class="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">La diferencia real</p>
        <p class="text-xl font-light leading-relaxed mb-2">El Excel de metrado no desaparece.</p>
        <p class="text-xl font-bold leading-relaxed">Lo que desaparece es la semana que tardabas en llenarlo.</p>
      </div>

      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">Prueba Kota con tus propios planos</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Sube un plano estructural PDF, analiza con Kota y ve los resultados en segundos.
          Sin tarjeta de crédito. Sin instalación.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/register" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">Crear cuenta gratis →</a>
          <a href="/demo" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">Ver demo</a>
        </div>
      </div>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'presupuesto-obra-civil-errores-metrado',
    category: 'Análisis',
    title: 'Por qué el 80% de los presupuestos de obra civil fallan en el metrado',
    excerpt: 'El costo de construir no lo decide el precio de los materiales. Lo decide qué tan bien o mal se leyeron los planos antes de armar el presupuesto. Estos son los 4 puntos de falla que ningún estimador quiere admitir.',
    readTime: '5 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Por qué los presupuestos de obra civil fallan en el metrado | Builtek',
      description: 'Los 4 errores de metrado que arruinan presupuestos de obra civil en México. Cómo la cuantificación automática con IA reduce el error y acelera las propuestas.',
      keywords: 'presupuesto obra civil México, errores metrado construcción, cuantificación materiales obra, software presupuesto construcción México, metrado planos estructurales, estimación costos construcción',
    },
    faqs: [
      {
        question: '¿Cuál es la diferencia entre metrado y presupuesto en construcción?',
        answer: 'El metrado es el proceso de cuantificar materiales y actividades a partir de los planos (cuánto acero, cuánto concreto, cuántos metros de excavación). El presupuesto aplica precios unitarios a esas cantidades para obtener el costo total. Un presupuesto solo puede ser tan preciso como el metrado que lo alimenta.',
      },
      {
        question: '¿Cuánto puede diferir un metrado manual del real?',
        answer: 'En proyectos de infraestructura civil, los errores de metrado manual típicamente oscilan entre 8% y 15% del total. En proyectos con muchos planos y especialidades simultáneas, el error puede superar el 20%. Para un proyecto de 50 millones de pesos, eso representa entre 4 y 10 millones de pesos de desviación.',
      },
      {
        question: '¿El software de metrado automático reemplaza al estimador?',
        answer: 'No. El software extrae las cantidades base de los planos en segundos, eliminando el trabajo manual. Pero el estimador sigue siendo indispensable para validar los números, aplicar factores de desperdicio, incorporar su conocimiento de campo y negociar con proveedores. La IA elimina la parte aburrida, no la parte experta.',
      },
      {
        question: '¿Funciona la cuantificación AI para planos en español y con nomenclatura mexicana?',
        answer: 'Sí. Kota está entrenado para reconocer nomenclatura de planos mexicana: tipos de estructura (zapata, contratrazo, losa de cimentación, pilotes), materiales (concreto hidráulico, acero de refuerzo, perfil HSS), y unidades del sistema métrico decimal. Reconoce también abreviaciones comunes como FC, FY, Rec., ø y similares.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Análisis</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Por qué el 80% de los presupuestos<br>
        <span class="text-[#00C2FF]">de obra civil fallan en el metrado</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        El costo de construir no lo decide el precio de los materiales.
        Lo decide qué tan bien o mal se leyeron los planos antes de armar el presupuesto.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · Nov 2026</span>
        <span>·</span>
        <span>5 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El director de obra recibe el presupuesto aprobado: 38 millones de pesos.
        A los cuatro meses de avance, el estimado a terminación ya es 44 millones.
        La pregunta incómoda: ¿falló el precio de materiales o falló el metrado?
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Casi siempre es el metrado. Y casi siempre nadie lo dice en voz alta.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        En México, la práctica dominante para elaborar un presupuesto de obra civil sigue siendo
        la misma desde hace 30 años: un estimador con experiencia, una impresora o una pantalla con los planos,
        y un Excel. El proceso funciona, pero tiene cuatro puntos de falla estructurales que se repiten
        en proyecto tras proyecto.
      </p>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Falla #1 — El plano que nadie leyó completo</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un plano estructural típico tiene el cuerpo del plano (elementos y acotaciones) y las notas generales
        (especificaciones de materiales, condiciones de carga, referencias a normas). El estimador lee el cuerpo.
        Las notas, que pueden cambiar completamente las cantidades o los tipos de material, se leen cuando hay tiempo.
        Casi nunca hay tiempo.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">Ejemplo real</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          La nota general dice: "Todo el acero de refuerzo será grado 60 (fy=4200 kg/cm²) excepto estribos
          que serán grado 42". El estimador cotizó todo como grado 60. La diferencia en costo: 8% del presupuesto
          de acero en un proyecto de 200 ton.
        </p>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Falla #2 — El plano MC-02 que era MC-02 Rev. B</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El proyectista entrega el lote de planos. Tres semanas después manda una revisión del 30% de ellos
        por correo. El estimador actualiza los que recuerda. El resto queda con la versión anterior. Nadie
        lleva un registro formal de qué revisión se metradó por plano.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        En obra, el maestro construye con la revisión correcta (le llegó por WhatsApp directo del proyectista).
        El presupuesto tiene la revisión anterior. Las cantidades no coinciden. El gerente pide explicaciones.
      </p>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Falla #3 — La disciplina que se metradó dos veces</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        En proyectos con múltiples especialidades (estructural, hidráulico, sanitario, eléctrico), es común
        que dos estimadores trabajen el mismo proyecto en paralelo. Sin un sistema central, el acero de refuerzo
        del plano EST-CIM-001 puede aparecer en el presupuesto de subestructura Y en el presupuesto de cimentaciones.
        Nadie lo nota hasta la revisión final, si es que hay revisión final.
      </p>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Falla #4 — La estimación que no sabe de qué plano viene</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Al final del metrado, el Excel tiene una columna de cantidades pero perdió la trazabilidad: ¿de qué plano
        viene cada número? Si el cliente pide una justificación o el proyectista emite una revisión, reconstruir
        qué plano generó qué cantidad lleva horas. El estimador trabaja de memoria.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p class="text-slate-800 text-xs font-bold uppercase tracking-wide mb-3">Sin trazabilidad</p>
          <div class="space-y-2 text-slate-500 text-sm">
            <p>→ 842 ton de acero en el presupuesto</p>
            <p>→ ¿De cuántos planos? ¿De qué revisiones?</p>
            <p>→ El proyectista cambia un plano</p>
            <p>→ Hay que remetrear todo desde cero</p>
          </div>
        </div>
        <div class="bg-[#0D1729] rounded-xl p-5">
          <p class="text-[#00C2FF] text-xs font-bold uppercase tracking-wide mb-3">Con Kota</p>
          <div class="space-y-2 text-white/60 text-sm">
            <p>→ 842 ton · 47 planos · 3 disciplinas</p>
            <p>→ EST-SUB-012 Rev. B · 38 ton acero</p>
            <p>→ El proyectista actualiza ese plano</p>
            <p>→ Solo se re-analiza ese plano, totales actualizados</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por qué esto sigue pasando en 2026</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        No es falta de capacidad técnica. Los estimadores mexicanos son buenos. El problema es que las herramientas
        no han cambiado. El software de presupuestos (Neodata, Opus, Volare) es excelente para aplicar precios
        unitarios, pero asume que las cantidades ya están correctas. La parte de llegar a esas cantidades —
        el metrado propiamente dicho— sigue siendo manual.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Las soluciones internacionales como Togal.AI o Bluebeam Revu existen pero están en inglés, diseñadas
        para planos en pies y pulgadas, con interfaces para proyectos de tipo americano. No resuelven la
        nomenclatura mexicana, no entienden el sistema métrico decimal como práctica natural, y cuestan
        en dólares lo que una PYME constructora mexicana no puede justificar.
      </p>

      <div class="bg-[#0D1729] text-white rounded-2xl p-8 mb-10">
        <p class="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-3">Lo que cambia con IA</p>
        <p class="text-xl font-light leading-relaxed mb-4">
          Kota lee cada plano en 30 segundos, extrae numero_plano y revisión del cuadro de referencia,
          captura las notas de materiales completas y lleva el total acumulado del proyecto sin duplicar.
        </p>
        <p class="text-white/50 text-base leading-relaxed">
          El estimador valida, corrige lo que la IA no lee bien, y entrega el metrado el mismo día.
          Sin las cuatro fallas. Con trazabilidad completa plano por plano.
        </p>
      </div>

      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Cuánto tiempo pierdes en metrado manual?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Prueba Kota con un plano real. Sube el PDF, analiza, ve los resultados en 30 segundos.
          Sin instalación, sin tarjeta de crédito.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/register" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">Probar Kota gratis →</a>
          <a href="/blog/metrados-automaticos-planos-ia" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">Cómo funciona el metrado IA →</a>
        </div>
      </div>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'control-planos-constructora',
    category: 'Guía práctica',
    title: 'Cómo llevar el control de planos en una constructora sin perder la cabeza',
    excerpt: 'Distribuir revisiones de planos por WhatsApp sin control de versiones es la causa silenciosa de más retrabajos en obra. Aquí está el sistema que funciona.',
    readTime: '6 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Cómo llevar el control de planos en una constructora | Builtek',
      description: 'Guía práctica para llevar el control de revisiones de planos en una constructora sin perder versiones. Sistema, metadatos y herramientas para equipos de obra en México.',
      keywords: 'control de planos constructora, gestión planos obra México, software planos construcción, versiones de planos obra, control revisiones planos construcción',
    },
    faqs: [
      {
        question: '¿Cómo llevar el control de revisiones de planos en obra?',
        answer: 'El control de revisiones de planos requiere un repositorio central donde cada documento tenga marcada su versión vigente. Cuando llega una nueva revisión, la anterior queda archivada pero accesible. El equipo en campo consulta siempre el repositorio — no lo que llegó por WhatsApp o correo.',
      },
      {
        question: '¿Qué información debe tener un plano vigente en construcción?',
        answer: 'Un plano vigente debe tener: número de plano, disciplina (arquitectónico, estructural, hidráulico, etc.), número de revisión, fecha de emisión, estado (vigente / en revisión / supersedido), responsable de emisión y responsable de aprobación. Sin esos metadatos, tener el archivo no garantiza trabajar con la versión correcta.',
      },
      {
        question: '¿Qué software usan las constructoras para controlar planos?',
        answer: 'Las constructoras en México usan desde carpetas en Google Drive (sin control real de versiones) hasta plataformas especializadas como Builtek, que permiten marcar versiones vigentes, registrar metadatos por plano y usar un agente AI para consultar el contenido de los PDFs técnicos sin abrirlos manualmente.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Guía práctica</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Cómo llevar el control de planos<br>
        <span class="text-[#00C2FF]">en una constructora sin perder la cabeza</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Distribuir revisiones por WhatsApp sin control de versiones es la causa silenciosa de más
        retrabajos en obra. Aquí está el sistema que funciona.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>6 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El maestro de obra recibe el plano por WhatsApp. Lo descarga, lo guarda en su teléfono.
        Dos semanas después, el proyectista emite una corrección. El maestro sigue construyendo
        con la versión anterior porque nadie le avisó.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Eso no es un problema del maestro de obra. Es un problema de sistema — o de no tener ninguno.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        El control de planos es una de las tareas más críticas en cualquier proyecto de construcción,
        y también una de las más descuidadas. En proyectos medianos y grandes en México, es común
        ver decenas de versiones del mismo plano circulando en WhatsApp, correo y carpetas de Drive
        sin ningún sistema que indique cuál es la vigente. Las consecuencias: retrabajos, disputas
        con clientes y semanas de retraso en el programa.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El problema de los planos en WhatsApp</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        WhatsApp es cómodo. Es inmediato. Todos lo usan. Por eso se convirtió en el canal de
        distribución de planos por defecto en cientos de constructoras en México. El proyectista
        manda el PDF, el residente lo descarga, lo reenvía al maestro. Parece que funciona — hasta
        que el proyectista emite la revisión siguiente.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        El problema no es el primer plano. Es el cuarto, el quinto, el que tiene la nota de
        revisión crítica en la esquina inferior derecha que nadie vio. Cuando hay múltiples
        revisiones circulando sin un sistema que marque cuál es la vigente, el equipo en campo
        trabaja con lo que tiene a la mano — que no siempre es lo correcto.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">El costo real de este error</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          En proyectos de infraestructura, construir con un plano desactualizado puede significar
          demoler y reconstruir. El costo de un retrabajo de este tipo supera fácilmente lo que
          costaría un sistema de control documental para todo el año.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué necesita un sistema correcto de control de planos</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un sistema de control de planos no es una carpeta en Google Drive con nombre de archivo
        organizado. Es un repositorio con metadatos por documento, historial de versiones y un
        mecanismo que garantiza que el equipo en campo siempre consulte la versión vigente.
        Los metadatos mínimos que debe registrar cada plano son:
      </p>
      <ul class="space-y-2 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Número de plano</strong> — identificador único dentro del proyecto (ej. E-ST-001)</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Disciplina</strong> — arquitectónico, estructural, hidráulico, eléctrico, etc.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Número de revisión</strong> — Rev 0, Rev A, Rev B… con historial completo</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Estado</strong> — vigente, en revisión o supersedido</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Responsable</strong> — quién emitió y quién aprobó la versión vigente</span>
        </li>
      </ul>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El flujo de distribución correcto</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El flujo que funciona en la práctica es el siguiente: el proyectista sube la nueva
        revisión al repositorio central. El sistema marca automáticamente la versión anterior
        como supersedida y notifica al equipo relevante. El personal en campo accede siempre
        al repositorio — no a lo que les llegó al teléfono.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Esto requiere que el repositorio sea accesible desde dispositivos móviles y que el
        equipo esté capacitado para consultar ahí, no en sus chats de WhatsApp. El cambio de
        hábito es la parte más difícil — el sistema es la parte fácil.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Cuándo entra un agente AI al flujo</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Una vez que los planos están organizados en un repositorio central, un agente AI como
        Kota puede agregar otra capa de valor: leer los PDFs técnicos y responder preguntas
        concretas sin que el residente tenga que abrir y revisar manualmente decenas de páginas.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Por ejemplo: "¿Qué armado de losa especifica el plano E-ST-012 en la zona de escalera?"
        Kota lee el documento, encuentra la sección relevante y devuelve la respuesta con número
        de página. No reemplaza al ingeniero estructural — le devuelve una hora de su día. Pero
        esto solo funciona si los planos ya están ordenados. Sin orden previo, la AI tampoco puede ayudarte.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por dónde empezar</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Si estás arrancando un proyecto nuevo, el momento de implementar el sistema de control
        de planos es antes de recibir los primeros documentos. Si ya estás en medio de un
        proyecto con planos dispersos, el primer paso es hacer un inventario: ¿qué disciplinas
        tienen planos activos? ¿Cuántas versiones hay de cada uno? ¿Quién tiene la versión vigente?
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Ese inventario ya es control documental. A partir de ahí, centralizar es cuestión de
        mover los archivos a un repositorio con la estructura correcta y comunicar al equipo
        que ahí — y solo ahí — está la versión oficial.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver el sistema en acción?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos con datos reales de un proyecto activo en México.
          Control de planos, versiones, metadatos y agente AI — todo integrado.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'organizar-documentos-obra',
    category: 'Guía práctica',
    title: 'Cómo organizar los documentos de una obra: la guía para constructoras en México',
    excerpt: 'Tener archivos en Drive, correo y WhatsApp no es lo mismo que tener un sistema documental. Esta es la diferencia y cómo construirlo.',
    readTime: '5 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Cómo organizar los documentos de una obra | Guía para constructoras en México | Builtek',
      description: 'Guía práctica para organizar los documentos de construcción en México: metadatos necesarios, estructura de carpetas, y por qué Drive o Dropbox solos no son suficientes.',
      keywords: 'organizar documentos obra, sistema documental constructora México, carpetas digitales obra, gestión documental construcción México, control versiones documentos obra',
    },
    faqs: [
      {
        question: '¿Cómo organizar los planos de una obra?',
        answer: 'Los planos de obra deben organizarse en un repositorio central con metadatos por documento: disciplina, número de plano, número de revisión, fecha de emisión, estado (vigente/supersedido) y responsable. La estructura de carpetas por disciplina es útil, pero sin metadatos registrados no hay control real de versiones.',
      },
      {
        question: '¿Qué documentos debe tener una constructora por proyecto?',
        answer: 'Por proyecto, una constructora debe gestionar: planos por disciplina (con versiones), especificaciones técnicas, catálogo de conceptos, programa de obra, oficios y correspondencia, RFIs (solicitudes de información), minutas de reunión, reportes de avance y documentos contractuales. Cada uno requiere un sistema de versiones y estados diferente.',
      },
      {
        question: '¿Cuál es la mejor forma de gestionar documentos de construcción?',
        answer: 'La mejor forma es un sistema especializado que registre metadatos por documento (no solo nombre de archivo), permita marcar versiones vigentes, tenga control de acceso por rol y sea accesible desde móvil para el equipo en campo. Google Drive y Dropbox resuelven el almacenamiento pero no el control de versiones ni los metadatos técnicos.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Guía práctica</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Cómo organizar los documentos de una obra:<br>
        <span class="text-[#00C2FF]">la guía para constructoras en México</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Tener archivos en Drive, correo y WhatsApp no es lo mismo que tener un sistema documental.
        Esta es la diferencia — y cómo construirlo.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>5 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        "Está en Drive" no es una respuesta suficiente. La pregunta correcta es:
        ¿cuál versión, con qué estado, aprobada por quién, y quién tiene acceso?
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Esa diferencia entre tener archivos y tener un sistema es la que decide si tu equipo
        trabaja con información confiable o con lo que llegó por WhatsApp.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        Una de las frases más comunes en proyectos de construcción es "yo sí tengo eso organizado".
        Y cuando se indaga, resulta que "organizado" significa una carpeta en Google Drive con
        subcarpetas por fecha o por contratista, archivos con nombres como
        "Planos_FINAL_v3_OK_enviar.pdf" y ningún criterio claro de qué versión es la vigente.
        Tener archivos y tener un sistema son dos cosas completamente distintas.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">La diferencia entre archivos y sistema</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un archivo es un documento almacenado en algún lugar. Un sistema documental es un
        conjunto de reglas, metadatos y flujos que garantizan que cada documento tenga un estado
        claro, una versión vigente marcada, un responsable asignado y un historial de cambios.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        La diferencia práctica: en un sistema, cuando alguien del equipo en campo necesita el
        plano hidráulico de la planta baja, sabe exactamente dónde buscarlo, cuál es la versión
        activa y si está aprobada para construcción. Sin sistema, busca en tres chats de WhatsApp
        y dos carpetas de Drive antes de decidirse por la que "parece más reciente".
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Metadatos mínimos por tipo de documento</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        No todos los documentos de obra requieren los mismos metadatos. Aquí los campos
        mínimos por tipo:
      </p>
      <div class="overflow-x-auto mb-8">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-[#1A2744] text-white">
              <th class="text-left px-4 py-3 font-semibold rounded-tl-xl">Tipo de documento</th>
              <th class="text-left px-4 py-3 font-semibold rounded-tr-xl">Metadatos clave</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-white">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Plano técnico</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Número, disciplina, revisión, estado, emisor, aprobador</td>
            </tr>
            <tr class="bg-slate-50">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Oficio o carta</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Folio, remitente, destinatario, fecha, estado de respuesta</td>
            </tr>
            <tr class="bg-white">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Especificación técnica</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Número, sección, revisión, fecha de vigencia</td>
            </tr>
            <tr class="bg-slate-50">
              <td class="px-4 py-3 text-slate-600 border-b border-slate-100 align-top">Reporte de avance</td>
              <td class="px-4 py-3 text-[#1A2744] font-medium border-b border-slate-100 align-top">Período, frente de obra, responsable, estado de revisión</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por qué Drive y Dropbox solos no alcanzan</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Google Drive y Dropbox son excelentes herramientas de almacenamiento. Resuelven el
        problema de "dónde está el archivo" y permiten que el equipo acceda desde cualquier
        dispositivo. Pero tienen límites importantes para gestión documental de obra:
      </p>
      <ul class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">No permiten marcar una versión como "vigente" — todas las versiones se ven igual en la lista de archivos.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">No tienen campos de metadatos para disciplina, estado o responsable — la información queda en el nombre del archivo.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">No generan alertas cuando un documento cambia de estado o cuando llega una nueva revisión.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">No tienen flujos de aprobación — cualquier persona con acceso puede subir un archivo sin que quede registrado quién lo hizo ni por qué.</span>
        </li>
      </ul>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">El error más común</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          Crear una carpeta de "Vigentes" en Drive y mover archivos manualmente a "Anteriores" cuando llega
          una nueva revisión. Funciona en proyectos pequeños con un solo administrador. En cuanto el equipo
          crece o hay más de un proyecto activo, el sistema colapsa porque nadie recuerda mover los archivos
          o lo hace en momentos diferentes.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">La estructura que funciona</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Un sistema documental efectivo para constructoras tiene tres componentes: un repositorio
        central con metadatos estructurados, un flujo claro de quién puede cambiar el estado de
        un documento y notificaciones automáticas cuando algo cambia.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        No necesitas una herramienta cara ni compleja para lograrlo. Lo que necesitas es
        consistencia: que el equipo use el sistema — no los chats de WhatsApp — como fuente de
        verdad documental. Ese hábito, mantenido desde el primer día, vale más que cualquier
        software.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Listo para tener un sistema real?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Builtek incluye control documental con metadatos, versiones y estados — desde el primer día.
          Sin configuración compleja, sin migración de datos manual.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'alternativa-neodata-mexico',
    category: 'Comparativa',
    title: 'Alternativa a Neodata en México: cuándo tiene sentido cambiar de herramienta',
    excerpt: 'Neodata hace bien lo que hace: presupuesto y costos de obra. El problema es cuando el equipo necesita más que eso y sigue buscando soluciones en hojas de cálculo.',
    readTime: '7 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Alternativa a Neodata en México: cuándo tiene sentido cambiar | Builtek',
      description: 'Comparativa honesta: Neodata es sólido para presupuesto y control de costos. Pero no cubre gestión documental, RFIs, tareas ni lectura automática de planos. Conoce cuándo necesitas algo más.',
      keywords: 'alternativa neodata, alternativa a neodata, software presupuestos construcción México, software gestión obra México, neodata mexico construccion',
    },
    faqs: [
      {
        question: '¿Para qué sirve Neodata en construcción?',
        answer: 'Neodata es una herramienta especializada en presupuestación y control de costos de obra. Permite crear catálogos de conceptos, calcular precios unitarios, gestionar estimaciones y llevar el control de costo presupuestado vs. costo real. Es la herramienta estándar en México para la parte financiera de proyectos de construcción.',
      },
      {
        question: '¿Qué alternativas a Neodata existen en México?',
        answer: 'Depende de qué necesites. Para presupuesto y costos, Opus y Costos y Tiempos son alternativas directas a Neodata. Para gestión documental, control de planos, RFIs y tareas de equipo — que Neodata no cubre — plataformas como Builtek están diseñadas específicamente para equipos de obra en México.',
      },
      {
        question: '¿Builtek reemplaza a Neodata?',
        answer: 'No. Neodata y Builtek resuelven problemas distintos. Neodata es para presupuesto y control de costos. Builtek es para gestión documental, control de planos, RFIs, tareas de equipo y extracción automática de metrados desde PDFs con su agente Kota. Muchos equipos usan ambos: Neodata para los números, Builtek para la operación diaria del proyecto.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Comparativa</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Alternativa a Neodata en México:<br>
        <span class="text-[#00C2FF]">cuándo tiene sentido cambiar de herramienta</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Neodata hace bien lo que hace: presupuesto y costos de obra. El problema es cuando
        el equipo necesita más que eso y sigue buscando soluciones en hojas de cálculo.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>7 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        Neodata lleva décadas siendo el estándar de presupuestación en México. Eso no es un
        accidente — hace bien lo que promete. El problema no es Neodata. El problema es cuando
        los equipos le piden que resuelva cosas que no fue diseñado para resolver.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Esta comparativa no es sobre cuál herramienta es mejor. Es sobre cuándo una sola
        herramienta ya no es suficiente.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        Si buscas "alternativa a Neodata" en México, probablemente tienes una de dos situaciones:
        o presupuesto con una herramienta que se siente anticuada, o tienes Neodata para costos
        pero te faltan piezas para la operación diaria del proyecto. Esas son dos problemas
        distintos y merecen respuestas distintas.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Qué hace Neodata y qué hace bien</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Neodata es una plataforma de presupuestación y control de costos de obra. Sus
        fortalezas son claras: catálogos de conceptos con precios unitarios, cálculo de
        rendimientos, generación de estimaciones y conciliación de avance vs. presupuesto.
        Para constructoras que trabajan con contratos a precio alzado o por conceptos, es
        una herramienta probada con años de uso en el mercado mexicano.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        Muchos despachos y residentes llevan años con Neodata y lo dominan bien. El
        conocimiento acumulado en los equipos, las plantillas propias y la integración con
        los flujos de facturación hacen que cambiarlo tenga un costo real. Reconocer eso
        es parte de una comparativa honesta.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Lo que Neodata no cubre</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El problema aparece cuando el equipo necesita gestionar la operación diaria del
        proyecto — y Neodata no fue diseñado para eso. Las brechas más frecuentes son:
      </p>
      <ul class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Control documental</strong> — Neodata no gestiona versiones de planos, estados de documentos ni historial de revisiones.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">RFIs y oficios</strong> — las solicitudes de información y la correspondencia técnica no tienen un módulo nativo en Neodata.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Tareas del equipo</strong> — asignación de tareas, responsables, fechas de compromiso y seguimiento de estado no son funciones de Neodata.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Lectura automática de planos</strong> — el metrado sigue siendo un proceso manual en Neodata, lo que consume horas de trabajo por licitación.</span>
        </li>
      </ul>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">El costo del metrado manual</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          Preparar el metrado de una licitación mediana puede tomar entre 2 y 5 días de trabajo
          de un estimador. Ese proceso — leer el plano, identificar elementos, calcular cantidades
          y capturarlas en Neodata — es el cuello de botella más costoso de la fase de licitación
          en la mayoría de las constructoras en México.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Dónde entra Kota: extracción automática de metrados</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Kota es el agente AI de Builtek especializado en documentación técnica de construcción.
        Su función más relevante para equipos que usan Neodata es la extracción automática de
        metrados: sube el plano PDF, Kota lee el documento, identifica los elementos y devuelve
        las cantidades con el nivel de detalle necesario para capturarlas en el catálogo de conceptos.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Esto no reemplaza el criterio del estimador — quien valida y ajusta sigue siendo el
        profesional. Pero eliminar la parte mecánica del proceso (leer, identificar, medir,
        capturar) reduce el tiempo de metrado de días a horas.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        El flujo resultante: Kota extrae el metrado del plano PDF, el estimador valida y
        ajusta, y las cantidades finales se capturan en Neodata. Dos herramientas para dos
        etapas distintas del mismo proceso.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Cuándo tiene sentido buscar una alternativa?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Tiene sentido considerar cambiar o complementar Neodata cuando el equipo experimenta
        alguna de estas situaciones con frecuencia:
      </p>
      <ol class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <span class="leading-relaxed">Los planos y especificaciones viven en carpetas de Drive sin control de versiones real.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <span class="leading-relaxed">Los RFIs y la correspondencia técnica se gestionan por correo sin registro centralizado.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <span class="leading-relaxed">El seguimiento de tareas del equipo de obra se hace en WhatsApp o en una hoja de Excel separada.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-6 h-6 rounded-full bg-[#00C2FF] text-[#0D1729] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
          <span class="leading-relaxed">El metrado de licitaciones tarda varios días porque todo el proceso es manual.</span>
        </li>
      </ol>
      <p class="text-slate-600 leading-relaxed mb-8">
        Si reconoces dos o más de estas situaciones, el problema no es Neodata — es que
        Neodata cubre la parte financiera, pero la operación diaria del proyecto no tiene
        soporte. Ahí es donde tiene sentido sumar una herramienta complementaria.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver la diferencia en práctica?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos: control documental, RFIs, tareas y Kota extrayendo metrados de un plano real.
          Sin compromisos.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'rfi-construccion-mexico',
    category: 'Guía práctica',
    title: 'RFI en construcción: qué es, cómo gestionarlo y por qué no puedes ignorarlos',
    excerpt: 'Un RFI sin respuesta documentada puede detener frentes completos de obra y derivar en reclamaciones contractuales. Esta es la guía completa sobre cómo gestionarlos correctamente.',
    readTime: '6 min',
    date: 'Nov 2026',
    metadata: {
      title: 'RFI en construcción: qué es y cómo gestionarlo | Builtek',
      description: 'Guía completa sobre el RFI (Request for Information) en construcción: qué es, cuándo se emite, flujo de respuesta y consecuencias de no documentarlos. Con ejemplo en obra de infraestructura.',
      keywords: 'RFI construcción México, solicitud de información obra, gestión RFIs constructora, que es un RFI en construcción, formato RFI obra',
    },
    faqs: [
      {
        question: '¿Qué significa RFI en construcción?',
        answer: 'RFI significa Request for Information (Solicitud de Información). Es un documento formal que emite el contratista o residente de obra cuando encuentra una ambigüedad, contradicción o información faltante en los planos o especificaciones del proyecto. El proyectista o supervisor responde por escrito, y esa respuesta pasa a formar parte del expediente contractual del proyecto.',
      },
      {
        question: '¿Cómo se llena un formato de RFI en obra?',
        answer: 'Un formato de RFI debe incluir: número de RFI (consecutivo por proyecto), fecha de emisión, nombre del proyecto y contrato, descripción detallada de la pregunta o ambigüedad con referencia al plano o especificación específica, propuesta de solución (opcional), disciplina afectada, impacto potencial en programa y costo, y firma del emisor. La respuesta del proyectista se adjunta al mismo documento.',
      },
      {
        question: '¿Cuánto tiempo tiene el proyectista para responder un RFI?',
        answer: 'El plazo de respuesta de un RFI debe quedar establecido en el contrato. En proyectos de infraestructura en México con clientes como CFE o SCT, el plazo estándar es de 5 a 14 días hábiles dependiendo de la complejidad. Si el proyectista no responde en el plazo acordado, el contratista puede documentar el retraso como una justificación de extensión de programa.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Guía práctica</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        RFI en construcción: qué es,<br>
        <span class="text-[#00C2FF]">cómo gestionarlo y por qué no puedes ignorarlos</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Un RFI sin respuesta documentada puede detener frentes completos de obra y derivar
        en reclamaciones contractuales. Esta es la guía completa.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>6 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El residente encuentra una contradicción entre el plano estructural y la especificación
        técnica. Decide por su cuenta cómo resolverla y sigue con la obra. Tres meses después,
        la supervisión observa la desviación. No hay RFI documentado. No hay respuesta por escrito.
        El contratista no puede demostrar que notificó el problema.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        Ese escenario se repite en obras de todo tamaño en México. La solución es simple pero
        requiere disciplina: documentar cada RFI desde el primer día.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        En proyectos de construcción, los planos y especificaciones rara vez están completos
        y sin ambigüedades desde el inicio. Las preguntas surgen en campo: ¿este detalle aplica
        también en esta zona? ¿Qué especificación prevalece cuando hay contradicción entre el
        plano arquitectónico y el estructural? ¿Cómo se resuelve este empalme que el plano no
        detalla? Para eso existe el RFI.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Qué es un RFI?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        RFI significa Request for Information (Solicitud de Información). Es un documento formal
        que emite el contratista o residente de obra cuando encuentra una ambigüedad, contradicción
        o información faltante en la documentación del proyecto. No es una queja ni una reclamación
        — es una pregunta técnica formal que requiere respuesta escrita por parte del proyectista
        o supervisor.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        La palabra clave es "formal". Una pregunta por WhatsApp al arquitecto no es un RFI.
        Una llamada telefónica tampoco. El RFI existe como documento porque su respuesta pasa
        a formar parte del expediente contractual del proyecto.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">¿Cuándo se emite un RFI?</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Los casos más frecuentes que justifican un RFI son:
      </p>
      <ul class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Contradicción entre dos planos de distinta disciplina (ej. el trazo arquitectónico y el hidráulico no coinciden).</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Información faltante o insuficiente en plano o especificación para ejecutar un elemento.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Condición de campo diferente a lo que muestra el plano (ej. interferencia no prevista con instalaciones existentes).</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Solicitud de aclaración sobre una especificación de material que admite más de una interpretación.</span>
        </li>
      </ul>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Quién lo redacta y quién responde</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        El RFI lo redacta el contratista — generalmente el residente de obra o el superintendente.
        La respuesta la da el proyectista responsable de la disciplina afectada (arquitecto,
        calculista, ingeniero de instalaciones), con revisión de la supervisión de obra si la
        tiene el proyecto.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        En proyectos con supervisión externa (común en contratos con dependencias de gobierno
        como CFE, SEDENA o SCT), el RFI pasa primero por la supervisión antes de llegar al
        proyectista. El flujo puede tener más pasos, pero el principio es el mismo: pregunta
        formal, respuesta formal, todo documentado.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Ejemplo concreto: obra de infraestructura</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        En un proyecto de construcción de un puente vehicular, el residente detecta que el
        plano de cimentación especifica pilotes de 40 cm de diámetro pero el estudio de mecánica
        de suelos que viene como anexo del contrato indica que el estrato portante está 3 metros
        más profundo que lo indicado en el plano.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        El residente emite un RFI al calculista estructural describiendo la discrepancia, adjunta
        el extracto del estudio de mecánica de suelos y pregunta: ¿se modifica la longitud de
        pilotes o se acepta el estrato encontrado? Mientras no hay respuesta, esa actividad
        queda detenida — y ese paro está documentado como causa externa.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">Por qué esto protege al contratista</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          Si el residente hubiese decidido por su cuenta cómo resolver la discrepancia —
          sin RFI, sin respuesta escrita — y la solución resultara incorrecta, la responsabilidad
          sería completamente del contratista. Con el RFI documentado, la decisión recae en el
          proyectista. Esa diferencia puede valer millones en una reclamación contractual.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Las consecuencias de no documentar los RFIs</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Los equipos que gestionan RFIs de manera informal — por WhatsApp o teléfono —
        acumulan un riesgo contractual que no se hace visible hasta que algo sale mal.
        Las consecuencias más comunes son:
      </p>
      <ul class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Imposibilidad de justificar retrasos en programa causados por espera de información del proyectista.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Falta de respaldo documental para reclamar costos adicionales por cambios en alcance originados en ambigüedades del proyecto.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed">Responsabilidad legal por decisiones técnicas tomadas sin autorización escrita del proyectista.</span>
        </li>
      </ul>
      <p class="text-slate-600 leading-relaxed mb-8">
        Un sistema de gestión de RFIs no es burocracia innecesaria. Es el registro que
        convierte una pregunta de WhatsApp en un documento contractual. La diferencia entre
        un equipo que gestiona RFIs formalmente y uno que no lo hace no se nota en las
        primeras semanas de obra — se nota cuando hay una reclamación.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Tu equipo tiene un registro de RFIs?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Builtek incluye un módulo de RFIs y oficios con folio, estado y trazabilidad completa.
          Solicita una demo y ve cómo funciona con un proyecto real.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    slug: 'software-tareas-obra-civil',
    category: 'Análisis',
    title: 'Software de tareas para obra civil: por qué Excel ya no alcanza',
    excerpt: 'Trello, Notion y Excel fallan para equipos de obra porque no hablan el idioma del proyecto: frentes, responsables, vinculación a documentos y fechas de compromiso reales.',
    readTime: '5 min',
    date: 'Nov 2026',
    metadata: {
      title: 'Software de tareas para obra civil: por qué Excel ya no alcanza | Builtek',
      description: 'Análisis de por qué Trello, Notion y Excel fallan para gestionar tareas en proyectos de obra civil. Qué debe tener una herramienta específica para constructoras en México.',
      keywords: 'software tareas obra civil, gestión tareas construcción, asignación tareas obra México, app gestión proyectos constructora, software obra civil mexico',
    },
    faqs: [
      {
        question: '¿Qué software usan las constructoras para gestionar tareas?',
        answer: 'La mayoría de constructoras en México todavía gestiona tareas en Excel o WhatsApp. Las más avanzadas han probado Trello, Asana o Notion, pero estas herramientas genéricas no contemplan conceptos de obra como frentes, disciplinas, vinculación a planos o la dinámica de equipos en campo. Plataformas especializadas como Builtek están diseñadas con esos contextos desde el inicio.',
      },
      {
        question: '¿Por qué no funciona Trello en proyectos de obra civil?',
        answer: 'Trello no tiene campos nativos para frente de obra, disciplina, o vinculación a documentos técnicos. Sus columnas y tarjetas funcionan bien para equipos de producto o marketing, pero los equipos de construcción necesitan filtrar tareas por frente, por responsable en campo, por estado de la tarea vinculada a un plano. Sin esa estructura, Trello se convierte en otra herramienta que el equipo deja de actualizar después de dos semanas.',
      },
      {
        question: '¿Cómo asignar tareas en una constructora con múltiples frentes?',
        answer: 'La asignación de tareas en proyectos con múltiples frentes requiere que cada tarea tenga al menos: frente de obra, responsable específico (no solo "el residente"), fecha de compromiso, estado claro (pendiente / en progreso / completada / bloqueada) y vinculación al documento o plano de referencia. Sin esa estructura, las tareas de un frente se mezclan con las de otro y el seguimiento se pierde.',
      },
    ],
    htmlContent: `<div class="min-h-screen bg-[#fafaf8]">
  <div class="bg-[#0D1729] text-white">
    <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#00C2FF] rounded-lg flex items-center justify-center">
          <span class="text-[#0D1729] text-xs font-bold">B</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">Builtek</span>
      </a>
      <a href="/blog" class="text-white/50 hover:text-white text-sm transition-colors">← Blog</a>
    </div>
    <div class="max-w-4xl mx-auto px-6 pb-16 pt-8">
      <div class="inline-flex items-center gap-2 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-full px-3 py-1 mb-6">
        <span class="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Builtek Blog · Análisis</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">
        Software de tareas para obra civil:<br>
        <span class="text-[#00C2FF]">por qué Excel ya no alcanza</span>
      </h1>
      <p class="text-white/50 text-lg leading-relaxed max-w-2xl font-light">
        Trello, Notion y Excel fallan para equipos de obra porque no hablan el idioma del
        proyecto: frentes, responsables, vinculación a documentos y fechas de compromiso reales.
      </p>
      <div class="flex items-center gap-4 mt-6 text-white/30 text-sm font-light">
        <span>Builtek · 2026</span>
        <span>·</span>
        <span>5 min de lectura</span>
      </div>
    </div>
  </div>
  <article class="max-w-3xl mx-auto px-6 py-14">
    <div class="bg-[#1A2744] text-white rounded-2xl p-8 mb-12">
      <p class="text-lg leading-relaxed font-light">
        El director de proyecto abre el Excel de tareas de la semana. Hay 47 filas.
        No sabe cuáles están bloqueadas esperando información del proyectista, cuáles las
        paró el residente del Frente 2 porque falta material y cuáles simplemente nadie actualizó.
      </p>
      <p class="text-white/50 text-base leading-relaxed font-light mt-4">
        El problema no es la cantidad de tareas. Es que el Excel no tiene el contexto de obra
        necesario para que esa información sea útil.
      </p>
    </div>
    <div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed mb-8">
        La gestión de tareas en proyectos de construcción es uno de los puntos donde más
        se improvisa. La mayoría de los equipos usa una combinación de WhatsApp, Excel y
        reuniones semanales. Cuando el proyecto es pequeño y el equipo es de 4 personas,
        eso funciona. Cuando hay 3 frentes activos, 12 personas en campo y 40 tareas en
        curso simultáneo, esa misma combinación colapsa.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Por qué Trello y Notion no funcionan para obra</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Trello y Notion son herramientas excelentes para equipos de producto, diseño o
        marketing. El modelo de tarjetas en columnas es intuitivo y flexible. El problema
        es que fueron diseñadas sin ningún concepto de obra: no existe "frente", no existe
        "disciplina", no existe vinculación nativa a un plano o especificación técnica.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        Cuando un residente crea una tarea en Trello, no puede indicar que corresponde al
        Frente 3, que está bloqueada por un RFI pendiente de respuesta, o que el plano de
        referencia es la revisión B del documento E-ST-007. Puede escribirlo en el texto de
        la tarjeta — pero eso convierte el seguimiento en una búsqueda de texto libre que
        nadie tiene tiempo de hacer.
      </p>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p class="text-amber-800 text-sm font-semibold mb-1">El patrón que se repite</p>
        <p class="text-amber-700 text-sm leading-relaxed">
          El equipo adopta Trello con entusiasmo las primeras dos semanas. Luego las tarjetas
          se desactualizan porque actualizarlas requiere más trabajo que mandar un mensaje de
          WhatsApp. A la semana cuatro, el director de proyecto sigue preguntando el estado
          de las tareas en la junta semanal porque no confía en lo que ve en la herramienta.
        </p>
      </div>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Lo que necesita una herramienta de tareas para obra</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Una herramienta de gestión de tareas diseñada para equipos de construcción necesita,
        como mínimo, los siguientes campos nativos:
      </p>
      <ul class="space-y-3 mb-8 list-none">
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Responsable específico</strong> — no solo un nombre genérico, sino el rol y frente asignado dentro del proyecto.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Frente de obra</strong> — para filtrar y ver solo las tareas del frente que me corresponde supervisar.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Vinculación a documentos</strong> — la tarea debe poder apuntar al plano o especificación de referencia directamente.</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Estado con causa</strong> — no solo "bloqueada", sino "bloqueada por RFI #12" o "bloqueada por falta de material".</span>
        </li>
        <li class="flex items-start gap-3 text-slate-600">
          <span class="w-2 h-2 rounded-full bg-[#00C2FF] flex-shrink-0 mt-2"></span>
          <span class="leading-relaxed"><strong class="text-[#1A2744]">Fecha de compromiso real</strong> — distinta de la fecha de creación y con seguimiento de si se cumplió o no.</span>
        </li>
      </ul>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">El costo de la improvisación en gestión de tareas</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        La falta de un sistema de tareas adecuado tiene un costo que no siempre es visible
        en el día a día pero que se acumula: tareas duplicadas porque dos personas asumieron
        que la otra lo estaba haciendo, actividades que se retrasan porque nadie registró que
        estaban bloqueadas, y directores de proyecto que pasan más tiempo en juntas de
        seguimiento que tomando decisiones porque el estado de las tareas no es confiable.
      </p>
      <p class="text-slate-600 leading-relaxed mb-4">
        En proyectos con programa de obra comprometido — contratos con penalizaciones por
        retraso, por ejemplo — ese costo de improvisación se convierte directamente en
        pesos perdidos. No porque falte personal, sino porque la información no fluye de
        manera que permita anticipar los bloqueos antes de que afecten el programa.
      </p>
      <h2 class="text-2xl font-bold text-[#1A2744] mb-4">Cuándo tiene sentido cambiar de herramienta</h2>
      <p class="text-slate-600 leading-relaxed mb-4">
        Si tu equipo tiene más de 10 personas activas en campo, más de un frente de obra o
        más de 20 tareas en curso simultáneo, el Excel y el WhatsApp ya no son suficientes.
        El indicador más claro: si el director de proyecto necesita preguntar el estado de
        las tareas en cada junta en lugar de consultarlo en el sistema, el sistema no está
        funcionando.
      </p>
      <p class="text-slate-600 leading-relaxed mb-8">
        El cambio de herramienta no requiere una migración masiva ni capacitación de semanas.
        Lo que requiere es un sistema que el equipo en campo pueda actualizar desde el celular
        en 30 segundos — y que el director de proyecto confíe en lo que ve sin tener que validarlo
        en cada junta.
      </p>
      <div class="bg-gradient-to-br from-[#0D1729] to-[#1A2744] rounded-2xl p-8 text-center">
        <h3 class="text-white text-2xl font-bold mb-3">¿Quieres ver cómo se ven las tareas de obra en Builtek?</h3>
        <p class="text-white/50 text-sm leading-relaxed mb-6 max-w-md mx-auto font-light">
          Demo de 20 minutos: módulo de tareas con frentes, responsables, estados y vinculación
          a documentos — todo integrado con el control documental del proyecto.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/demo" class="inline-flex items-center gap-2 bg-[#00C2FF] text-[#0D1729] px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors">
            Solicitar demo gratuita →
          </a>
          <a href="/register" class="inline-flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-6 py-3 rounded-xl text-sm font-normal transition-colors">
            Crear cuenta gratis
          </a>
        </div>
      </div>
      <p class="text-slate-400 text-xs text-center mt-8">
        Builtek es desarrollado por Ingenium Analytics, empresa mexicana con sede en Querétaro.<br>
        ¿Tienes preguntas? Escríbenos a hola@menvio.app
      </p>
    </div>
  </article>
  <div class="border-t border-slate-200 py-8 px-6">
    <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-light">
      <span>© 2026 Builtek · INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
      <div class="flex items-center gap-4">
        <a href="/" class="hover:text-slate-600 transition-colors">Inicio</a>
        <a href="/blog" class="hover:text-slate-600 transition-colors">Blog</a>
        <a href="/#precios" class="hover:text-slate-600 transition-colors">Precios</a>
        <a href="/privacy" class="hover:text-slate-600 transition-colors">Privacidad</a>
      </div>
    </div>
  </div>
</div>`,
  },
]
