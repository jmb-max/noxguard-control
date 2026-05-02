import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener perfil directo de tabla usuarios (sin RPC que puede fallar)
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()
  
  const userRole = usuarios?.rol ?? null

  // Solo redirigir si el rol es explícitamente 'guarda'
  if (userRole === 'guarda') redirect('/forms')

  // KPIs
  const hoy = new Date().toISOString().split('T')[0]
  const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: countHoy },
    { count: countSemana },
    { count: countMes },
    { count: countTotal },
    { data: registros }
  ] = await Promise.all([
    supabase
      .from('inspecciones_contenedor')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoy),
    supabase
      .from('inspecciones_contenedor')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioSemana),
    supabase
      .from('inspecciones_contenedor')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes),
    supabase
      .from('inspecciones_contenedor')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('inspecciones_contenedor')
      .select('id, form_no, created_at, placa_veh, num_contenedor, nombre_conductor, guard_id, ubicacion')
      .order('created_at', { ascending: false })
      .limit(50)
  ])

  const kpis = [
    { label: 'Hoy', value: countHoy ?? 0 },
    { label: 'Esta semana', value: countSemana ?? 0 },
    { label: 'Este mes', value: countMes ?? 0 },
    { label: 'Total histórico', value: countTotal ?? 0 },
  ]

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB' }}>
      <Header userName={user.email ?? ''} userRole={userRole} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>

        {/* Header visual */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0B1D3A',
            fontFamily: 'Outfit, sans-serif',
            margin: 0,
            lineHeight: 1.1
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#7A90B0', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
            Panel de Supervisión · {fechaHoy}
          </p>
        </div>

        {/* KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 28
        }}
          className="kpi-grid"
        >
          {kpis.map(m => (
            <div key={m.label} style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid #D0D9E8',
              boxShadow: '0 2px 8px rgba(11,29,58,0.06)'
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#0B1D3A',
                fontFamily: 'monospace',
                lineHeight: 1
              }}>
                {m.value}
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#7A90B0',
                marginTop: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Outfit, sans-serif'
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard client: filtros + tabla */}
        <DashboardClient registros={registros ?? []} />
      </main>

      <style>{`
        @media (min-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
