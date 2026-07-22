'use client'

import { useState } from 'react'
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  TrendingDown,
  UserPlus,
} from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

function friendlyAuthError(message) {
  const text = String(message || '')
  if (/invalid login credentials/i.test(text)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(text)) return 'Confirme seu e-mail antes de entrar.'
  if (/user already registered/i.test(text)) return 'Este e-mail já possui cadastro.'
  if (/password should be at least/i.test(text)) return 'A senha deve possuir pelo menos 6 caracteres.'
  if (/rate limit/i.test(text)) return 'Muitas tentativas. Aguarde alguns minutos.'
  return text || 'Não foi possível concluir a operação.'
}

export default function LoginForm({ authMode = 'shared', initialError = '' }) {
  const supabaseMode = authMode === 'supabase'
  const [screen, setScreen] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSharedLogin() {
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
  }

  async function handleSupabaseAuth() {
    const supabase = createClient()

    if (screen === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
      if (data.session) {
        window.location.href = '/'
        return
      }

      setMessage('Cadastro realizado. Abra o e-mail de confirmação para ativar sua conta.')
      setScreen('login')
      return
    }

    if (screen === 'reset') {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (authError) throw authError
      setMessage('Enviamos um link de recuperação para seu e-mail.')
      setScreen('login')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) throw authError
    window.location.href = '/'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (supabaseMode) await handleSupabaseAuth()
      else await handleSharedLogin()
    } catch (err) {
      setError(supabaseMode ? friendlyAuthError(err.message) : err.message)
    } finally {
      setLoading(false)
    }
  }

  const title = supabaseMode
    ? screen === 'signup'
      ? 'Criar sua conta'
      : screen === 'reset'
        ? 'Recuperar senha'
        : 'Entrar na plataforma'
    : 'Acesso restrito'

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-7 sm:p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Comparador de Cotações</h1>
            <p className="text-sm text-slate-500">{title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {supabaseMode && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="voce@empresa.com"
                />
              </div>
            </label>
          )}

          {screen !== 'reset' && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {supabaseMode ? 'Senha' : 'Senha de acesso'}
              </span>
              <div className="mt-1.5 relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={screen === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={supabaseMode ? 6 : undefined}
                  autoFocus={!supabaseMode}
                  className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={supabaseMode ? 'Mínimo de 6 caracteres' : 'Digite a senha compartilhada'}
                />
              </div>
            </label>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : screen === 'signup' ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            {screen === 'signup' ? 'Criar conta' : screen === 'reset' ? 'Enviar recuperação' : 'Entrar'}
          </button>
        </form>

        {supabaseMode && (
          <div className="mt-5 pt-5 border-t border-slate-100 text-sm text-center space-y-2">
            {screen === 'login' ? (
              <>
                <button type="button" onClick={() => { setScreen('signup'); setError(''); setMessage('') }} className="text-blue-700 hover:underline">
                  Ainda não tenho conta
                </button>
                <span className="text-slate-300 mx-2">•</span>
                <button type="button" onClick={() => { setScreen('reset'); setError(''); setMessage('') }} className="text-slate-600 hover:underline">
                  Esqueci minha senha
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setScreen('login'); setError(''); setMessage('') }} className="text-blue-700 hover:underline">
                Voltar para o login
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
