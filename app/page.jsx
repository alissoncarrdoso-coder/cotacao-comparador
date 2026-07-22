'use client'

import { useState, useRef } from 'react'
import {
  Upload, Trash2, Download, Loader, FileText,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, TrendingDown
} from 'lucide-react'

export default function Home() {
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState('idle') // idle | extracting | normalizing | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const [quotes, setQuotes] = useState([])
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    setFiles(prev => [...prev, ...dropped])
  }

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const reset = () => {
    setFiles([])
    setStage('idle')
    setQuotes([])
    setComparison(null)
    setError('')
    setProgress({ current: 0, total: 0, label: '' })
  }

  const processAll = async () => {
    if (files.length < 1) {
      setError('Selecione pelo menos um PDF')
      return
    }

    setStage('extracting')
    setError('')
    setProgress({ current: 0, total: files.length, label: 'Extraindo dados...' })

    const extracted = []

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length, label: `Lendo: ${files[i].name}` })

      try {
        const fd = new FormData()
        fd.append('file', files[i])

        const res = await fetch('/api/process-pdf', { method: 'POST', body: fd })
        const data = await res.json()

        if (data.error) throw new Error(data.error)
        extracted.push(data)
      } catch (err) {
        setError(`Erro ao processar "${files[i].name}": ${err.message}`)
        setStage('error')
        return
      }
    }

    setQuotes(extracted)
    setStage('normalizing')
    setProgress({ current: 0, total: 1, label: 'Normalizando nomenclaturas...' })

    try {
      const res = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes: extracted })
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setComparison({ quotes: extracted, groups: data.groups })
      setStage('done')
    } catch (err) {
      setError(`Erro ao normalizar: ${err.message}`)
      setStage('error')
    }
  }

  const exportCSV = () => {
    if (!comparison) return

    const suppliers = comparison.quotes.map(q => q.supplier || q.fileName)
    let csv = 'Item,Unidade,' + suppliers.join(',') + ',Melhor Preço (Fornecedor),Economia\n'

    getSortedGroups().forEach(group => {
      const pricesBySup = {}
      group.items.forEach(item => {
        pricesBySup[item.source] = item.unit_price
      })

      const prices = suppliers.map(s => pricesBySup[s] ?? null)
      const validPrices = prices.filter(p => p !== null)
      if (!validPrices.length) return

      const bestPrice = Math.min(...validPrices)
      const worstPrice = Math.max(...validPrices)
      const bestSup = suppliers[prices.indexOf(bestPrice)]
      const economy = worstPrice - bestPrice

      const row = [
        `"${group.normalized_name}"`,
        group.unit,
        ...suppliers.map(s => pricesBySup[s]?.toFixed(2).replace('.', ',') ?? '-'),
        bestSup,
        economy.toFixed(2).replace('.', ',')
      ]

      csv += row.join(';') + '\n'
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparacao_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getBestQuote = (group, suppliers) => {
    const pricesBySup = {}
    group.items.forEach(item => { pricesBySup[item.source] = item.unit_price })
    const prices = suppliers.map(s => pricesBySup[s] ?? null).filter(p => p !== null)
    if (!prices.length) return { best: null, worst: null, bestSup: null }
    const best = Math.min(...prices)
    const worst = Math.max(...prices)
    const bestSup = suppliers.find(s => pricesBySup[s] === best)
    return { best, worst, bestSup }
  }

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const getSortedGroups = () => {
    if (!comparison) return []
    const groups = [...comparison.groups]
    return groups.sort((a, b) => {
      let va, vb
      if (sortBy === 'name') {
        va = a.normalized_name.toLowerCase()
        vb = b.normalized_name.toLowerCase()
      } else if (sortBy === 'economy') {
        const suppliers = comparison.quotes.map(q => q.supplier || q.fileName)
        const { best: ba, worst: wa } = getBestQuote(a, suppliers)
        const { best: bb, worst: wb } = getBestQuote(b, suppliers)
        va = wa - ba
        vb = wb - bb
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />
  }

  const stageLabel = {
    extracting: `Lendo PDF ${progress.current} de ${progress.total}…`,
    normalizing: 'Comparando e normalizando itens…',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Comparador de Cotações</h1>
              <p className="text-xs text-slate-500 mt-0.5">Análise automática de orçamentos em PDF</p>
            </div>
          </div>
          {comparison && (
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="text-sm px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Nova comparação
              </button>
              <button
                onClick={exportCSV}
                className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Upload Area */}
        {!comparison && stage !== 'done' && (
          <div className="max-w-2xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <Upload className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
              <p className="text-lg font-semibold text-slate-700 group-hover:text-blue-700">
                Arraste os PDFs aqui ou clique para selecionar
              </p>
              <p className="text-sm text-slate-400 mt-1">Selecione os orçamentos de todos os fornecedores</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Progress */}
            {(stage === 'extracting' || stage === 'normalizing') && (
              <div className="mt-4 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-slate-700">{stageLabel[stage]}</span>
                </div>
                {stage === 'extracting' && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Process Button */}
            {stage === 'idle' || stage === 'error' ? (
              <button
                onClick={processAll}
                disabled={files.length === 0}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
              >
                Comparar {files.length > 0 ? `${files.length} orçamento${files.length > 1 ? 's' : ''}` : 'orçamentos'}
              </button>
            ) : null}
          </div>
        )}

        {/* Comparison Table */}
        {comparison && stage === 'done' && (() => {
          const suppliers = comparison.quotes.map(q => q.supplier || q.fileName)
          const groups = getSortedGroups()
          const totalEconomy = groups.reduce((acc, group) => {
            const { best, worst } = getBestQuote(group, suppliers)
            return acc + (worst && best ? worst - best : 0)
          }, 0)

          return (
            <>
              {/* Summary Cards */}
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
                  <p className="text-xs text-slate-400 mt-1">vs. pior preço em cada item</p>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">Ordenar por:</span>
                <button
                  onClick={() => toggleSort('name')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'name' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                >
                  Nome <SortIcon col="name" />
                </button>
                <button
                  onClick={() => toggleSort('economy')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sortBy === 'economy' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                >
                  Maior economia <SortIcon col="economy" />
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left py-3 px-4 font-semibold">Item</th>
                        <th className="text-center py-3 px-3 font-semibold text-slate-300 text-xs">Un.</th>
                        {suppliers.map((s, i) => (
                          <th key={i} className="text-center py-3 px-4 font-semibold max-w-[160px]">
                            <div className="truncate" title={s}>{s}</div>
                          </th>
                        ))}
                        <th className="text-center py-3 px-4 font-semibold text-green-300 whitespace-nowrap">Economia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group, gi) => {
                        const pricesBySup = {}
                        group.items.forEach(item => { pricesBySup[item.source] = item.unit_price })
                        const { best, worst, bestSup } = getBestQuote(group, suppliers)
                        const economy = best !== null && worst !== null ? worst - best : 0

                        return (
                          <tr key={gi} className={`border-t border-slate-100 ${gi % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="py-3 px-4 font-medium text-slate-800">{group.normalized_name}</td>
                            <td className="py-3 px-3 text-center text-xs text-slate-400">{group.unit}</td>
                            {suppliers.map((sup, si) => {
                              const price = pricesBySup[sup] ?? null
                              const isBest = price === best && sup === bestSup
                              const isWorst = price === worst && economy > 0

                              return (
                                <td key={si} className={`py-3 px-4 text-center font-semibold tabular-nums
                                  ${isBest ? 'text-green-700 bg-green-50' : ''}
                                  ${isWorst && !isBest ? 'text-red-500' : ''}
                                  ${price === null ? 'text-slate-300' : ''}
                                `}>
                                  {price !== null
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
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-400"></span>
                    Melhor preço ✓
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-white border border-red-400"></span>
                    Preço mais alto
                  </span>
                  <span className="flex items-center gap-1.5">
                    — Sem cotação
                  </span>
                </div>
              </div>
            </>
          )
        })()}
      </main>
    </div>
  )
}
