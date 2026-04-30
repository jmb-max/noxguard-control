import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NoxGuard Control',
  description: 'Sistema de Inspecciones PSI / Nox Guard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  )
}
