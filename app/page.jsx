import { cookies } from 'next/headers'
import ComparatorApp from './components/comparator-app'
import LoginForm from './components/login-form'
import {
  isAccessProtectionEnabled,
  SESSION_COOKIE,
  verifySessionToken,
} from '../lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Home() {
  if (!isAccessProtectionEnabled()) {
    return <ComparatorApp accessProtected={false} />
  }

  const cookieStore = await cookies()
  const authenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
  return authenticated ? <ComparatorApp accessProtected /> : <LoginForm />
}
