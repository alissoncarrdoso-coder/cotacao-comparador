'use client'

import { useRef, useState } from 'react'
import AppHeader from './app-header'
import ComparisonResults from './comparison-results'
import UploadPanel from './upload-panel'
import { createComparisonCsv, getSuppliers, sortGroups } from '../../lib/comparison'

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

export default function ComparatorApp({ accessProtected = false }) {
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const inputRef = useRef(null)

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
    setFiles([])
    setStage('idle')
    setProgress({ current: 0, total: 0 })
    setComparison(null)
    setError('')
    setSortBy('name')
    setSortDir('asc')
  }

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((direction) => direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir(column === 'economy' ? 'desc' : 'asc')
    }
  }

  async function processAll() {
    if (!files.length) {
      setError('Selecione pelo menos um PDF')
      return
    }

    setStage('extracting')
    setError('')
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
      const response = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes }),
      })
      const normalized = await readJsonResponse(response)
      setComparison({ quotes, groups: normalized.groups })
      setStage('done')
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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        hasComparison={Boolean(comparison)}
        onReset={reset}
        onExport={exportCsv}
        showLogout={accessProtected}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
          <ComparisonResults
            comparison={comparison}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        )}
      </main>
    </div>
  )
}
