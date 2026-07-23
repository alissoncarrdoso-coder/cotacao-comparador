'use client'

import { useRef, useState } from 'react'
import AppHeader from './app-header'
import ComparisonResults from './comparison-results'
import UploadPanel from './upload-panel'
import {
  buildLocalGroups,
  createComparisonCsv,
  getSuppliers,
  mergeQuoteIntoComparison,
  sortGroups,
} from '../../lib/comparison'

const MAX_FILES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

async function readJsonResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`)
  return data
}

function defaultComparisonTitle() {
  return `Comparação ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())}`
}

function ensureComparisonIds(value) {
  if (!value) return null
  return {
    ...value,
    quotes: (value.quotes || []).map((quote) => ({
      ...quote,
      id: quote.id || crypto.randomUUID(),
    })),
    groups: (value.groups || []).map((group) => ({
      ...group,
      id: group.id || crypto.randomUUID(),
      quantity: Number(group.quantity || group.items?.[0]?.quantity || 1),
      notes: group.notes || '',
      items: [...(group.items || [])],
    })),
  }
}

function parseMoneyInput(value) {
  let normalized = String(value || '')
    .trim()
    .replace(/[^0-9,.-]/g, '')
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export default function ComparatorApp({
  accessProtected = false,
  authMode = 'public',
  userEmail = '',
  historyEnabled = false,
  initialComparison = null,
  initialComparisonId = null,
}) {
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState(initialComparison ? 'done' : 'idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [comparison, setComparison] = useState(() => ensureComparisonIds(initialComparison))
  const [comparisonId, setComparisonId] = useState(initialComparisonId)
  const [saveState, setSaveState] = useState(initialComparisonId ? 'saved' : 'idle')
  const [saveError, setSaveError] = useState('')
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [importState, setImportState] = useState('idle')
  const [processingInfo, setProcessingInfo] = useState(initialComparison?.meta || null)
  const inputRef = useRef(null)
  const importInputRef = useRef(null)

  function addFiles(incoming) {
    const pdfs = Array.from(incoming).filter((file) => (
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    ))

    const oversized = pdfs.find((file) => file.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`O arquivo "${oversized.name}" ultrapassa 10 MB.`)
      return
    }

    setFiles((current) => {
      const known = new Set(current.map((file) => file.key))
      const unique = pdfs
        .map((file) => ({ file, key: fileKey(file), name: file.name, size: file.size }))
        .filter((entry) => !known.has(entry.key))
      const next = [...current, ...unique].slice(0, MAX_FILES)

      if (current.length + unique.length > MAX_FILES) {
        setError(`É possível comparar no máximo ${MAX_FILES} PDFs por vez.`)
      } else {
        setError('')
      }
      return next
    })
  }

  function handleDrop(event) {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  function handleFileInput(event) {
    addFiles(event.target.files)
    event.target.value = ''
  }

  function reset() {
    if (initialComparisonId) {
      window.location.href = '/'
      return
    }

    setFiles([])
    setStage('idle')
    setProgress({ current: 0, total: 0 })
    setComparison(null)
    setComparisonId(null)
    setSaveState('idle')
    setSaveError('')
    setError('')
    setSortBy('name')
    setSortDir('asc')
    setProcessingInfo(null)
  }

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((direction) => direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir(column === 'economy' ? 'desc' : 'asc')
    }
  }

  function markChanged(nextComparison) {
    setComparison(nextComparison)
    setSaveState(historyEnabled ? 'dirty' : 'idle')
    setSaveError('')
  }

  async function saveComparison(result = comparison) {
    if (!historyEnabled || !result) return

    setSaveState('saving')
    setSaveError('')

    try {
      const response = await fetch(comparisonId ? `/api/comparisons/${comparisonId}` : '/api/comparisons', {
        method: comparisonId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!comparisonId ? { title: defaultComparisonTitle() } : {}),
          comparison: result,
        }),
      })
      const data = await readJsonResponse(response)
      if (!comparisonId) setComparisonId(data.comparison.id)
      setSaveState('saved')
    } catch (err) {
      setSaveError(err.message)
      setSaveState('error')
    }
  }

  async function processAll() {
    if (!files.length) {
      setError('Selecione pelo menos um PDF')
      return
    }

    setStage('extracting')
    setError('')
    setSaveState('idle')
    setSaveError('')
    setProgress({ current: 0, total: files.length })

    const quotes = []

    for (let index = 0; index < files.length; index += 1) {
      const entry = files[index]
      const file = entry.file
      setProgress({ current: index + 1, total: files.length })

      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/process-pdf', { method: 'POST', body: formData })
        const quote = await readJsonResponse(response)
        quotes.push({ ...quote, id: crypto.randomUUID() })
      } catch (err) {
        setError(`Erro ao processar "${file.name}": ${err.message}`)
        setStage('error')
        return
      }
    }

    setStage('normalizing')

    try {
      const local = buildLocalGroups(quotes)
      let groups = local.groups
      let mode = 'local'

      if (quotes.length > 1 && local.confidence < 0.58) {
        const response = await fetch('/api/normalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quotes }),
        })
        const normalized = await readJsonResponse(response)
        groups = normalized.groups.map((group) => ({
          ...group,
          id: crypto.randomUUID(),
          quantity: Number(group.items?.[0]?.quantity || 1),
          notes: '',
        }))
        mode = 'hybrid-ai'
      }

      const meta = {
        processingMode: mode,
        localConfidence: Number(local.confidence.toFixed(2)),
        createdAt: new Date().toISOString(),
      }
      const result = ensureComparisonIds({ quotes, groups, meta })
      setComparison(result)
      setProcessingInfo(meta)
      setStage('done')
      await saveComparison(result)
    } catch (err) {
      setError(`Erro ao comparar: ${err.message}`)
      setStage('error')
    }
  }

  function exportCsv() {
    if (!comparison) return

    const suppliers = getSuppliers(comparison)
    const groups = sortGroups(comparison.groups, suppliers, sortBy, sortDir)
    const csv = createComparisonCsv(comparison, groups)
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `comparacao_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  function updateSupplier(supplierId, supplier) {
    markChanged({
      ...comparison,
      quotes: comparison.quotes.map((quote) => quote.id === supplierId ? { ...quote, supplier } : quote),
      groups: comparison.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => item.source_id === supplierId ? { ...item, source: supplier } : item),
      })),
    })
  }

  function addSupplier() {
    const id = crypto.randomUUID()
    markChanged({
      ...comparison,
      quotes: [...comparison.quotes, {
        id,
        supplier: `Fornecedor ${comparison.quotes.length + 1}`,
        fileName: 'Cotação manual',
        manual: true,
        items: [],
      }],
    })
  }

  function removeSupplier(supplierId) {
    if (!window.confirm('Remover este fornecedor e todos os preços vinculados?')) return
    markChanged({
      ...comparison,
      quotes: comparison.quotes.filter((quote) => quote.id !== supplierId),
      groups: comparison.groups.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.source_id !== supplierId),
      })),
    })
  }

  function addGroup() {
    markChanged({
      ...comparison,
      groups: [...comparison.groups, {
        id: crypto.randomUUID(),
        normalized_name: 'Novo item',
        unit: 'un',
        quantity: 1,
        notes: '',
        items: [],
      }],
    })
  }

  function updateGroup(groupId, field, value) {
    markChanged({
      ...comparison,
      groups: comparison.groups.map((group) => group.id === groupId
        ? { ...group, [field]: field === 'quantity' ? Math.max(0, Number(value || 0)) : value }
        : group),
    })
  }

  function removeGroup(groupId) {
    if (!window.confirm('Remover este item da comparação?')) return
    markChanged({
      ...comparison,
      groups: comparison.groups.filter((group) => group.id !== groupId),
    })
  }

  function updatePrice(groupId, supplierId, rawValue) {
    const unitPrice = parseMoneyInput(rawValue)
    const supplier = comparison.quotes.find((quote) => quote.id === supplierId)

    markChanged({
      ...comparison,
      groups: comparison.groups.map((group) => {
        if (group.id !== groupId) return group
        const existing = group.items.find((item) => item.source_id === supplierId)
        const remaining = group.items.filter((item) => item.source_id !== supplierId)
        if (!unitPrice) return { ...group, items: remaining }

        return {
          ...group,
          items: [...remaining, {
            source_id: supplierId,
            source: supplier?.supplier || supplier?.fileName || 'Fornecedor',
            unit_price: unitPrice,
            quantity: Number(group.quantity || existing?.quantity || 1),
            total_price: unitPrice * Number(group.quantity || existing?.quantity || 1),
          }],
        }
      }),
    })
  }

  async function importQuote(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setSaveError('O PDF deve ter no máximo 10 MB.')
      setSaveState('error')
      return
    }

    setImportState('processing')
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/process-pdf', { method: 'POST', body: formData })
      const quote = await readJsonResponse(response)
      const next = mergeQuoteIntoComparison(comparison, { ...quote, id: crypto.randomUUID() })
      markChanged(next)
      setImportState('done')
    } catch (err) {
      setSaveError(`Não foi possível importar a cotação: ${err.message}`)
      setSaveState('error')
      setImportState('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        hasComparison={Boolean(comparison)}
        onReset={reset}
        onExport={exportCsv}
        showLogout={accessProtected}
        historyEnabled={historyEnabled}
        userEmail={userEmail}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {!comparison ? (
          <UploadPanel
            files={files}
            stage={stage}
            progress={progress}
            error={error}
            inputRef={inputRef}
            onDrop={handleDrop}
            onFileInput={handleFileInput}
            onRemoveFile={(key) => setFiles((current) => current.filter((file) => file.key !== key))}
            onProcess={processAll}
          />
        ) : (
          <>
            <input ref={importInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={importQuote} />
            <ComparisonResults
              comparison={comparison}
              comparisonId={comparisonId}
              saveState={saveState}
              saveError={saveError}
              historyEnabled={historyEnabled}
              sortBy={sortBy}
              sortDir={sortDir}
              importState={importState}
              processingInfo={processingInfo}
              onSort={toggleSort}
              onSave={() => saveComparison(comparison)}
              onAddGroup={addGroup}
              onUpdateGroup={updateGroup}
              onRemoveGroup={removeGroup}
              onAddSupplier={addSupplier}
              onUpdateSupplier={updateSupplier}
              onRemoveSupplier={removeSupplier}
              onUpdatePrice={updatePrice}
              onImport={() => importInputRef.current?.click()}
            />
          </>
        )}
      </main>

      {authMode === 'shared' && (
        <p className="fixed bottom-3 right-3 text-[10px] text-slate-400 bg-white/90 border border-slate-200 rounded px-2 py-1">
          Modo temporário: senha compartilhada
        </p>
      )}
    </div>
  )
}
