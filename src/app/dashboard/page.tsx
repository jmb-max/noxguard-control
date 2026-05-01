import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si es guardia o no tiene perfil definido, redirigir a formularios
  if (!profile || profile?.role === 'guard') redirect('/forms')

  // Métricas básicas
  const hoy = new Date().toISOString().split('T')[0]
  const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { count: countHoy } = await supabase
    .from('inspecciones_contenedor')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hoy)

  const { count: countSemana } = await supabase
    .from('inspecciones_contenedor')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', inicioSemana)

  const { count: countMes } = await supabase
    .from('inspecciones_contenedor')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', inicioMes)

  // Registros recientes
  const { data: registros } = await supabase
    .from('inspecciones_contenedor')
    .select('id, form_no, created_at, placa_veh, num_contenedor, nombre_conductor, guard_id')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            Panel de Control
          </p>
          <h1 className="text-lg font-bold tracking-wide" style={{ color: 'var(--text)' }}>
            Dashboard
          </h1>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Hoy', value: countHoy ?? 0 },
            { label: 'Esta semana', value: countSemana ?? 0 },
            { label: 'Este mes', value: countMes ?? 0 },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-4 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{m.value}</div>
              <div className="text-xs tracking-wider uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabla registros */}
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: 'var(--border)', background: 'rgba(30,111,255,0.08)' }}>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
              📋 Registros Recientes
            </span>
          </div>

          {registros && registros.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Formulario', 'Fecha', 'Placa', 'Contenedor', 'Conductor'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold tracking-widest uppercase"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}
                      className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--accent)' }}>
                        {r.form_no || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">{r.placa_veh || '—'}</td>
                      <td className="px-4 py-3">{r.num_contenedor || '—'}</td>
                      <td className="px-4 py-3">{r.nombre_conductor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-xs tracking-wider"
              style={{ color: 'var(--text-dim)' }}>
              No hay registros aún
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
