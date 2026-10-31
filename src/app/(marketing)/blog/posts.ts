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
]
