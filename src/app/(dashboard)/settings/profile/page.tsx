import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserCircle } from 'lucide-react'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2744] flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-[#00C2FF]" />
          Mi perfil
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Edita tu información personal y preferencias de cuenta
        </p>
      </div>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        initialAvatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  )
}
