'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ background: 'var(--accent)' }}>🛡</div>
          <span className="font-bold tracking-widest text-sm uppercase"
            style={{ color: 'var(--text)' }}>NoxGuard Control</span>
        </div>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Sistema de Inspecciones
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm rounded-xl p-6 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        <h2 className="text-xs font-bold tracking-widest uppercase mb-6"
          style={{ color: 'var(--accent)' }}>Acceso al Sistema</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="guardia@psi.co"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-center py-2 rounded"
              style={{ color: 'var(--danger)', background: 'rgba(255,59,59,0.1)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-xs tracking-widest uppercase text-white mt-2 transition-opacity"
            style={{ background: loading ? 'var(--text-dim)' : 'var(--accent)' }}>
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs" style={{ color: 'var(--text-dim)' }}>
        PSI — NOX GUARD · 2026
      </p>
    </div>
  )
}
