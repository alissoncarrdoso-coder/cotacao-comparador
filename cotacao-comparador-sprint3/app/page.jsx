import ComparatorApp from './components/comparator-app'
import LoginForm from './components/login-form'
import { getAccessContext } from '../lib/access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }) {
  const params = await searchParams
  const access = await getAccessContext()

  if (!access.authenticated) {
    return <LoginForm authMode={access.mode} initialError={params?.auth_error || ''} />
  }

  return (
    <ComparatorApp
      accessProtected={access.mode !== 'public'}
      authMode={access.mode}
      userEmail={access.user?.email || ''}
      historyEnabled={access.mode === 'supabase'}
    />
  )
}
