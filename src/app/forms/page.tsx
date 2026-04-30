import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

export default async function FormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const formularios = [
    {
      id: 'inspeccion-contenedor',
      icon: '📦',
      titulo: 'Inspección Contenedores',
      descripcion: 'Registro completo de inspección antinarcóticos',
      activo: true,
    },
    {
      id: 'inspeccion-vehiculo',
      icon: '🚛',
      titulo: 'Inspección Vehículo',
      descripcion: 'Próximamente',
      activo: false,
    },
    {
      id: 'inspeccion-personal',
      icon: '👤',
      titulo: 'Inspección Personal',
      descripcion: 'Próximamente',
      activo: false,
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            Formularios Operativos
          </p>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Seleccione el tipo de inspección
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          {formularios.map(f => (
            f.activo ? (
              <Link key={f.id} href={`/forms/${f.id}`}
                className="rounded-xl border p-4 flex items-center gap-4 transition-all active:scale-95"
                style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}>
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <div className="font-bold text-sm tracking-wide" style={{ color: 'var(--text)' }}>
                    {f.titulo}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {f.descripcion}
                  </div>
                </div>
                <span className="ml-auto text-xl" style={{ color: 'var(--accent)' }}>→</span>
              </Link>
            ) : (
              <div key={f.id}
                className="rounded-xl border p-4 flex items-center gap-4 opacity-40"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <div className="font-bold text-sm tracking-wide" style={{ color: 'var(--text)' }}>
                    {f.titulo}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {f.descripcion}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {(profile?.role === 'supervisor' || profile?.role === 'admin') && (
          <div className="mt-6">
            <Link href="/dashboard"
              className="text-xs tracking-wider uppercase"
              style={{ color: 'var(--accent)' }}>
              ← Ver Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
