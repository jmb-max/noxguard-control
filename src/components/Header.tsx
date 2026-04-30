'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 border-b"
      style={{
        background: 'linear-gradient(135deg, #0d1b3e 0%, #1a1d27 100%)',
        borderColor: 'var(--accent)'
      }}>

      <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: 'var(--accent)' }}>🛡</div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold tracking-widest uppercase truncate"
          style={{ color: 'var(--text)' }}>NoxGuard Control</div>
        {userRole && (
          <div className="text-xs tracking-wider"
            style={{ color: 'var(--text-muted)' }}>
            {userRole === 'admin' ? 'ADMINISTRADOR' : userRole === 'supervisor' ? 'SUPERVISOR' : 'GUARDIA'}
          </div>
        )}
      </div>

      {userName && (
        <span className="text-xs hidden sm:block truncate max-w-[120px]"
          style={{ color: 'var(--text-muted)' }}>{userName}</span>
      )}

      <button
        onClick={handleLogout}
        className="text-xs px-3 py-1.5 rounded border tracking-wider uppercase flex-shrink-0"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        SALIR
      </button>
    </header>
  )
}
