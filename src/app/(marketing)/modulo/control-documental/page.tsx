import Link from 'next/link'
import { Layers, FolderOpen, GitBranch, CheckSquare, Search, QrCode, Zap, AlertTriangle, Mail, HardDrive, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Control Documental — Builtek | Planos, versiones y flujos de aprobación',
  description: 'Control documental para obra civil: versiones de planos, flujos de aprobación, visor PDF inline y Kota AI. Hecho para constructoras en México y LATAM.',
}

export default function ControlDocumentalPage() {
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
            <FolderOpen className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-wide">Módulo · Control documental</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            El expediente digital<br />de tu obra.
          </h1>
          <p className="text-white/50 text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Planos, especificaciones, memorias y oficios en un solo lugar — con versiones, flujos de aprobación y visor PDF sin salir de Builtek. Nunca más "¿cuál es el plano bueno?".
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
          <p className="text-white/40 text-center text-sm font-semibold uppercase tracking-widest mb-10">El problema que resuelve</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: AlertTriangle, text: 'Hay múltiples versiones de un mismo plano circulando por correo y WhatsApp. Nadie sabe cuál es la vigente.' },
              { icon: Mail, text: 'Los flujos de aprobación se hacen por email. Cada revisión es un hilo de respuestas imposible de rastrear.' },
              { icon: HardDrive, text: 'Los archivos están en Dropbox, Google Drive y el disco del calculista — sin estructura ni control de acceso.' },
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Control documental como debe ser.</h2>
            <p className="text-white/40 text-lg font-light max-w-xl mx-auto">Diseñado para los flujos reales de la obra civil — no para un equipo de software.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: GitBranch,
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                title: 'Control de versiones por plano',
                desc: 'Cada documento tiene historial de versiones: quién subió cada revisión, cuándo y cuál está vigente. El equipo siempre trabaja con el plano aprobado más reciente — sin coordinar manualmente.',
              },
              {
                icon: CheckSquare,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                title: 'Flujos de aprobación integrados',
                desc: 'Define quién revisa y quién aprueba cada tipo de documento. Las solicitudes de aprobación quedan registradas en la plataforma — no en correos. Cuando el documento cambia de estado, el equipo recibe notificación.',
              },
              {
                icon: Search,
                color: 'text-[#00C2FF]',
                bg: 'bg-[#00C2FF]/10',
                title: 'Visor PDF y DWG sin instalar nada',
                desc: 'Abre planos en PDF directamente en el navegador desde cualquier dispositivo. Sin AutoCAD, sin Acrobat. Los planos DWG también se visualizan inline — el residente revisa en campo desde su celular.',
              },
              {
                icon: Zap,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
                title: 'Kota AI — extracción automática de metadata',
                desc: 'Al subir un plano estructural en PDF, Kota extrae automáticamente: número de plano, revisión, escala, elementos y cantidades. Sin captura manual. Sin errores de transcripción. Disponible en planes Obra y Pro.',
              },
              {
                icon: QrCode,
                color: 'text-rose-400',
                bg: 'bg-rose-400/10',
                title: 'Compartir con link o QR — con caducidad',
                desc: 'Genera links de acceso público para supervisores externos o clientes — sin cuenta en Builtek. Define cuándo expira el link. Descarga el QR para pegarlo en la puerta del frente de obra.',
              },
              {
                icon: FolderOpen,
                color: 'text-sky-400',
                bg: 'bg-sky-400/10',
                title: 'Carpetas por disciplina con permisos',
                desc: 'Organiza documentos en carpetas por especialidad: estructural, arquitectura, instalaciones, geotecnia. Cada disciplina con su equipo y sus permisos. Drag & drop para mover archivos entre carpetas.',
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
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-violet-500/10 to-[#0077FF]/10 border border-violet-500/20 rounded-3xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">¿Quieres ver el control documental en acción?</h2>
          <p className="text-white/50 mb-8 text-lg font-light">
            Te mostramos el flujo completo: subir un plano, gestionar versiones, aprobar un documento y compartirlo con el supervisor externo.
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
