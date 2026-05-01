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
        background: '#0B1D3A',
        borderColor: '#1a3060'
      }}>

      <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: '#F05A28' }}>🛡</div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold tracking-widest uppercase truncate"
          style={{ color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>NoxGuard Control</div>
        {userRole && (
          <div className="text-xs tracking-wider"
            style={{ color: '#7A90B0', fontFamily: 'Outfit, sans-serif' }}>
            {userRole === 'admin' ? 'ADMINISTRADOR' : userRole === 'supervisor' ? 'SUPERVISOR' : 'GUARDIA'}
          </div>
        )}
      </div>

      {userName && (
        <span className="text-xs hidden sm:block truncate max-w-[120px]"
          style={{ color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>{userName}</span>
      )}

      <button
        onClick={handleLogout}
        className="text-xs px-3 py-1.5 rounded border tracking-wider uppercase flex-shrink-0"
        style={{ borderColor: '#2a4070', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
        SALIR
      </button>
    </header>
  )
}
