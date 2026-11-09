import Link from 'next/link'
import { Layers, BarChart2, Users, FolderOpen, TrendingUp, AlertTriangle, Clock, Mail, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Builtek para Directores de Proyecto | KPIs y control de obra en tiempo real',
  description: 'Builtek da a los directores de proyecto visibilidad total: avance, documentos, tareas y KPIs en tiempo real, desde cualquier dispositivo.',
}

export default function DirectoresPage() {
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
            <BarChart2 className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Para directores de proyecto</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            El estado real de tu obra,<br />sin esperar el reporte del viernes.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            KPIs en tiempo real, control de múltiples proyectos y visibilidad del equipo — sin llamar al residente para saber qué está pasando.
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

      {/* Pain points */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/40 text-center text-sm font-semibold uppercase tracking-widest mb-10">¿Te identificas con esto?</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Clock, text: 'Dependes del reporte semanal del residente para saber el avance real. Entre semana, operas a ciegas.' },
              { icon: AlertTriangle, text: 'Hay tareas bloqueadas hace días y nadie te avisó. Te enteras cuando ya es un problema.' },
              { icon: Mail, text: 'Los documentos aprobados están en correos, chats y carpetas compartidas — sin versión única de la verdad.' },
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Visibilidad total. Sin depender de reportes.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">Builtek conecta a tu equipo en un solo sistema — lo que el residente actualiza, tú lo ves en tiempo real.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: BarChart2,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'Dashboard de KPIs por proyecto',
                desc: 'Proyectos activos, tareas totales, completadas y bloqueadas. Avance del equipo en porcentaje real, no estimado. Visible desde cualquier dispositivo, sin instalar nada.',
              },
              {
                icon: TrendingUp,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'Analytics de control documental',
                desc: 'Cuántos planos tiene cada disciplina, cuáles están en revisión, cuáles aprobados y cuáles pendientes. Panel de métricas con conteo de láminas por especialidad y estado de aprobación.',
              },
              {
                icon: FolderOpen,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Expediente digital por proyecto',
                desc: 'Todos los documentos del proyecto organizados por disciplina con control de versiones. Planos, especificaciones, oficios y memorias en un solo lugar — siempre la versión vigente.',
              },
              {
                icon: Users,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                title: 'Roles y acceso por proyecto',
                desc: 'Define quién puede ver qué: owners, managers, ingenieros y supervisores externos. Invita a subcontratistas con acceso limitado a su disciplina. Control sin complicaciones.',
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
          <h2 className="text-3xl font-bold text-white mb-4">¿Diriges proyectos de construcción?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Agenda una demo de 30 minutos y te mostramos el dashboard, el control documental y los KPIs en vivo.
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
