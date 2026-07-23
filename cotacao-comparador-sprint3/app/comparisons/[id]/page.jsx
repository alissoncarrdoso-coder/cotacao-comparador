import { notFound, redirect } from 'next/navigation'
import ComparatorApp from '../../components/comparator-app'
import { getAccessContext } from '../../../lib/access'

export const dynamic = 'force-dynamic'

export default async function SavedComparisonPage({ params }) {
  const access = await getAccessContext()
  if (!access.authenticated) redirect('/')
  if (access.mode !== 'supabase') redirect('/')

  const { id } = await params
  const { data, error } = await access.supabase
    .from('comparisons')
    .select('id,payload')
    .eq('id', id)
    .single()

  if (error || !data?.payload) notFound()

  return (
    <ComparatorApp
      accessProtected
      authMode="supabase"
      userEmail={access.user.email}
      historyEnabled
      initialComparison={data.payload}
      initialComparisonId={data.id}
    />
  )
}
