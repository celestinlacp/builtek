import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    R2_ACCOUNT_ID:        !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID:     !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME:       !!process.env.R2_BUCKET_NAME,
    lengths: {
      R2_ACCOUNT_ID:        process.env.R2_ACCOUNT_ID?.length,
      R2_ACCESS_KEY_ID:     process.env.R2_ACCESS_KEY_ID?.length,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY?.length,
      R2_BUCKET_NAME:       process.env.R2_BUCKET_NAME?.length,
    }
  })
}
