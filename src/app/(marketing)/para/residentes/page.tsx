import Link from 'next/link'
import { Layers, Smartphone, CheckSquare, Bell, Camera, AlertTriangle, MessageSquare, FileSearch, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Builtek para Residentes de Obra | Gestión de tareas y planos en campo',
  description: 'Builtek ayuda a residentes de obra a gestionar tareas, planos y avance desde el celular. Control documental, Kota AI y WhatsApp integrado.',
}

export default function ResidentesPage() {
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
            <Smartphone className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span className="text-[#00C2FF] text-xs font-semibold uppercase tracking-wide">Para residentes de obra</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Todo lo que necesitas<br />en campo, en tu celular.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Tareas actualizadas, planos vigentes, alertas por WhatsApp y bitácora fotográfica — sin salir de obra ni abrir el correo.
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
          <p className="text-white/40 text-center text-sm font-semibold uppercase tracking-widest mb-10">El día a día del residente sin Builtek</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: AlertTriangle, text: 'Recibes el plano "actualizado" por WhatsApp pero no sabes si ya fue aprobado o si hay una revisión más nueva.' },
              { icon: MessageSquare, text: 'Las tareas se coordinan por mensaje. No hay registro, no hay responsable claro, no hay fecha de entrega.' },
              { icon: Camera, text: 'Las fotos de avance se quedan en el celular o en un grupo de WhatsApp sin organización ni trazabilidad.' },
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Diseñado para trabajar en campo.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">Sin curvas de aprendizaje. Si sabes usar WhatsApp, sabes usar Builtek.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: CheckSquare,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'TaskBoard por especialidad',
                desc: 'Tus tareas organizadas por especialidad: estructural, arquitectura, instalaciones, geotecnia. Ves qué está en curso, qué está bloqueado y qué vence esta semana — sin reuniones de seguimiento.',
              },
              {
                icon: FileSearch,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'Planos vigentes desde el celular',
                desc: 'Consulta el plano aprobado más reciente directamente en el browser. Kota AI puede responderte preguntas técnicas sobre el plano: "¿cuántos estribos lleva la trabe TB-01?" — sin llamar al calculista.',
              },
              {
                icon: Bell,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Alertas por WhatsApp',
                desc: 'Cuando te asignan una tarea o se acerca una fecha límite, recibes un mensaje directo en WhatsApp. No tienes que entrar a la plataforma para saber qué sigue — Builtek te avisa donde ya estás.',
              },
              {
                icon: Camera,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                title: 'Bitácora fotográfica con ubicación en plano',
                desc: 'Sube fotos de avance desde campo y márcalas directamente sobre el plano con un pin. Cada foto queda registrada con fecha, autor y ubicación exacta en el plano — evidencia lista para el acta de entrega.',
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
          <h2 className="text-3xl font-bold text-white mb-4">¿Eres residente de obra?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Pídenos una demo y te mostramos Builtek funcionando en campo — desde el TaskBoard hasta la bitácora fotográfica.
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
