import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { plan, notes } = await request.json()

    if (!plan || !['starter', 'obra', 'pro', 'contractor'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Get workspace membership and verify owner role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) return NextResponse.json({ error: 'Sin workspace' }, { status: 404 })
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Solo el owner puede cambiar el plan' }, { status: 403 })
    }

    const workspaceId = membership.workspace_id
    const admin = createAdminClient()

    // Get current plan
    const { data: ws } = await admin
      .from('workspaces')
      .select('plan, status')
      .eq('id', workspaceId)
      .single()

    if (!ws) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

    const oldPlan = ws.plan
    const newStatus = ws.status === 'trial_expired' ? 'active' : ws.status

    // Update workspace plan
    const { error: updateError } = await admin
      .from('workspaces')
      .update({ plan, status: newStatus })
      .eq('id', workspaceId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Log plan change
    await admin.from('plan_change_log').insert({
      workspace_id: workspaceId,
      changed_by: user.id,
      old_plan: oldPlan,
      new_plan: plan,
      notes: notes || null,
    })

    return NextResponse.json({ success: true, plan, status: newStatus })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}
