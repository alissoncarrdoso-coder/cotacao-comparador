import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { isSupabaseConfigured } from '../../../lib/supabase/config'

function safeNextPath(value) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function GET(request) {
  const url = new URL(request.url)
  const next = safeNextPath(url.searchParams.get('next'))

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/', url.origin))
  }

  const supabase = await createClient()
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  let error

  if (code) {
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else if (tokenHash && type) {
    ;({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }))
  } else {
    error = new Error('Link de autenticação inválido')
  }

  if (error) {
    const destination = new URL('/', url.origin)
    destination.searchParams.set('auth_error', 'Não foi possível validar o link de acesso.')
    return NextResponse.redirect(destination)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
