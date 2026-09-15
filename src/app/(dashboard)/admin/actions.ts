'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getWorkspaceId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return { supabase, userId: user.id, workspaceId: data?.workspace_id }
}

export async function createProject(formData: FormData) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('projects').insert({
    workspace_id: workspaceId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    status: 'active',
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProject(projectId: string, formData: FormData) {
  await getWorkspaceId()
  const admin = getAdminClient()

  const { error } = await admin.from('projects').update({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
  }).eq('id', projectId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  await getWorkspaceId()
  const admin = getAdminClient()
  const { error } = await admin.from('projects').delete().eq('id', projectId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function inviteMember(formData: FormData) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos para invitar' }
  }

  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = formData.get('role') as string

  const admin = getAdminClient()

  // Guardar invitación en DB (genera token automáticamente)
  const { data: invite, error: inviteError } = await admin
    .from('workspace_invitations')
    .upsert({ workspace_id: workspaceId, email, role, invited_by: userId },
      { onConflict: 'workspace_id,email' })
    .select('token')
    .single()

  if (inviteError) return { error: inviteError.message }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectTo = `${appUrl}/api/auth/callback?next=/invite/accept?token=${invite.token}`

  // Enviar invite vía Supabase Auth
  const { error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { workspace_id: workspaceId, role },
  })

  if (authError) {
    // Si el usuario ya existe, igual lo agregamos al workspace directamente
    if (authError.message.includes('already been registered')) {
      return { error: 'Este email ya tiene cuenta en Builtek. Pide al usuario que inicie sesión y use el link de invitación.' }
    }
    return { error: authError.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function cancelInvite(inviteId: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId)
    .eq('workspace_id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateMemberRole(targetUserId: string, role: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }
  if (role === 'owner') return { error: 'No se puede asignar el rol owner' }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single()

  if (target?.role === 'owner') return { error: 'No se puede cambiar el rol del owner' }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function removeMember(targetUserId: string) {
  const { supabase, userId, workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
    return { error: 'Sin permisos' }
  }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single()

  if (target?.role === 'owner') return { error: 'No se puede remover al owner' }

  const admin = getAdminClient()
  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateWorkspace(formData: FormData) {
  const { workspaceId } = await getWorkspaceId()
  if (!workspaceId) return { error: 'Sin workspace' }
  const admin = getAdminClient()

  const { error } = await admin.from('workspaces').update({
    name: formData.get('name') as string,
  }).eq('id', workspaceId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}
