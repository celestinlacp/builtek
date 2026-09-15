export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A2744] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <span className="text-[#1A2744] font-black text-lg">B</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Builtek</span>
          </div>
        </div>

        <div>
          <blockquote className="text-white/80 text-lg leading-relaxed mb-6">
            "Gestiona proyectos, controla documentos y extrae cuantificaciones de planos con IA — todo en una sola plataforma."
          </blockquote>
          <div className="flex gap-6">
            <div>
              <p className="text-[#00C2FF] font-bold text-2xl">+300</p>
              <p className="text-white/60 text-sm">estructuras gestionadas</p>
            </div>
            <div>
              <p className="text-[#00C2FF] font-bold text-2xl">AI</p>
              <p className="text-white/60 text-sm">extracción de planos</p>
            </div>
            <div>
              <p className="text-[#00C2FF] font-bold text-2xl">100%</p>
              <p className="text-white/60 text-sm">en la nube</p>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs">© 2026 Builtek · builtek.mx</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#1A2744] rounded-lg flex items-center justify-center">
              <span className="text-[#00C2FF] font-black">B</span>
            </div>
            <span className="text-[#1A2744] font-bold text-lg">Builtek</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
