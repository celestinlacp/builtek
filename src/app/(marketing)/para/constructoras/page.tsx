import Link from 'next/link'
import { Layers, Building2, Settings, Zap, MessageCircle, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Builtek para Constructoras Medianas en México | Software de gestión de obra',
  description: 'Builtek es el sistema operativo para constructoras medianas en México. Gestión de tareas, control documental, Kota AI y WhatsApp — desde $2,190 MXN/mes.',
}

export default function ConstructorasPage() {
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
            <Building2 className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Para constructoras medianas</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Múltiples frentes de obra,<br />un solo sistema.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Builtek es el software AEC (Arquitectura, Ingeniería y Construcción) hecho para constructoras medianas en LATAM. No es Procore con otro logo — es un sistema built-to-suit para cómo trabaja tu empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-[#00C2FF] text-[#0D1729] px-8 py-4 rounded-xl font-semibold hover:bg-white transition-colors">
              Solicitar demo gratuita →
            </Link>
            <Link href="/precios" className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:border-white/40 transition-colors">
              Ver planes desde $2,190/mes
            </Link>
          </div>
          <p className="text-white/25 text-sm mt-6">Sin contratos anuales forzados · Sin vendor lock-in · Tus datos son tuyos</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Todo lo que necesita tu constructora.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">Una plataforma que integra gestión de proyectos, control documental e IA — sin pagar en dólares ni pasar por una integración de 6 meses.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Building2,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'Multi-proyecto desde un dashboard',
                desc: 'Gestiona todos tus proyectos activos desde un solo panel. Avance, tareas bloqueadas y documentos pendientes de aprobación — sin cambiar de sistema.',
              },
              {
                icon: Zap,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                title: 'Kota AI — lee tus planos estructurales',
                desc: 'Sube un plano en PDF y Kota extrae automáticamente elementos, cantidades y referencia cruzada. El diferenciador que ningún competidor en LATAM tiene integrado.',
              },
              {
                icon: MessageCircle,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'WhatsApp integrado al flujo de obra',
                desc: 'Alertas de tareas por vencer, notificaciones de asignación y bitácora fotográfica por WhatsApp. Tu equipo trabaja donde ya trabaja — Builtek se conecta.',
              },
              {
                icon: Users,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Roles y subcontratistas',
                desc: 'Owners, managers, ingenieros, supervisores externos y subcontratistas con acceso controlado. Cada quien ve solo su disciplina o proyecto. Sin mezclar información entre clientes.',
              },
              {
                icon: Shield,
                color: 'text-rose-400',
                bg: 'bg-rose-400/10',
                title: 'Control documental con trazabilidad',
                desc: 'Versiones, flujos de aprobación, links de acceso con caducidad y QR descargable. Cada documento tiene historia: quién lo subió, cuándo y qué revisión es.',
              },
              {
                icon: Settings,
                color: 'text-sky-400',
                bg: 'bg-sky-400/10',
                title: 'Personalizable con el Plan Partner',
                desc: 'Tipos de proyecto, categorías documentales y flujos propios de tu empresa. Builtek se adapta a cómo trabajas — no al revés.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex gap-5">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1.5">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Partner callout */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto bg-white/[0.03] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <p className="text-[#00C2FF] text-xs font-semibold uppercase tracking-widest mb-2">Software built-to-suit</p>
            <h3 className="text-white text-2xl font-bold mb-3">Plan Partner — Builtek para tu empresa</h3>
            <p className="text-white/50 leading-relaxed">
              Para constructoras con obra grande, múltiples frentes o procesos propios. Configuramos Builtek para que funcione exactamente como trabaja tu empresa: tipos de estructura, flujos de aprobación, categorías documentales y nomenclatura propias.
            </p>
          </div>
          <Link href="/contact" className="bg-white text-[#0D1729] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#00C2FF] transition-colors whitespace-nowrap flex items-center gap-2 shrink-0">
            Hablar con ventas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#00C2FF]/10 to-[#0077FF]/10 border border-[#00C2FF]/20 rounded-3xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-[#00C2FF] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">¿Tienes una constructora mediana?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Agenda una demo de 30 minutos. Te mostramos la plataforma completa y definimos juntos qué módulos necesita tu empresa.
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
