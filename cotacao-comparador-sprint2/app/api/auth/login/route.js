import { NextResponse } from 'next/server'
import {
  createSessionToken,
  isAccessProtectionEnabled,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyAccessPassword,
} from '../../../../lib/auth'
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })

  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    )
  }

  if (!isAccessProtectionEnabled()) {
    return NextResponse.json({ ok: true })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  if (!verifyAccessPassword(body?.password)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions)
  return response
}
