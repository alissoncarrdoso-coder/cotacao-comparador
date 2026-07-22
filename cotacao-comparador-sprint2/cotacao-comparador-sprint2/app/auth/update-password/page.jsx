'use client'

import { useState } from 'react'
import { CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve possuir pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmation) {
      setError('As senhas não são iguais.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        {saved ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900">Senha atualizada</h1>
            <p className="text-sm text-slate-500 mt-2">Sua nova senha já pode ser utilizada.</p>
            <a href="/" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700">
              Entrar na plataforma
            </a>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">Definir nova senha</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Escolha uma senha com pelo menos 6 caracteres.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[['Nova senha', password, setPassword], ['Confirmar senha', confirmation, setConfirmation]].map(([label, value, setter]) => (
                <label key={label} className="block">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <div className="mt-1.5 relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={value}
                      onChange={(event) => setter(event.target.value)}
                      required
                      minLength={6}
                      className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </label>
              ))}
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
                {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
                Salvar nova senha
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
