import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Builtek',
  description: 'Builtek es la plataforma de gestión de proyectos de construcción para AEC en México y LATAM. Conoce nuestra historia, módulos y precios.',
  openGraph: {
    title: 'Sobre Builtek — El OS de la construcción',
    description: 'Conoce Builtek: quiénes somos, qué resolvemos y por qué somos la alternativa ideal para constructoras en México.',
    locale: 'es_MX',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'INGENIUM ANALYTICS, S. de R.L. de C.V.',
  alternateName: 'Builtek',
  url: 'https://builtek.app',
  description: 'Empresa mexicana de software para la industria de la construcción (AEC). Fundada en 2026.',
  foundingDate: '2026',
  foundingLocation: 'México',
  areaServed: ['MX', 'LATAM'],
  sameAs: ['https://builtek.app'],
}

export default function SobreBuiltek() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <main className="min-h-screen bg-[#0D1729] text-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-[#00C2FF] text-sm font-medium uppercase tracking-widest mb-4">Sobre nosotros</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-8">El OS de la construcción</h1>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">El problema</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              La mayoría de las constructoras medianas en México gestionan sus proyectos con Excel, grupos de WhatsApp y PDFs sueltos sin versión. El resultado: planos desactualizados en obra, tareas perdidas en el chat, cuantificaciones hechas a mano con margen de error. Builtek existe para resolver eso.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Qué es Builtek</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Builtek es una plataforma SaaS que integra gestión de proyectos, control documental y AI en una sola herramienta web. Diseñada específicamente para la industria AEC (Arquitectura, Ingeniería, Construcción) en México y LATAM. Precio en MXN, CFDI incluido, soporte en español.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Módulos</h2>
            <ul className="space-y-3 text-gray-300">
              {[
                ['Dashboard', 'KPIs del proyecto en tiempo real'],
                ['Tareas', 'TaskBoard por especialidad, PersonBoard, fechas y prioridades'],
                ['Documentos', 'Control documental con versiones, disciplinas y flujo de aprobación'],
                ['Drive', 'Archivos compartidos con links públicos, QR y trazabilidad'],
                ['Kota AI', 'Agente que lee planos PDF y extrae cuantificación estructural automáticamente'],
                ['Oficios', 'Control de oficios de obra civil (disponible desde plan Pro)'],
                ['Admin', 'Gestión de workspace, equipo, roles e invitaciones'],
              ].map(([mod, desc]) => (
                <li key={mod} className="flex gap-3">
                  <span className="text-[#00C2FF] font-semibold min-w-[100px]">{mod}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Diferenciadores</h2>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>Kota AI extrae cuantificación de planos PDF automáticamente — único en el mercado local</li>
              <li>WhatsApp integrado nativo desde plan Obra — notificaciones y alertas directo al equipo</li>
              <li>Precio en MXN con CFDI en todos los planes pagados</li>
              <li>Módulo de Oficios para obra civil con trazabilidad de documentos</li>
              <li>Trial 14 días con plan Obra completo, sin tarjeta de crédito</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Planes y precios</h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-400">Plan</th>
                    <th className="text-left p-4 text-gray-400">Precio/mes</th>
                    <th className="text-left p-4 text-gray-400">Usuarios</th>
                    <th className="text-left p-4 text-gray-400">Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Starter', '$1,890 MXN', '5', '100 GB'],
                    ['Obra', '$3,790 MXN', '8', '500 GB'],
                    ['Pro', '$8,490 MXN', '15', '3 TB'],
                    ['Contractor', '$12,990 MXN', '30', '5 TB'],
                  ].map(([plan, price, users, storage]) => (
                    <tr key={plan} className="border-b border-white/5">
                      <td className="p-4 text-white font-medium">{plan}</td>
                      <td className="p-4 text-[#00C2FF]">{price}</td>
                      <td className="p-4 text-gray-300">{users}</td>
                      <td className="p-4 text-gray-300">{storage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-sm mt-3">Precios más IVA. CFDI incluido. Trial 14 días con plan Obra completo, sin tarjeta.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">La empresa</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Builtek es un producto de <strong className="text-white">INGENIUM ANALYTICS, S. de R.L. de C.V.</strong>, empresa mexicana de software para la industria de la construcción. Fundada en 2026, con primer cliente en la industria ferroviaria (Frente 12).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contacto</h2>
            <p className="text-gray-300">
              ¿Tienes preguntas sobre Builtek?{' '}
              <a href="https://builtek.app/register" className="text-[#00C2FF] hover:underline">
                Inicia tu trial gratuito
              </a>{' '}
              o escríbenos directamente.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
