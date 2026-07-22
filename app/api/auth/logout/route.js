import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '../../../../lib/auth'

export const runtime = 'nodejs'

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/', request.url), 303)
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
