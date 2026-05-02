'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel =
    userRole === 'admin'       ? 'Administrador' :
    userRole === 'directivo'   ? 'Directivo' :
    userRole === 'coordinador' ? 'Coordinador' :
    userRole === 'supervisor'  ? 'Supervisor' :
    userRole === 'client'      ? 'Cliente' :
    userRole === 'guard'       ? 'Guarda' : null

  // Navegación por rol
  const navLinks = (() => {
    switch (userRole) {
      case 'admin':
        return [
          { href: '/dashboard/admin', label: 'Panel Admin' },
          { href: '/dashboard',       label: 'Dashboard' },
          { href: '/forms',           label: 'Formularios' },
        ]
      case 'supervisor':
      case 'coordinador':
      case 'directivo':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/forms',     label: 'Formularios' },
        ]
      case 'client':
        return [
          { href: '/dashboard', label: 'Dashboard' },
        ]
      case 'guard':
        return [
          { href: '/forms', label: 'Formularios' },
        ]
      default:
        return []
    }
  })()

  // Destino del logo según rol
  const homeHref =
    userRole === 'admin' ? '/dashboard/admin' :
    userRole === 'guard' ? '/forms' :
    '/dashboard'

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#0B1D3A',
      borderBottom: '3px solid #F05A28',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 16px', height: 56,
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* Logo */}
      <Link href={homeHref}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #F05A28 0%, #d44820 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 2px 8px rgba(240,90,40,0.4)',
        }}>🛡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.03em', lineHeight: 1.2 }}>
            NoxGuard<span style={{ color: '#F05A28' }}>Control</span>
          </div>
        </div>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Nav links */}
      {navLinks.length > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href} style={{
                fontSize: 11, fontWeight: 600,
                color: isActive ? '#ffffff' : '#A0AFC4',
                textDecoration: 'none',
                padding: '5px 10px', borderRadius: 6,
                letterSpacing: '0.05em',
                background: isActive ? 'rgba(240,90,40,0.15)' : 'transparent',
                borderBottom: isActive ? '2px solid #F05A28' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Usuario + rol */}
      {userName && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 }}>
          <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          {roleLabel && (
            <span style={{ fontSize: 9, color: '#F05A28', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {roleLabel}
            </span>
          )}
        </div>
      )}

      {/* Botón Salir */}
      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(240,90,40,0.12)',
        border: '1.5px solid rgba(240,90,40,0.3)',
        borderRadius: 8, padding: '6px 12px',
        color: '#F05A28', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', cursor: 'pointer',
        textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        ⏻ Salir
      </button>
    </header>
  )
}
