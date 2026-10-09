import { createClient } from '@supabase/supabase-js'

type LogEntry = {
  workspace_id: string
  user_id:      string | null
  action:       string
  entity_type?: string | null
  entity_id?:   string | null
  entity_name?: string | null
  metadata?:    Record<string, unknown>
}

export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('activity_logs').insert(entry)
  } catch (e) {
    console.error('[activity_log] error:', e)
  }
}
