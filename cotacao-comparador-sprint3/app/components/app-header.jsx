import Link from 'next/link'
import { Download, History, LogOut, TrendingDown, UserCircle } from 'lucide-react'

export default function AppHeader({
  hasComparison,
  onReset,
  onExport,
  showLogout,
  historyEnabled = false,
  userEmail = '',
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-none truncate">Comparador de Cotações</h1>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Análise automática de orçamentos em PDF</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {userEmail && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 max-w-52">
              <UserCircle className="w-4 h-4 shrink-0" />
              <span className="truncate" title={userEmail}>{userEmail}</span>
            </div>
          )}

          {historyEnabled && (
            <Link
              href="/history"
              className="text-sm px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
          )}

          {hasComparison && (
            <>
              <button
                type="button"
                onClick={onReset}
                className="text-sm px-3 sm:px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Nova comparação
              </button>
              <button
                type="button"
                onClick={onExport}
                className="text-sm px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </>
          )}

          {showLogout && (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}
