import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getSupabaseConfig, isSupabaseConfigured } from './config'

export async function updateSession(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  const { url, key } = getSupabaseConfig()
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Valida e atualiza o token quando necessário.
  await supabase.auth.getClaims()
  return response
}
