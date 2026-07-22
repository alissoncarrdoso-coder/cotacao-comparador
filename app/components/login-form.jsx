'use client'

import { useState } from 'react'
import { LockKeyhole, LoaderCircle, TrendingDown } from 'lucide-react'

export default function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível entrar')
      }

      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Comparador de Cotações</h1>
            <p className="text-sm text-slate-500">Acesso restrito</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Senha de acesso</span>
            <div className="mt-1.5 relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                autoFocus
                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite a senha compartilhada"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}
