import Link from 'next/link'
import { Layers, Camera, MapPin, Clock, User, MessageCircle, ExternalLink, CheckCircle, Smartphone } from 'lucide-react'

export const metadata = {
  title: 'Bitácora de Obra — Builtek | Registro fotográfico con trazabilidad',
  description: 'Builtek Bitácora: registro fotográfico de avance de obra con trazabilidad completa. Fotos pineadas en planos, envío por WhatsApp y registro automático por fecha.',
}

export default function BitacoraPage() {
  return (
    <div className="min-h-screen bg-[#0D1729]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1729]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#0D1729]" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Builtek</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/precios" className="text-white/50 hover:text-white text-sm transition-colors hidden sm:block">Precios</Link>
            <Link href="/contact" className="text-white/50 hover:text-white text-sm transition-colors hidden sm:block">Contacto</Link>
            <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors">Solicitar demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <Camera className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-wide">Módulo · Bitácora de obra</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            El registro visual<br />de tu obra, con evidencia.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Fotos de avance con trazabilidad completa: quién la tomó, cuándo y en qué punto exacto del plano. El caos del grupo de WhatsApp, convertido en expediente técnico.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold hover:bg-white transition-colors">
              Solicitar demo gratuita →
            </Link>
            <Link href="/precios" className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:border-white/40 transition-colors">
              Ver planes y precios
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Más que fotos — evidencia técnica.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">Cada foto de la Bitácora tiene contexto: autor, fecha, proyecto y ubicación exacta en el plano estructural.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: MapPin,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Fotos pineadas en el plano',
                desc: 'Después de subir una foto, márcala directamente sobre el plano estructural con un pin. Al revisar el plano, ves exactamente qué fotos de avance existen por zona — la ubicación precisa de cada evidencia, sin descripciones ambiguas.',
              },
              {
                icon: Clock,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'Línea de tiempo automática',
                desc: 'Las fotos se organizan por fecha de registro. Puedes ver el progreso de cualquier elemento constructivo semana a semana — desde la cimentación hasta la terminación. La bitácora se escribe sola.',
              },
              {
                icon: User,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'Trazabilidad de autor',
                desc: 'Cada foto registra automáticamente quién la subió. Para entregas, auditorías o reclamaciones, tienes evidencia firmada digitalmente de quién reportó el avance y en qué fecha.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 flex gap-6">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp add-on callout */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-2">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Add-on disponible</span>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Manda fotos por WhatsApp — se guardan solas.</h3>
                <p className="text-white/60 leading-relaxed mb-4">
                  Con un número dedicado de empresa, tu equipo puede enviar fotos de avance directamente por WhatsApp al número de Builtek de tu constructora. Las fotos se registran automáticamente en la Bitácora con la fecha de envío, el remitente y el proyecto correspondiente — sin abrir ninguna app adicional.
                </p>
                <p className="text-white/40 text-sm mb-6">
                  Ideal para equipos en campo que ya viven en WhatsApp. El número dedicado se contrata con Menvio Docs — el servicio de mensajería empresarial de Builtek.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/demo" className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors inline-flex items-center gap-2">
                    Preguntar por este add-on →
                  </Link>
                  <a
                    href="https://www.menvio.app/menvio-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/20 text-white/60 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-white/40 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    Conocer Menvio Docs <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-violet-500/10 to-[#0077FF]/10 border border-violet-500/20 rounded-3xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">¿Quieres ver la Bitácora en acción?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Te mostramos el flujo completo: subir fotos, pinearlas en el plano y revisar la línea de tiempo de avance.
          </p>
          <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition-colors inline-block">
            Solicitar demo gratuita →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <Link href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors">← Volver a Builtek</Link>
      </footer>
    </div>
  )
}
