import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('workspaces').select('count').limit(1)
    if (error) throw new Error(error.message + ' | code: ' + error.code)
    return NextResponse.json({ status: 'ok', supabase: 'connected' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 })
  }
}
