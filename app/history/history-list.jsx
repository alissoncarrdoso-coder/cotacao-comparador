'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Eye, LoaderCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function HistoryList({ initialComparisons }) {
  const router = useRouter()
  const [comparisons, setComparisons] = useState(initialComparisons)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  async function removeComparison(id, title) {
    if (!window.confirm(`Excluir "${title}" do histórico?`)) return

    setDeletingId(id)
    setError('')
    const response = await fetch(`/api/comparisons/${id}`, { method: 'DELETE' })
    const data = await response.json().catch(() => ({}))
    setDeletingId(null)

    if (!response.ok) {
      setError(data.error || 'Não foi possível excluir a comparação')
      return
    }

    setComparisons((current) => current.filter((item) => item.id !== id))
    router.refresh()
  }

  if (!comparisons.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-800">Nenhuma comparação salva</h2>
        <p className="text-sm text-slate-500 mt-1">Quando você comparar novos PDFs, o resultado aparecerá aqui.</p>
        <Link href="/" className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg">
          Criar primeira comparação
        </Link>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
      <div className="grid gap-4">
        {comparisons.map((comparison) => (
          <article key={comparison.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 truncate">{comparison.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Atualizada em {new Date(comparison.updated_at || comparison.created_at).toLocaleString('pt-BR')}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-slate-600">
                <span><strong>{comparison.supplier_count}</strong> fornecedores</span>
                <span><strong>{comparison.item_count}</strong> itens</span>
                <span className="text-green-700">Economia possível: <strong>{currency(comparison.max_savings)}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/comparisons/${comparison.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" /> Abrir
              </Link>
              <button
                type="button"
                onClick={() => removeComparison(comparison.id, comparison.title)}
                disabled={deletingId === comparison.id}
                className="p-2.5 border border-slate-300 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                aria-label={`Excluir ${comparison.title}`}
              >
                {deletingId === comparison.id ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
