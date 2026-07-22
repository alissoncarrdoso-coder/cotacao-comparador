import { cookies } from 'next/headers'
import {
  isAccessProtectionEnabled,
  SESSION_COOKIE,
  verifySessionToken,
} from './auth'
import { isSupabaseConfigured } from './supabase/config'
import { createClient } from './supabase/server'

export function getAuthenticationMode() {
  if (isSupabaseConfigured()) return 'supabase'
  if (isAccessProtectionEnabled()) return 'shared'
  return 'public'
}

export async function getAccessContext() {
  const mode = getAuthenticationMode()

  if (mode === 'supabase') {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    const claims = data?.claims

    if (error || !claims?.sub) {
      return { authenticated: false, mode, user: null, supabase }
    }

    return {
      authenticated: true,
      mode,
      user: {
        id: claims.sub,
        email: claims.email || '',
      },
      supabase,
    }
  }

  if (mode === 'shared') {
    const cookieStore = await cookies()
    const authenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
    return {
      authenticated,
      mode,
      user: authenticated ? { id: null, email: 'Acesso compartilhado' } : null,
      supabase: null,
    }
  }

  return {
    authenticated: true,
    mode,
    user: { id: null, email: '' },
    supabase: null,
  }
}
