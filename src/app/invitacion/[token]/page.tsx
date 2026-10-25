import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

// noindex nofollow for personalized pages
export const metadata = {
  robots: 'noindex, nofollow',
}

// TODO: reemplazar con número real
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '524494481720'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.mx').replace(/\/$/, '')

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  // Read and update invite
  const { data: invite, error } = await admin
    .from('invite_links')
    .select('id, token, recipient_name, recipient_company, trial_days, status, opened_at, open_count, expires_at')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return (
      <PageShell>
        <div className="text-center">
          <p className="text-white/60 text-lg">Este link ya no está disponible</p>
        </div>
      </PageShell>
    )
  }

  if (invite.status === 'expired') {
    return (
      <PageShell>
        <div className="text-center">
          <p className="text-white/60 text-lg">Este link ya no está disponible</p>
        </div>
      </PageShell>
    )
  }

  if (invite.status === 'used') {
    return (
      <PageShell>
        <div className="text-center">
          <p className="text-white/60 text-lg">Esta invitación ya fue utilizada</p>
        </div>
      </PageShell>
    )
  }

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin.from('invite_links').update({ status: 'expired' }).eq('id', invite.id)
    return (
      <PageShell>
        <div className="text-center">
          <p className="text-white/60 text-lg">Este link ya no está disponible</p>
        </div>
      </PageShell>
    )
  }

  // Track open
  const updateData: Record<string, unknown> = { open_count: (invite.open_count || 0) + 1 }
  if (!invite.opened_at) updateData.opened_at = new Date().toISOString()
  await admin.from('invite_links').update(updateData).eq('id', invite.id)

  const { recipient_name, recipient_company, trial_days } = invite
  const hasCompany = !!recipient_company

  const waText = encodeURIComponent('Hola Luis, me interesa mi invitación a Builtek')
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`
  const registerUrl = `${APP_URL}/register?invite=${token}`

  return (
    <PageShell>
      {/* Header text */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
          {recipient_name}, tienes una invitación exclusiva a Builtek
        </h1>
        {hasCompany && (
          <p className="text-white/50 text-sm">
            {recipient_company} &nbsp;·&nbsp; Acceso personal de Luis Celestin, fundador
          </p>
        )}
        {!hasCompany && (
          <p className="text-white/50 text-sm">
            Acceso personal de Luis Celestin, fundador
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs uppercase tracking-widest">Lo que incluye esta invitación</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {/* Trial */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00C2FF] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold mb-1">
                {trial_days} días completos del plan Obra — sin tarjeta de crédito
              </p>
              <p className="text-white/50 text-sm">
                IA integrada, control documental, WhatsApp automático
              </p>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00C2FF] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold mb-1">
                2 sesiones de personalización incluidas
              </p>
              <p className="text-white/50 text-sm mb-2">
                Luis Celestin revisará contigo las necesidades específicas{hasCompany ? ` de ${recipient_company}` : ''} y adaptará la plataforma a cómo trabaja
                {hasCompany ? ' tu equipo.' : ' tu equipo.'} Lo que se desarrolle es tuyo, para siempre.
              </p>
              <p className="text-white/30 text-xs italic">
                Las sesiones se coordinan personalmente por Luis Celestin una semana después de tu registro.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex-1 h-px bg-white/10 mb-8" />

      {/* CTAs */}
      <div className="space-y-3">
        <a
          href={registerUrl}
          className="block w-full text-center bg-[#00C2FF] text-[#060e1c] py-4 rounded-xl font-bold text-base hover:bg-white transition-colors shadow-lg shadow-[#00C2FF]/20"
        >
          Crear mi cuenta →
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 py-3.5 rounded-xl font-medium text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Hablar con Luis Celestin
        </a>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060e1c] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#00C2FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Builtek header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#00C2FF] rounded-lg flex items-center justify-center">
            <span className="text-[#060e1c] font-black text-lg">B</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Builtek</span>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
