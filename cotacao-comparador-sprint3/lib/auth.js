import crypto from 'node:crypto'

export const SESSION_COOKIE = 'cotacao_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  return process.env.APP_SESSION_SECRET || process.env.APP_ACCESS_PASSWORD || ''
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

export function isAccessProtectionEnabled() {
  return Boolean(process.env.APP_ACCESS_PASSWORD)
}

export function verifyAccessPassword(candidate) {
  const expected = process.env.APP_ACCESS_PASSWORD
  if (!expected) return true
  return safeEqual(candidate || '', expected)
}

export function createSessionToken() {
  if (!getSecret()) return ''

  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  })).toString('base64url')

  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token) {
  if (!isAccessProtectionEnabled()) return true
  if (!token || !getSecret()) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return Number.isFinite(session.exp) && session.exp > Date.now()
  } catch {
    return false
  }
}

export function isAuthenticatedRequest(request) {
  if (!isAccessProtectionEnabled()) return true
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
}
