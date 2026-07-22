import { AlertCircle, FileText, LoaderCircle, Trash2, Upload } from 'lucide-react'

export default function UploadPanel({
  files,
  stage,
  progress,
  error,
  inputRef,
  onDrop,
  onFileInput,
  onRemoveFile,
  onProcess,
}) {
  const processing = stage === 'extracting' || stage === 'normalizing'
  const stageLabel = stage === 'extracting'
    ? `Lendo PDF ${progress.current} de ${progress.total}…`
    : 'Comparando e normalizando itens…'

  return (
    <section className="max-w-2xl mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="Selecionar arquivos PDF"
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group"
      >
        <Upload className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
        <p className="text-lg font-semibold text-slate-700 group-hover:text-blue-700">
          Arraste os PDFs aqui ou clique para selecionar
        </p>
        <p className="text-sm text-slate-400 mt-1">Até 10 arquivos, com no máximo 10 MB cada</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          onChange={onFileInput}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div key={file.key} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm">
              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={() => onRemoveFile(file.key)}
                aria-label={`Remover ${file.name}`}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {processing && (
        <div className="mt-4 bg-white border border-slate-200 rounded-lg p-5 shadow-sm" aria-live="polite">
          <div className="flex items-center gap-3 mb-3">
            <LoaderCircle className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-slate-700">{stageLabel}</span>
          </div>
          {stage === 'extracting' && progress.total > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {(stage === 'idle' || stage === 'error') && (
        <button
          type="button"
          onClick={onProcess}
          disabled={files.length === 0}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
        >
          Comparar {files.length > 0 ? `${files.length} orçamento${files.length > 1 ? 's' : ''}` : 'orçamentos'}
        </button>
      )}
    </section>
  )
}
