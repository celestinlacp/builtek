/**
 * Cron — tareas por vencer
 *
 * Busca tareas con due_date = hoy + 2 días y envía WhatsApp al asignado.
 * Protegido con CRON_SECRET en el header Authorization.
 *
 * Configurar en Railway (o cualquier cron externo):
 *   GET https://builtek.app/api/cron/tareas-por-vencer
 *   Header: Authorization: Bearer <CRON_SECRET>
 *   Schedule: 0 9 * * *  (diario a las 9:00 AM)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMenvioWhatsApp, normalizePhone } from '@/lib/menvio'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()

  // Fecha objetivo: hoy (mismo día de vencimiento)
  const target = new Date()
  const targetDate = target.toISOString().split('T')[0] // YYYY-MM-DD

  // Buscar tareas que vencen en 2 días, no finalizadas, con asignado
  const { data: tasks, error } = await admin
    .from('tasks')
    .select('id, name, due_date, assignee_id, projects(name)')
    .eq('due_date', targetDate)
    .not('status', 'in', '(done,blocked)')
    .not('assignee_id', 'is', null)

  if (error) {
    console.error('[cron/tareas-por-vencer] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No hay tareas por vencer en 2 días' })
  }

  // Obtener perfiles de los asignados (phone + full_name)
  const assigneeIds = [...new Set(tasks.map(t => t.assignee_id as string))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', assigneeIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Formatear fecha para el mensaje
  const dueDateStr = target.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  let sent = 0
  let skipped = 0

  for (const task of tasks) {
    const profile = profileMap.get(task.assignee_id as string)
    const phone = normalizePhone(profile?.phone)

    if (!phone) {
      skipped++
      continue
    }

    const assigneeName = profile?.full_name ?? 'Responsable'
    const projectName  = (task.projects as any)?.name ?? 'Proyecto'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://builtek.app'
    const taskUrl = `${baseUrl}/tasks?task=${task.id}`
    const result = await sendMenvioWhatsApp(
      'tarea_por_vencer',
      phone,
      [assigneeName, task.name, projectName, dueDateStr],
      taskUrl
    )

    if (result.ok) sent++
    else skipped++
  }

  console.log(`[cron/tareas-por-vencer] ${targetDate}: ${sent} enviados, ${skipped} omitidos`)
  return NextResponse.json({ ok: true, date: targetDate, sent, skipped })
}
