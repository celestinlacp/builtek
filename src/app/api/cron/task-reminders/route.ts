import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMenvioTemplate, normalizePhone } from '@/lib/menvio'

/**
 * GET /api/cron/task-reminders
 *
 * Vercel Cron — corre diario a las 8am México (14:00 UTC).
 * Busca tareas que vencen mañana, status != done/blocked,
 * con asignado que tenga teléfono, y envía builtek_tarea_por_vencer.
 */
export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET para evitar llamadas no autorizadas
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Calcular rango: mañana 00:00 → mañana 23:59
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

  const { data: tasks, error } = await admin
    .from('tasks')
    .select(`
      id, name, due_date, assignee_id,
      project:projects(name),
      assignee:profiles!tasks_assignee_id_fkey(full_name, phone)
    `)
    .eq('due_date', dateStr)
    .not('status', 'in', '("done","blocked")')
    .not('assignee_id', 'is', null)

  if (error) {
    console.error('[cron/task-reminders] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const task of tasks ?? []) {
    const assignee = task.assignee as unknown as { full_name: string; phone: string | null } | null
    const phone    = normalizePhone(assignee?.phone)

    if (!phone) { skipped++; continue }

    const assigneeName = assignee?.full_name ?? 'Responsable'
    const projectName  = (task.project as unknown as { name: string } | null)?.name ?? 'Proyecto'

    await sendMenvioTemplate({
      contacts:      [{ name: assigneeName, phone }],
      template_name: 'builtek_tarea_por_vencer',
      variables:     [projectName, task.name, assigneeName, '24 horas'],
      button_url:    `https://builtek.app/tasks/${task.id}`,
    })

    sent++
  }

  console.log(`[cron/task-reminders] sent=${sent} skipped=${skipped} date=${dateStr}`)
  return NextResponse.json({ ok: true, sent, skipped, date: dateStr })
}
