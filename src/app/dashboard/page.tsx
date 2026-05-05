import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import DashboardClient from './DashboardClient'
import ChatIA from '@/components/ChatIA'
import type { EventoDia, EventoTipo, HeatmapCell } from '@/components/GraficasZona5'

/**
 * Dashboard agnóstico — lee de v_eventos_unificados (vista que une las 11 tablas
 * de formularios) en lugar de inspecciones_contenedor solamente.
 *
 * Filtros server-side aplicados aquí (vía URLSearchParams):
 *   - desde / hasta  (date range sobre fecha)
 *   - cliente_id     (filtrar por cliente)
 *   - puesto_id      (filtrar por puesto, depende de cliente)
 *   - tipos          (multi-select de tipo_evento, separado por coma)
 *   - autor_id       (guard / supervisor / coordinator)
 *   - novedad        ('si' = solo con novedad)
 *   - q              (buscar por placa o resumen)
 *
 * Listas para los filtros (clientes, puestos, autores, tipos) se cargan también
 * server-side y se pasan como props al cliente.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Perfil del usuario (rol + asignaciones para F4)
  const { data: usuarioPerfil } = await supabase
    .from('usuarios')
    .select('id, rol, zona, cliente_id')
    .eq('auth_id', user.id)
    .single()
  const userRole = usuarioPerfil?.rol ?? null
  const userZona = usuarioPerfil?.zona ?? null
  const userClienteId = (usuarioPerfil as any)?.cliente_id ?? null

  // Guardas van a /forms (no ven dashboard agregado)
  if (userRole === 'guarda') redirect('/forms')

  // ─── Parsear filtros desde la URL ────────────────────────────────────────
  const sp = await searchParams
  const get = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  // ─── F4: defaultFilters por rol ──────────────────────────────────────────
  // Si el usuario no pasó filtros explícitos en la URL, aplicar scope por rol:
  //   cliente    → forzar cliente_id al suyo (no puede ver otros)
  //   supervisor → pre-seleccionar su zona (puede cambiar manualmente)
  //   coordinador con cliente_id → pre-seleccionar su cliente
  //   admin/directivo → sin restricciones
  const urlClienteId = get('cliente_id') ?? ''
  const urlZona = get('zona') ?? ''

  const defaultClienteId: string =
    userRole === 'cliente' && userClienteId
      ? userClienteId                         // forzado, no overrideable
      : userRole === 'coordinador' && userClienteId && !urlClienteId
        ? userClienteId                       // precargado, puede cambiar
        : urlClienteId

  const defaultZona: string =
    userRole === 'supervisor' && userZona && !urlZona
      ? userZona   // precargado, puede cambiar
      : urlZona

  const f = {
    desde: get('desde') ?? '',
    hasta: get('hasta') ?? '',
    cliente_id: defaultClienteId,
    puesto_id: get('puesto_id') ?? '',
    zona: defaultZona,
    tipos: (get('tipos') ?? '').split(',').filter(Boolean),
    autor_id: get('autor_id') ?? '',
    novedad: get('novedad') ?? '', // 'si' | ''
    q: get('q') ?? '',
    // Metadatos de scope para el cliente
    isClienteRestringido: userRole === 'cliente' && !!userClienteId,
  }

  // ─── Construir query base con filtros aplicados ──────────────────────────
  // Helper: aplica los filtros comunes a una query de Supabase (post-select)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any) => {
    if (f.desde) q = q.gte('fecha', f.desde)
    if (f.hasta) {
      // Hasta inclusive: agregar 23:59:59 al hasta
      const hastaEnd = `${f.hasta}T23:59:59.999Z`
      q = q.lte('fecha', hastaEnd)
    }
    if (f.cliente_id) q = q.eq('cliente_id', f.cliente_id)
    if (f.puesto_id) q = q.eq('puesto_id', f.puesto_id)
    if (f.zona) q = q.eq('zona', f.zona)
    if (f.tipos.length) q = q.in('tipo_evento', f.tipos)
    if (f.autor_id) q = q.eq('autor_id', f.autor_id)
    if (f.novedad === 'si') q = q.eq('tiene_novedad', true)
    if (f.q) {
      // Busca en placa o resumen
      q = q.or(`placa.ilike.%${f.q}%,resumen.ilike.%${f.q}%`)
    }
    return q
  }

  // ─── KPIs (5 conteos: hoy, semana, mes, total, novedades) ────────────────
  const hoy = new Date().toISOString().split('T')[0]
  const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Aplicamos los filtros activos a los KPIs (excepto los de tiempo, que se sustituyen por el rango del KPI)
  const kpiBase = () => {
    let q = supabase.from('v_eventos_unificados').select('*', { count: 'exact', head: true })
    if (f.cliente_id) q = q.eq('cliente_id', f.cliente_id)
    if (f.puesto_id) q = q.eq('puesto_id', f.puesto_id)
    if (f.tipos.length) q = q.in('tipo_evento', f.tipos)
    if (f.autor_id) q = q.eq('autor_id', f.autor_id)
    return q
  }

  // ─── Datos maestros para filtros (clientes, puestos, autores, tipos) ─────
  const [
    { count: countHoy },
    { count: countSemana },
    { count: countMes },
    { count: countTotal },
    { count: countNovedades },
    { data: rows },
    { count: rowsCount },
    { data: clientes },
    { data: puestos },
    { data: autores },
    { data: graficaDia },
    { data: graficaTipo },
    { data: graficaHeat },
  ] = await Promise.all([
    kpiBase().gte('fecha', hoy),
    kpiBase().gte('fecha', inicioSemana),
    kpiBase().gte('fecha', inicioMes),
    kpiBase(),
    kpiBase().eq('tiene_novedad', true),
    applyFilters(
      supabase
        .from('v_eventos_unificados')
        .select('*')
    )
      .order('fecha', { ascending: false, nullsFirst: false })
      .limit(100),
    applyFilters(
      supabase
        .from('v_eventos_unificados')
        .select('*', { count: 'exact', head: true })
    ),
    supabase.from('clientes').select('id, nombre, zona').eq('activo', true).order('nombre'),
    supabase.from('puestos').select('id, nombre, cliente_id, numero, coords_lat, coords_lng').eq('activo', true).order('nombre'),
    supabase.from('usuarios').select('id, auth_id, nombre, email, rol').eq('activo', true).order('email'),
    // F3 — datos para gráficas (usa chat_query que tiene permisos para authenticated)
    supabase.rpc('chat_query', { sql: `
      SELECT DATE(fecha) as dia, tipo_evento, tipo_label, COUNT(*)::int as total
      FROM public.v_eventos_unificados
      WHERE fecha >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(fecha), tipo_evento, tipo_label
      ORDER BY dia ASC
    `}),
    supabase.rpc('chat_query', { sql: `
      SELECT tipo_evento, tipo_label, COUNT(*)::int as total
      FROM public.v_eventos_unificados
      GROUP BY tipo_evento, tipo_label
      ORDER BY total DESC
    `}),
    supabase.rpc('chat_query', { sql: `
      SELECT EXTRACT(DOW FROM fecha)::int as dow, EXTRACT(HOUR FROM fecha)::int as hora, COUNT(*)::int as total
      FROM public.v_eventos_unificados
      WHERE fecha IS NOT NULL
      GROUP BY dow, hora
      ORDER BY dow, hora
    `}),
  ])

  const kpis = [
    { label: 'Hoy', value: countHoy ?? 0, kpiKey: 'hoy' },
    { label: 'Esta semana', value: countSemana ?? 0, kpiKey: 'semana' },
    { label: 'Este mes', value: countMes ?? 0, kpiKey: 'mes' },
    { label: 'Total', value: countTotal ?? 0, kpiKey: 'total' },
    { label: 'Novedades', value: countNovedades ?? 0, kpiKey: 'novedades', alert: (countNovedades ?? 0) > 0 },
  ]

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Extraer rows de las respuestas RPC (chat_query devuelve array directo)
  const rowsDia   = (Array.isArray(graficaDia)  ? graficaDia  : []) as EventoDia[]
  const rowsTipo  = (Array.isArray(graficaTipo) ? graficaTipo : []) as EventoTipo[]
  const rowsHeat  = (Array.isArray(graficaHeat) ? graficaHeat : []) as HeatmapCell[]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB' }}>
      <Header userName={user.email ?? ''} userRole={userRole} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', margin: 0, lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#7A90B0', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
            Panel de Operaciones · {fechaHoy}
          </p>
        </div>

        <DashboardClient
          rows={rows ?? []}
          totalRows={rowsCount ?? 0}
          kpis={kpis}
          clientes={clientes ?? []}
          puestos={puestos ?? []}
          autores={autores ?? []}
          activeFilters={f}
          eventosPorDia={rowsDia}
          eventosPorTipo={rowsTipo}
          heatmap={rowsHeat}
          userRole={userRole ?? ''}
          isClienteRestringido={f.isClienteRestringido}
        />
      </main>

      {/* Chat IA flotante */}
      <ChatIA userRol={userRole ?? ''} userName={user.email ?? ''} />
    </div>
  )
}
