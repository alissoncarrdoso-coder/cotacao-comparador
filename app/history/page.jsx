import Link from 'next/link'
import { History, LogOut, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getAccessContext } from '../../lib/access'
import HistoryList from './history-list'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const access = await getAccessContext()
  if (!access.authenticated) redirect('/')
  if (access.mode !== 'supabase') redirect('/')

  const { data, error } = await access.supabase
    .from('comparisons')
    .select('id,title,supplier_count,item_count,max_savings,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><History className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="font-bold text-slate-900">Histórico de cotações</h1>
              <p className="text-xs text-slate-500 truncate max-w-64">{access.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova comparação</span>
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="p-2.5 border border-slate-300 rounded-lg text-slate-500 hover:text-red-600" aria-label="Sair"><LogOut className="w-4 h-4" /></button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">Não foi possível carregar o histórico. Confirme se a migration SQL foi executada no Supabase.</p>
        ) : (
          <HistoryList initialComparisons={data || []} />
        )}
      </main>
    </div>
  )
}
