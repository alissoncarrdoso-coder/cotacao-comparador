import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FilePlus2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { getBestQuote, getSuppliers, sortGroups } from '../../lib/comparison'

function SortIcon({ active, direction }) {
  if (!active) return null
  return direction === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 inline" />
    : <ChevronDown className="w-3 h-3 ml-1 inline" />
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ComparisonResults({
  comparison,
  comparisonId,
  saveState,
  saveError,
  historyEnabled,
  sortBy,
  sortDir,
  importState,
  processingInfo,
  onSort,
  onSave,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onAddSupplier,
  onUpdateSupplier,
  onRemoveSupplier,
  onUpdatePrice,
  onImport,
}) {
  const suppliers = getSuppliers(comparison)
  const groups = sortGroups(comparison.groups, suppliers, sortBy, sortDir)
  const totalEconomy = groups.reduce((sum, group) => {
    const { best, worst } = getBestQuote(group, suppliers)
    return sum + (best === null || worst === null ? 0 : (worst - best) * Number(group.quantity || 1))
  }, 0)

  return (
    <section>
      {historyEnabled && (
        <div className="mb-4">
          {saveState === 'saving' && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <LoaderCircle className="w-4 h-4 animate-spin" /> Salvando alterações…
            </div>
          )}
          {saveState === 'dirty' && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <span>Existem alterações ainda não salvas.</span>
              <button type="button" onClick={onSave} className="font-semibold inline-flex items-center gap-2 hover:underline">
                <Save className="w-4 h-4" /> Salvar agora
              </button>
            </div>
          )}
          {saveState === 'saved' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Comparação salva no histórico.</span>
              {comparisonId && <Link href={`/comparisons/${comparisonId}`} className="font-semibold hover:underline">Abrir registro</Link>}
            </div>
          )}
          {saveState === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button type="button" onClick={onAddGroup} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar item
        </button>
        <button type="button" onClick={onAddSupplier} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar fornecedor
        </button>
        <button type="button" onClick={onImport} disabled={importState === 'processing'} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2">
          {importState === 'processing' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
          {importState === 'processing' ? 'Importando…' : 'Importar nova cotação'}
        </button>
        {historyEnabled && (
          <button type="button" onClick={onSave} disabled={saveState === 'saving'} className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Salvar alterações
          </button>
        )}
        {processingInfo?.processingMode && (
          <span className="ml-auto text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5">
            Organização: {processingInfo.processingMode === 'local' ? 'local, sem chamada extra de IA' : 'híbrida com apoio de IA'}
          </span>
        )}
      </div>

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
          <p className="text-3xl font-bold text-green-600 mt-1">{money(totalEconomy)}</p>
          <p className="text-xs text-slate-400 mt-1">considerando a quantidade de cada item</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500">Ordenar por:</span>
        <button type="button" onClick={() => onSort('name')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'name' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
          Nome <SortIcon active={sortBy === 'name'} direction={sortDir} />
        </button>
        <button type="button" onClick={() => onSort('economy')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'economy' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
          Maior economia <SortIcon active={sortBy === 'economy'} direction={sortDir} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead>
              <tr className="bg-slate-800 text-white align-top">
                <th className="text-left py-3 px-3 font-semibold min-w-[250px]">Item</th>
                <th className="text-center py-3 px-2 font-semibold text-slate-300 text-xs w-20">Un.</th>
                <th className="text-center py-3 px-2 font-semibold text-slate-300 text-xs w-24">Qtd.</th>
                {suppliers.map((supplier) => (
                  <th key={supplier.id} className="text-center py-2 px-2 font-semibold min-w-[155px] max-w-[190px]">
                    <div className="flex items-start gap-1">
                      <input
                        aria-label={`Nome do fornecedor ${supplier.name}`}
                        defaultValue={supplier.name}
                        onBlur={(event) => onUpdateSupplier(supplier.id, event.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-center text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button type="button" onClick={() => onRemoveSupplier(supplier.id)} className="p-1.5 text-slate-300 hover:text-red-300" title="Remover fornecedor">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-3 font-semibold text-green-300 whitespace-nowrap">Economia</th>
                <th className="text-left py-3 px-3 font-semibold min-w-[180px]">Observações</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {groups.map((group, index) => {
                const { best, worst, bestSupplierId, pricesBySupplier } = getBestQuote(group, suppliers)
                const economy = best === null || worst === null ? 0 : (worst - best) * Number(group.quantity || 1)

                return (
                  <tr key={group.id} className={`border-t border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors align-top`}>
                    <td className="py-2 px-3">
                      <textarea
                        aria-label="Descrição do item"
                        rows={2}
                        defaultValue={group.normalized_name}
                        onBlur={(event) => onUpdateGroup(group.id, 'normalized_name', event.target.value)}
                        className="w-full resize-none bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-400 rounded px-2 py-1.5 font-medium text-slate-800 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input defaultValue={group.unit} onBlur={(event) => onUpdateGroup(group.id, 'unit', event.target.value)} className="w-full text-center bg-transparent border border-slate-200 rounded px-1 py-2 text-xs text-slate-600 focus:outline-none focus:border-blue-400" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min="0" step="any" defaultValue={group.quantity || 1} onBlur={(event) => onUpdateGroup(group.id, 'quantity', event.target.value)} className="w-full text-center bg-transparent border border-slate-200 rounded px-1 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400" />
                    </td>
                    {suppliers.map((supplier) => {
                      const price = pricesBySupplier.get(supplier.id)
                      const hasPrice = Number.isFinite(price)
                      const isBest = hasPrice && price === best && supplier.id === bestSupplierId
                      const isWorst = hasPrice && price === worst && economy > 0 && !isBest

                      return (
                        <td key={supplier.id} className={`py-2 px-2 ${isBest ? 'bg-green-50' : ''}`}>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs text-slate-400">R$</span>
                            <input
                              inputMode="decimal"
                              aria-label={`Preço de ${group.normalized_name} em ${supplier.name}`}
                              defaultValue={hasPrice ? price.toFixed(2).replace('.', ',') : ''}
                              placeholder="—"
                              onBlur={(event) => onUpdatePrice(group.id, supplier.id, event.target.value)}
                              className={`w-full text-right tabular-nums bg-white border rounded pl-7 pr-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 ${isBest ? 'border-green-400 text-green-700 font-bold' : isWorst ? 'border-red-200 text-red-600' : 'border-slate-200 text-slate-700'}`}
                            />
                          </div>
                        </td>
                      )
                    })}
                    <td className="py-3 px-3 text-center text-green-700 font-semibold tabular-nums whitespace-nowrap">
                      {economy > 0 ? money(economy) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 px-2">
                      <textarea rows={2} defaultValue={group.notes || ''} placeholder="Prazo, marca, observação…" onBlur={(event) => onUpdateGroup(group.id, 'notes', event.target.value)} className="w-full resize-none bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-400" />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button type="button" onClick={() => onRemoveGroup(group.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remover item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-400" /> Melhor preço</span>
          <span>Edite qualquer campo e clique em “Salvar alterações”.</span>
          <span>Uma nova cotação é adicionada sem reprocessar os PDFs anteriores.</span>
        </div>
      </div>
    </section>
  )
}
