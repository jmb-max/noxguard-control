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
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0B1D3A 0%, #1a3060 50%, #0B1D3A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Outfit, sans-serif',
    }}>

      {/* Fondo decorativo */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(240,90,40,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(29,111,232,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #F05A28 0%, #d44820 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(240,90,40,0.4)',
          }}>🛡</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
            NoxGuard<span style={{ color: '#F05A28' }}>Control</span>
          </div>
          <div style={{ fontSize: 11, color: '#7A90B0', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
            Sistema de Inspecciones · PSI Security
          </div>
        </div>

        {/* Card de login */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '32px 28px',
          backdropFilter: 'blur(12px)',
        }}>

          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 6, letterSpacing: '0.05em' }}>
            Acceso al Sistema
          </h2>
          <p style={{ fontSize: 12, color: '#7A90B0', marginBottom: 28 }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#A0AFC4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@psi.co"
                required
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '12px 14px',
                  color: '#ffffff', fontSize: 14,
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#A0AFC4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '12px 14px',
                  color: '#ffffff', fontSize: 14,
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 12, color: '#f87171', textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(240,90,40,0.5)' : 'linear-gradient(135deg, #F05A28 0%, #d44820 100%)',
                border: 'none', borderRadius: 10,
                padding: '14px', color: '#ffffff',
                fontSize: 13, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(240,90,40,0.3)',
                marginTop: 4,
              }}>
              {loading ? 'Ingresando...' : '→ Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#3D5277', letterSpacing: '0.08em' }}>
          PSI · NOX GUARD · 2026
        </p>
      </div>
    </div>
  )
}
