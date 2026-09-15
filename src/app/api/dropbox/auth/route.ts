import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_APP_KEY!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/dropbox/callback`,
    response_type: 'code',
    token_access_type: 'offline',
  })

  return NextResponse.redirect(
    `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
  )
}
