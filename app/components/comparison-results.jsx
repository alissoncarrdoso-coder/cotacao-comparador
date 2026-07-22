import { ChevronDown, ChevronUp } from 'lucide-react'
import { getBestQuote, getSuppliers, sortGroups } from '../../lib/comparison'

function SortIcon({ active, direction }) {
  if (!active) return null
  return direction === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 inline" />
    : <ChevronDown className="w-3 h-3 ml-1 inline" />
}

export default function ComparisonResults({ comparison, sortBy, sortDir, onSort }) {
  const suppliers = getSuppliers(comparison)
  const groups = sortGroups(comparison.groups, suppliers, sortBy, sortDir)
  const totalEconomy = groups.reduce((sum, group) => {
    const { best, worst } = getBestQuote(group, suppliers)
    return sum + (best === null || worst === null ? 0 : worst - best)
  }, 0)

  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Orçamentos</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Itens comparados</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm col-span-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Economia máx. possível</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {totalEconomy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-slate-400 mt-1">comparando o menor e o maior preço de cada item</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500">Ordenar por:</span>
        <button
          type="button"
          onClick={() => onSort('name')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'name' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          Nome <SortIcon active={sortBy === 'name'} direction={sortDir} />
        </button>
        <button
          type="button"
          onClick={() => onSort('economy')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'economy' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          Maior economia <SortIcon active={sortBy === 'economy'} direction={sortDir} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left py-3 px-4 font-semibold">Item</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-300 text-xs">Un.</th>
                {suppliers.map((supplier) => (
                  <th key={supplier.id} className="text-center py-3 px-4 font-semibold max-w-[160px]">
                    <div className="truncate" title={supplier.name}>{supplier.name}</div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-semibold text-green-300 whitespace-nowrap">Economia</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, index) => {
                const { best, worst, bestSupplierId, pricesBySupplier } = getBestQuote(group, suppliers)
                const economy = best === null || worst === null ? 0 : worst - best

                return (
                  <tr
                    key={`${group.normalized_name}-${index}`}
                    className={`border-t border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-800 min-w-[240px]">{group.normalized_name}</td>
                    <td className="py-3 px-3 text-center text-xs text-slate-400">{group.unit}</td>
                    {suppliers.map((supplier) => {
                      const price = pricesBySupplier.get(supplier.id)
                      const hasPrice = Number.isFinite(price)
                      const isBest = hasPrice && price === best && supplier.id === bestSupplierId
                      const isWorst = hasPrice && price === worst && economy > 0 && !isBest

                      return (
                        <td
                          key={supplier.id}
                          className={`py-3 px-4 text-center font-semibold tabular-nums
                            ${isBest ? 'text-green-700 bg-green-50' : ''}
                            ${isWorst ? 'text-red-500' : ''}
                            ${!hasPrice ? 'text-slate-300' : ''}`}
                        >
                          {hasPrice
                            ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                          {isBest && <span className="ml-1 text-xs">✓</span>}
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-center text-green-700 font-semibold tabular-nums">
                      {economy > 0
                        ? economy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-400" />
            Melhor preço ✓
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-white border border-red-400" />
            Preço mais alto
          </span>
          <span>— Sem cotação</span>
        </div>
      </div>
    </section>
  )
}
