import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | Builtek',
  description: 'Aviso de Privacidad Integral de Builtek conforme a la LFPDPPP.',
}

const SECTIONS = [
  { id: 'responsable',    label: 'Responsable' },
  { id: 'datos',          label: 'Datos que recopilamos' },
  { id: 'finalidades',    label: 'Finalidades' },
  { id: 'base-legal',     label: 'Base legal' },
  { id: 'procesadores',   label: 'Procesadores' },
  { id: 'retencion',      label: 'Retención' },
  { id: 'arco',           label: 'Derechos ARCO' },
  { id: 'cookies',        label: 'Cookies' },
  { id: 'transferencias', label: 'Transferencias' },
  { id: 'cambios',        label: 'Cambios al aviso' },
  { id: 'contacto',       label: 'Contacto' },
  { id: 'inai',           label: 'Autoridad competente' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <h2 className="text-lg font-bold text-[#1A2744] mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 my-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-slate-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]" style={{ scrollBehavior: 'smooth' }}>

      {/* Hero */}
      <div className="bg-[#1A2744] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors mb-8">
            ← Volver a builtek.app
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold">Builtek</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Aviso de Privacidad Integral</h1>
          <p className="text-white/60 text-sm max-w-xl leading-relaxed">
            Builtek está comprometido con la protección de tus datos personales conforme a la
            Ley Federal de Protección de Datos Personales en Posesión de los Particulares
            (LFPDPPP) y la Ley Federal de Protección al Consumidor (art. 76 bis).
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00C2FF]/20 text-[#00C2FF]">LFPDPPP</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300">GDPR Art. 13</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/60">LFPC Art. 76 bis</span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/50">Versión 1.0 · 27/09/2026</span>
          </div>
        </div>
      </div>

      {/* Provider info bar — LFPC Art. 76 bis */}
      <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-500 font-medium mb-1">
            Datos del proveedor (art. 76 bis LFPC — obligatorio en comercio electrónico)
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
            <span><strong>Razón social:</strong> INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
            <span><strong>Domicilio:</strong> Av. Armando Birlaing Shaf 2001, Int. 7-A, Col. Centro Sur, C.P. 76090, Querétaro, Qro.</span>
            <span><strong>Teléfono:</strong> +52 442 281 8834</span>
            <span><strong>Correo:</strong> hola@builtek.app</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 flex gap-12">

        {/* ToC (sticky desktop) */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Contenido</p>
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block w-full text-left text-xs text-slate-500 hover:text-[#00C2FF] py-1 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <main className="flex-1 min-w-0">

          {/* 1 · Responsable */}
          <Section id="responsable" title="1. Identidad del Responsable">
            <p>
              El responsable del tratamiento de sus datos personales es{' '}
              <strong className="text-[#1A2744]">INGENIUM ANALYTICS, S. de R.L. de C.V.</strong>,
              que opera la plataforma bajo el nombre comercial <strong className="text-[#1A2744]">Builtek</strong>,
              con RFC <strong className="text-[#1A2744]">IAN210415CX5</strong>, con domicilio fiscal en{' '}
              <strong className="text-[#1A2744]">
                Av. Armando Birlaing Shaf 2001, Int. 7-A, Col. Centro Sur,
                C.P. 76090, Querétaro, Querétaro, México
              </strong>.
            </p>
            <p>
              Para cualquier asunto relacionado con este Aviso o con el ejercicio de sus derechos,
              puede contactarnos en:{' '}
              <a href="mailto:hola@builtek.app" className="text-[#00C2FF] underline">
                hola@builtek.app
              </a>
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
              <strong className="text-slate-700">Builtek</strong> es una plataforma SaaS de gestión de proyectos de construcción
              para la industria AEC (Arquitectura, Ingeniería, Construcción). Permite a equipos de obra gestionar tareas,
              controlar documentación técnica, colaborar en planos PDF y usar inteligencia artificial para extracción
              de cuantificaciones.
            </div>
          </Section>

          {/* 2 · Datos */}
          <Section id="datos" title="2. Datos Personales que Recopilamos">
            <p>Recopilamos los siguientes datos personales de los usuarios de la plataforma:</p>

            <p className="font-semibold text-[#1A2744] mt-4">A) Datos de cuenta</p>
            <Table
              headers={['Categoría', 'Dato específico', 'Fuente']}
              rows={[
                ['Identidad', 'Nombre completo', 'Registro voluntario'],
                ['Contacto', 'Correo electrónico', 'Registro voluntario'],
                ['Seguridad', 'Contraseña (almacenada con hash bcrypt, nunca en texto plano)', 'Registro voluntario'],
                ['Perfil', 'Foto de perfil (opcional), número de teléfono (opcional)', 'Perfil de usuario'],
                ['Técnicos', 'Dirección IP, navegador, sistema operativo, timestamps de sesión', 'Automático'],
              ]}
            />

            <p className="font-semibold text-[#1A2744] mt-4">B) Datos generados por el uso de la plataforma</p>
            <Table
              headers={['Categoría', 'Dato específico', 'Fuente']}
              rows={[
                ['Proyectos', 'Nombre, descripción, fechas, estado, miembros del proyecto', 'Uso de la plataforma'],
                ['Tareas', 'Título, especialidad, asignado, estado, comentarios, fechas límite', 'Uso de la plataforma'],
                ['Documentos', 'Archivos PDF y DWG subidos, versiones, metadatos, estado de aprobación, autor/empresa', 'Subida voluntaria'],
                ['Drive', 'Archivos compartidos, carpetas, links públicos generados, logs de acceso', 'Uso de la plataforma'],
                ['Comunicaciones', 'Oficios de entrada/salida (texto + PDFs adjuntos)', 'Módulo Oficios (Contractor+)'],
                ['Extracciones AI', 'Contenido de PDFs procesados por el Agente AI (planos de construcción)', 'Función AI opcional'],
                ['Actividad', 'Logs de acciones (quién subió qué, cuándo, desde dónde)', 'Automático'],
              ]}
            />
            <p className="text-xs text-slate-400 mt-2">
              Los archivos técnicos (planos, especificaciones, oficios) son tratados como datos confidenciales del cliente.
              Builtek los usa únicamente para prestar el servicio contratado.
            </p>
          </Section>

          {/* 3 · Finalidades */}
          <Section id="finalidades" title="3. Finalidades del Tratamiento">
            <p>
              Sus datos son tratados para las siguientes finalidades. Las <strong>primarias</strong> son
              necesarias para la prestación del servicio; las <strong>secundarias</strong> son opcionales.
            </p>
            <Table
              headers={['Finalidad', 'Tipo']}
              rows={[
                ['Creación y autenticación de cuenta en la plataforma', 'Primaria'],
                ['Gestión de workspaces, proyectos, tareas y documentos', 'Primaria'],
                ['Almacenamiento y servicio de archivos técnicos (PDFs, DWGs)', 'Primaria'],
                ['Procesamiento de documentos mediante Agente AI (cuando el usuario lo activa)', 'Primaria'],
                ['Control de acceso basado en roles (Owner, Admin, Manager, Engineer, Viewer)', 'Primaria'],
                ['Envío de invitaciones por correo electrónico a colaboradores', 'Primaria'],
                ['Notificaciones de servicio (alertas de cuenta, cambios de estado)', 'Primaria'],
                ['Soporte técnico y resolución de incidencias', 'Primaria'],
                ['Cumplimiento de obligaciones legales y fiscales', 'Primaria'],
                ['Mejora del producto mediante análisis de uso agregado y anonimizado', 'Secundaria'],
                ['Comunicaciones comerciales de Builtek (nuevas funciones, actualizaciones)', 'Secundaria'],
              ]}
            />
            <p>
              Si no desea que sus datos sean utilizados para finalidades secundarias, puede
              comunicarlo en cualquier momento a{' '}
              <a href="mailto:hola@builtek.app" className="text-[#00C2FF] underline">hola@builtek.app</a>.
            </p>
          </Section>

          {/* 4 · Base legal */}
          <Section id="base-legal" title="4. Base Legal del Tratamiento">
            <Table
              headers={['Tratamiento', 'Base legal (LFPDPPP / GDPR)']}
              rows={[
                ['Creación de cuenta y prestación del servicio', 'Ejecución del contrato (Art. 6.1.b GDPR · Art. 8 LFPDPPP)'],
                ['Almacenamiento de archivos técnicos del cliente', 'Ejecución del contrato'],
                ['Procesamiento AI de documentos', 'Consentimiento explícito al activar la función'],
                ['Invitaciones y gestión de equipo', 'Ejecución del contrato + consentimiento del invitado'],
                ['Analytics de uso y mejora del servicio', 'Interés legítimo (Art. 6.1.f GDPR)'],
                ['Conservación de registros de actividad', 'Obligación legal + interés legítimo'],
                ['Comunicaciones comerciales', 'Consentimiento (puede revocarse en cualquier momento)'],
              ]}
            />
          </Section>

          {/* 5 · Procesadores */}
          <Section id="procesadores" title="5. Procesadores de Datos (Encargados del Tratamiento)">
            <p>
              Builtek comparte datos con los siguientes proveedores tecnológicos que actúan como
              encargados del tratamiento. Todos están sujetos a acuerdos de procesamiento de datos (DPA)
              y no pueden usar sus datos para fines propios.
            </p>
            <Table
              headers={['Procesador', 'Función', 'Datos compartidos', 'Jurisdicción']}
              rows={[
                [
                  'Supabase',
                  'Autenticación (Auth) y base de datos (PostgreSQL)',
                  'Datos de cuenta, proyectos, tareas, documentos, metadatos, logs',
                  'EE.UU. / UE',
                ],
                [
                  'Cloudflare R2',
                  'Almacenamiento de archivos (PDFs, DWGs, imágenes)',
                  'Archivos técnicos subidos por los usuarios',
                  'EE.UU. / Global',
                ],
                [
                  'Railway',
                  'Infraestructura cloud (servidor de la aplicación)',
                  'Todo el tráfico de la aplicación (cifrado en tránsito)',
                  'EE.UU.',
                ],
                [
                  'Google (Gemini API)',
                  'Extracción de cuantificación en planos PDF (Agente AI)',
                  'Contenido de PDFs subidos para análisis, solo cuando el usuario activa el Agente AI',
                  'EE.UU.',
                ],
                [
                  'Anthropic (Claude API)',
                  'Análisis de documentos técnicos (Agente AI)',
                  'Contenido de PDFs subidos para análisis, solo cuando el usuario activa el Agente AI',
                  'EE.UU.',
                ],
              ]}
            />
            <p className="text-xs text-slate-400">
              Builtek no vende ni renta datos personales a terceros. Los archivos técnicos subidos
              a la plataforma (planos, especificaciones) son propiedad exclusiva del cliente y no son
              usados para entrenar modelos de IA.
            </p>
          </Section>

          {/* 6 · Retención */}
          <Section id="retencion" title="6. Plazos de Retención de Datos">
            <Table
              headers={['Categoría de dato', 'Plazo de retención', 'Justificación']}
              rows={[
                ['Datos de cuenta activa', 'Mientras la cuenta esté activa', 'Necesario para prestar el servicio'],
                ['Proyectos, tareas y documentos', 'Mientras la cuenta esté activa + 30 días tras cancelación', 'LFPDPPP Art. 11 (minimización)'],
                ['Archivos técnicos (PDFs, DWGs)', 'Mientras la cuenta esté activa + 30 días tras cancelación', 'Propiedad del cliente'],
                ['Datos de cuentas canceladas', '30 días (eliminación segura tras cancelación)', 'Principio de minimización'],
                ['Registros de actividad (logs)', '90 días (logs de acceso) · 1 año (logs de seguridad)', 'Seguridad informática'],
                ['Registros de facturación', '7 años', 'SAT (obligación fiscal México)'],
              ]}
            />
            <p>
              Al cancelar su cuenta, dispone de un período de 30 días para exportar sus datos antes
              de que sean eliminados de forma permanente. Transcurrido ese plazo, los datos se eliminan
              o anonimizan de forma irreversible, salvo los registros fiscales que la ley obliga a conservar.
            </p>
          </Section>

          {/* 7 · ARCO */}
          <Section id="arco" title="7. Derechos ARCO">
            <p>
              Conforme a la LFPDPPP, usted tiene derecho a <strong>Acceder</strong>,{' '}
              <strong>Rectificar</strong>, <strong>Cancelar</strong> y{' '}
              <strong>Oponerse</strong> al tratamiento de sus datos personales:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-4">
              {[
                {
                  right: 'A · Acceso',
                  color: 'bg-blue-50 border-blue-200',
                  titleColor: 'text-blue-700',
                  desc: 'Solicitar qué datos personales tenemos sobre usted, para qué finalidad los usamos y a quiénes los hemos comunicado.',
                },
                {
                  right: 'R · Rectificación',
                  color: 'bg-green-50 border-green-200',
                  titleColor: 'text-green-700',
                  desc: 'Corregir datos incorrectos, incompletos o desactualizados. Ejemplo: cambio de correo electrónico o nombre.',
                },
                {
                  right: 'C · Cancelación',
                  color: 'bg-amber-50 border-amber-200',
                  titleColor: 'text-amber-700',
                  desc: 'Solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad con que fueron recabados.',
                },
                {
                  right: 'O · Oposición',
                  color: 'bg-red-50 border-red-200',
                  titleColor: 'text-red-700',
                  desc: 'Oponerse al tratamiento de sus datos para finalidades secundarias (ej: comunicaciones comerciales) sin afectar el uso del servicio.',
                },
              ].map(item => (
                <div key={item.right} className={`rounded-xl border p-4 ${item.color}`}>
                  <p className={`font-bold text-sm mb-1 ${item.titleColor}`}>{item.right}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="font-semibold text-[#1A2744]">¿Cómo ejercer sus derechos?</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
              <li>Envíe un correo a <a href="mailto:hola@builtek.app" className="text-[#00C2FF] underline">hola@builtek.app</a> con el asunto <em>"Solicitud ARCO"</em>.</li>
              <li>Indique: nombre completo, correo electrónico asociado y descripción del derecho que desea ejercer.</li>
              <li>Adjunte una identificación oficial vigente para acreditar su identidad.</li>
              <li>Recibirá respuesta en un plazo máximo de <strong>20 días hábiles</strong>.</li>
              <li>Si procede, la medida se ejecutará dentro de los <strong>15 días hábiles</strong> siguientes.</li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">El ejercicio de los derechos ARCO es gratuito.</p>
          </Section>

          {/* 8 · Cookies */}
          <Section id="cookies" title="8. Cookies y Tecnologías de Seguimiento">
            <Table
              headers={['Cookie / Tecnología', 'Tipo', 'Finalidad', 'Duración']}
              rows={[
                ['Token de sesión (Supabase Auth)', 'Esencial', 'Autenticación del usuario en la plataforma', '7 días'],
                ['localStorage (preferencias UI)', 'Funcional', 'Recordar estado del sidebar, filtros activos, banners descartados', 'Indefinida (local)'],
                ['localStorage (onboarding)', 'Funcional', 'Registrar progreso del onboarding inicial', 'Indefinida (local)'],
              ]}
            />
            <p>
              No usamos cookies de rastreo publicitario ni compartimos datos de comportamiento
              con redes publicitarias. La página pública <em>builtek.app</em> no utiliza cookies de terceros.
            </p>
          </Section>

          {/* 9 · Transferencias */}
          <Section id="transferencias" title="9. Transferencias Internacionales de Datos">
            <p>
              Algunos de nuestros procesadores (Supabase, Cloudflare, Railway, Google, Anthropic) operan
              desde Estados Unidos. Estas transferencias se realizan con las siguientes garantías:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Acuerdos de procesamiento de datos (DPA) con cláusulas contractuales estándar.</li>
              <li>Todos los datos se transmiten cifrados (TLS 1.2+) y se almacenan cifrados en reposo (AES-256).</li>
              <li>Los archivos en Cloudflare R2 tienen egress $0 y no son expuestos a terceros salvo con link autorizado.</li>
              <li>Los modelos AI (Gemini, Claude) no retienen ni usan el contenido de sus documentos para entrenamiento bajo las condiciones de uso API empresarial.</li>
            </ul>
          </Section>

          {/* 10 · Cambios */}
          <Section id="cambios" title="10. Cambios a este Aviso de Privacidad">
            <p>
              Este Aviso puede ser modificado para reflejar cambios en nuestras prácticas,
              en la legislación aplicable o en los servicios que prestamos. Cuando los cambios
              sean materiales:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Notificaremos por correo electrónico a los usuarios registrados con al menos 15 días de anticipación.</li>
              <li>Actualizaremos la versión y fecha en el encabezado de este documento.</li>
              <li>Mostraremos un aviso en la plataforma al iniciar sesión.</li>
            </ul>
            <p>
              El uso continuado de la plataforma tras la notificación constituye aceptación de
              las modificaciones. Si no está de acuerdo, puede cancelar su cuenta y solicitar
              la eliminación de sus datos conforme al derecho de Cancelación (sección 7).
            </p>
          </Section>

          {/* 11 · Contacto */}
          <Section id="contacto" title="11. Contacto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <p className="font-bold text-[#1A2744] mb-3">Responsable de Privacidad — Builtek</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-slate-400 w-32 inline-block">Razón social:</span>
                  <span>INGENIUM ANALYTICS, S. de R.L. de C.V.</span>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">RFC:</span>
                  <span>IAN210415CX5</span>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">Correo:</span>
                  <a href="mailto:hola@builtek.app" className="text-[#00C2FF] underline">hola@builtek.app</a>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">Teléfono:</span>
                  <span>+52 442 281 8834</span>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">Domicilio:</span>
                  <span>Av. Armando Birlaing Shaf 2001, Int. 7-A, Col. Centro Sur, C.P. 76090, Querétaro, Qro.</span>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">Asunto:</span>
                  <span>"Solicitud ARCO" o "Aviso de Privacidad"</span>
                </li>
                <li>
                  <span className="text-slate-400 w-32 inline-block">Respuesta:</span>
                  <span>20 días hábiles máximo</span>
                </li>
              </ul>
            </div>
          </Section>

          {/* 12 · INAI */}
          <Section id="inai" title="12. Autoridad Competente">
            <p>
              Si considera que su derecho a la protección de datos personales ha sido vulnerado,
              puede interponer queja ante el{' '}
              <strong>Instituto Nacional de Transparencia, Acceso a la Información y
              Protección de Datos Personales (INAI)</strong>:
            </p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm space-y-1">
              <p><strong>INAI</strong></p>
              <p>Sitio web: <a href="https://home.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-[#00C2FF] underline">home.inai.org.mx</a></p>
              <p>Sistema de quejas: <a href="https://www.infomex.org.mx" target="_blank" rel="noopener noreferrer" className="text-[#00C2FF] underline">infomex.org.mx</a></p>
              <p className="text-slate-400 text-xs mt-2">
                Le recomendamos primero contactarnos a nosotros para resolver cualquier
                discrepancia antes de acudir al INAI.
              </p>
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-8 text-xs text-slate-400 space-y-1">
            <p><strong>Responsable:</strong> INGENIUM ANALYTICS, S. de R.L. de C.V. · RFC: IAN210415CX5</p>
            <p><strong>Nombre comercial:</strong> Builtek · builtek.app</p>
            <p><strong>Versión:</strong> 1.0</p>
            <p><strong>Última actualización:</strong> 27 de septiembre de 2026</p>
            <p><strong>Vigencia:</strong> Indefinida hasta nueva versión</p>
            <p className="mt-4">
              Este aviso fue elaborado conforme a la LFPDPPP y su Reglamento, los Lineamientos
              del Aviso de Privacidad emitidos por el INAI, el art. 76 bis de la Ley Federal de
              Protección al Consumidor, y las mejores prácticas del GDPR (Art. 13).
            </p>
          </div>

        </main>
      </div>
    </div>
  )
}
