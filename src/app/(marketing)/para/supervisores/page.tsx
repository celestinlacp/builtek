import Link from 'next/link'
import { Layers, Eye, FileText, QrCode, Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

export const metadata = {
  title: 'Builtek para Supervisores Externos | Acceso a documentos y avance de obra',
  description: 'Builtek permite a supervisores externos revisar documentos, planos y avance de obra sin necesidad de cuenta interna. Acceso por link o QR.',
}

export default function SupervisoresPage() {
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
          <div className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-full px-4 py-1.5 mb-6">
            <Eye className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Para supervisores externos</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Supervisa sin estar<br />dentro del equipo.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Accede a planos vigentes, avance de obra y documentos con aprobación — sin cuenta interna, sin emails de ida y vuelta, sin versiones desactualizadas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold hover:bg-white transition-colors">
              Solicitar demo gratuita →
            </Link>
            <Link href="/contact" className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:border-white/40 transition-colors">
              Hablar con ventas
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/40 text-center text-sm font-semibold uppercase tracking-widest mb-10">¿Te identificas con esto?</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: AlertTriangle, text: 'Recibes planos por WhatsApp sin saber si son la versión vigente.' },
              { icon: Clock, text: 'Pides actualizaciones por email y esperas días para recibir respuesta.' },
              { icon: FileText, text: 'No tienes acceso al sistema interno del contratista, pero necesitas revisar.' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
                <Icon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-white/60 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Acceso directo. Sin fricciones.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">El equipo interno trabaja en Builtek. Tú accedes solo a lo que te corresponde, sin instalaciones ni cuentas.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: QrCode,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'Acceso por link o código QR',
                desc: 'El equipo te comparte un link o QR con los documentos que necesitas revisar. Lo abres en el navegador — sin registrarte, sin instalar nada. Puedes ver planos en PDF directamente en pantalla.',
              },
              {
                icon: FileText,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'Siempre la versión vigente',
                desc: 'Cada plano en Builtek tiene control de versiones. El link que recibes apunta a la versión aprobada más reciente. Si el equipo actualiza el plano, tú ves la actualización automáticamente — sin que nadie te reenvíe nada.',
              },
              {
                icon: Shield,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Permisos granulares por carpeta',
                desc: 'El equipo controla exactamente qué compartes: solo los documentos de tu frente, solo los planos de una disciplina, o el expediente completo del proyecto. Nada más.',
              },
              {
                icon: Eye,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                title: 'Trazabilidad completa',
                desc: 'Cada documento registra quién lo subió, cuándo y qué versión es. Como supervisor, tienes evidencia de que lo que revisaste era el documento oficial en ese momento — útil para actas de entrega y auditorías.',
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

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#00C2FF]/10 to-[#0077FF]/10 border border-[#00C2FF]/20 rounded-3xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-[#00C2FF] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">¿Supervisas proyectos de construcción?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Pídenos una demo y te mostramos cómo funciona el acceso para supervisores externos en Builtek.
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
