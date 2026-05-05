'use client'
/**
 * DashboardClient — UI agnóstica que muestra eventos de los 11 formularios
 * con filtros 4 niveles + tabla unificada + export CSV.
 *
 * Los filtros NO se aplican client-side: se serializan en la URL
 * (?desde=...&cliente_id=...) y la página servidor re-renderiza con la
 * nueva data filtrada. Esto permite paginación correcta y escala bien.
 */

import { useState, useTransition, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import FeedEnVivo from '@/components/FeedEnVivo'
import GraficasZona5, { type EventoDia, type EventoTipo, type HeatmapCell } from '@/components/GraficasZona5'

// Leaflet requiere ssr:false — accede al DOM en el top-level
const MapaPuestos = dynamic(() => import('@/components/MapaPuestos'), { ssr: false })

interface Cliente { id: string; nombre: string; zona: string | null }
interface Puesto  { id: string; nombre: string; cliente_id: string | null; numero: string | null; coords_lat?: number | null; coords_lng?: number | null }
interface Autor   { id: string; auth_id: string | null; nombre: string | null; email: string | null; rol: string | null }

interface Evento {
  tipo_evento: string
  tipo_label: string
  id: string
  form_no: string | null
  fecha: string | null
  cliente_id: string | null
  puesto_id: string | null
  autor_id: string | null
  autor_rol: string | null
  tiene_novedad: boolean
  descripcion_novedad: string | null
  coords_lat: number | null
  coords_lng: number | null
  resumen: string | null
  placa: string | null
  ubicacion_texto: string | null
}

interface KPI { label: string; value: number; kpiKey: string; alert?: boolean }

interface ActiveFilters {
  desde: string
  hasta: string
  cliente_id: string
  puesto_id: string
  tipos: string[]
  autor_id: string
  novedad: string
  q: string
}

interface Props {
  rows: Evento[]
  totalRows: number
  kpis: KPI[]
  clientes: Cliente[]
  puestos: Puesto[]
  autores: Autor[]
  activeFilters: ActiveFilters
  eventosPorDia: EventoDia[]
  eventosPorTipo: EventoTipo[]
  heatmap: HeatmapCell[]
}

const TIPOS_EVENTO = [
  { slug: 'inspeccion_contenedor', label: 'Inspección Contenedor', icon: '📦' },
  { slug: 'control_armas',         label: 'Control Armas',         icon: '🔫' },
  { slug: 'atencion_alarmas',      label: 'Atención Alarma',       icon: '🚨' },
  { slug: 'supervision_diaria',    label: 'Sup. Diaria',           icon: '👁️' },
  { slug: 'supervision_general',   label: 'Sup. General',          icon: '📋' },
  { slug: 'chequeo_moto',          label: 'Chequeo Moto',          icon: '🏍️' },
  { slug: 'alerta_riesgos',        label: 'Alerta Riesgo',         icon: '⚠️' },
  { slug: 'ronda_ingenio',         label: 'Ronda Ingenio',         icon: '🌾' },
  { slug: 'ronda_hospital',        label: 'Ronda Hospital',        icon: '🏥' },
  { slug: 'visita_cliente',        label: 'Visita Cliente',        icon: '🤝' },
  { slug: 'descargues_ara',        label: 'Descargue ARA',         icon: '🏪' },
]

const TIPO_META = Object.fromEntries(TIPOS_EVENTO.map(t => [t.slug, t]))

export default function DashboardClient(p: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  // Estado local de los filtros (los que no se han aplicado todavía)
  const [draft, setDraft] = useState<ActiveFilters>(p.activeFilters)

  // Aplicar filtros = navegar a la misma página con los nuevos params
  const apply = (patch: Partial<ActiveFilters> = {}) => {
    const merged = { ...draft, ...patch }
    setDraft(merged)
    const params = new URLSearchParams()
    if (merged.desde) params.set('desde', merged.desde)
    if (merged.hasta) params.set('hasta', merged.hasta)
    if (merged.cliente_id) params.set('cliente_id', merged.cliente_id)
    if (merged.puesto_id) params.set('puesto_id', merged.puesto_id)
    if (merged.tipos.length) params.set('tipos', merged.tipos.join(','))
    if (merged.autor_id) params.set('autor_id', merged.autor_id)
    if (merged.novedad) params.set('novedad', merged.novedad)
    if (merged.q) params.set('q', merged.q)
    const url = params.toString() ? `${pathname}?${params}` : pathname
    startTransition(() => router.push(url))
  }

  const limpiar = () => {
    setDraft({ desde: '', hasta: '', cliente_id: '', puesto_id: '', tipos: [], autor_id: '', novedad: '', q: '' })
    startTransition(() => router.push(pathname))
  }

  const hayFiltros = !!(p.activeFilters.desde || p.activeFilters.hasta || p.activeFilters.cliente_id ||
    p.activeFilters.puesto_id || p.activeFilters.tipos.length || p.activeFilters.autor_id ||
    p.activeFilters.novedad || p.activeFilters.q)

  // Puestos del cliente seleccionado (cascading)
  const puestosFiltrados = useMemo(() => {
    if (!draft.cliente_id) return p.puestos
    return p.puestos.filter(x => x.cliente_id === draft.cliente_id)
  }, [draft.cliente_id, p.puestos])

  // Helper: aplicar quick-range
  const setRangoRapido = (kind: 'hoy' | 'semana' | 'mes') => {
    const now = new Date()
    let desde = ''
    if (kind === 'hoy') desde = now.toISOString().split('T')[0]
    else if (kind === 'semana') desde = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    else if (kind === 'mes')    desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    apply({ desde, hasta: '' })
  }

  // Lookup helpers para mostrar nombres en lugar de UUIDs
  const clienteNombre = (id: string | null) =>
    id ? (p.clientes.find(c => c.id === id)?.nombre ?? '—') : '—'
  const puestoNombre = (id: string | null) =>
    id ? (p.puestos.find(x => x.id === id)?.nombre ?? '—') : '—'
  const autorNombre = (id: string | null) => {
    if (!id) return '—'
    // El autor_id puede ser auth.users.id (de los forms que usan userId del auth)
    // o usuarios.id. Probamos ambos.
    const u = p.autores.find(a => a.auth_id === id || a.id === id)
    return u?.nombre || u?.email?.split('@')[0] || id.slice(0, 8) + '…'
  }

  // Export CSV (de los rows visibles)
  const exportCSV = () => {
    const headers = ['Tipo', 'Fecha', 'Cliente', 'Puesto', 'Autor', 'Resumen', 'Placa', 'Ubicación', 'Novedad', 'Descripción']
    const rows = p.rows.map(r => [
      r.tipo_label,
      r.fecha ? new Date(r.fecha).toLocaleString('es-CO') : '',
      clienteNombre(r.cliente_id),
      puestoNombre(r.puesto_id),
      autorNombre(r.autor_id),
      r.resumen ?? '',
      r.placa ?? '',
      r.ubicacion_texto ?? '',
      r.tiene_novedad ? 'SÍ' : 'No',
      r.descripcion_novedad ?? '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eventos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Toggle de un tipo en el multi-select
  const toggleTipo = (slug: string) => {
    const tipos = draft.tipos.includes(slug)
      ? draft.tipos.filter(s => s !== slug)
      : [...draft.tipos, slug]
    apply({ tipos })
  }

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: 'opacity 0.15s' }}>
      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {p.kpis.map(k => (
          <button
            key={k.kpiKey}
            onClick={() => {
              if (k.kpiKey === 'novedades') apply({ novedad: 'si' })
              else if (k.kpiKey === 'hoy') setRangoRapido('hoy')
              else if (k.kpiKey === 'semana') setRangoRapido('semana')
              else if (k.kpiKey === 'mes') setRangoRapido('mes')
              else if (k.kpiKey === 'total') limpiar()
            }}
            style={{
              background: '#fff',
              border: `1.5px solid ${k.alert ? '#DC2626' : '#D0D9E8'}`,
              borderRadius: 14,
              padding: '16px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, color: k.alert ? '#DC2626' : '#0B1D3A', fontFamily: 'monospace' }}>
              {k.value}{k.alert && k.value > 0 ? ' ⚠️' : ''}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {k.label}
            </div>
          </button>
        ))}
      </div>

      {/* ── Zona 3: Mapa + Feed en vivo (60/40) ──────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        gap: 16,
        marginBottom: 20,
        height: 380,
      }}>
        {/* Mapa */}
        <div style={{
          border: '1px solid #D0D9E8',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
          background: '#E8E3D8',
        }}>
          <MapaPuestos
            puestos={p.puestos}
            clientes={p.clientes}
            eventos={p.rows}
            onPuestoClick={(puestoId, clienteId) => {
              apply({ puesto_id: puestoId, cliente_id: clienteId ?? '' })
            }}
          />
        </div>

        {/* Feed en vivo */}
        <FeedEnVivo
          clientes={p.clientes}
          puestos={p.puestos}
          autores={p.autores}
        />
      </div>

      {/* ── Filtros ──────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: '0 2px 8px rgba(11,29,58,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filtros
          </span>
          {hayFiltros && (
            <button onClick={limpiar} style={{ fontSize: 12, color: '#F05A28', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Nivel 1: TIEMPO */}
        <div style={{ marginBottom: 14 }}>
          <Label>Tiempo</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip onClick={() => setRangoRapido('hoy')}>Hoy</Chip>
            <Chip onClick={() => setRangoRapido('semana')}>Última semana</Chip>
            <Chip onClick={() => setRangoRapido('mes')}>Este mes</Chip>
            <span style={{ fontSize: 11, color: '#7A90B0', margin: '0 4px' }}>o rango:</span>
            <input type="date" value={draft.desde} onChange={e => setDraft({ ...draft, desde: e.target.value })} style={inp} />
            <span style={{ fontSize: 11, color: '#7A90B0' }}>→</span>
            <input type="date" value={draft.hasta} onChange={e => setDraft({ ...draft, hasta: e.target.value })} style={inp} />
            <button onClick={() => apply()} style={btnApply}>Aplicar</button>
          </div>
        </div>

        {/* Nivel 2: LUGAR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <Label>Cliente</Label>
            <select
              style={inp}
              value={draft.cliente_id}
              onChange={e => apply({ cliente_id: e.target.value, puesto_id: '' })}
            >
              <option value="">Todos los clientes</option>
              {p.clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}{c.zona ? ` · ${c.zona}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Puesto</Label>
            <select
              style={inp}
              value={draft.puesto_id}
              onChange={e => apply({ puesto_id: e.target.value })}
              disabled={!draft.cliente_id && p.puestos.length > 20}
            >
              <option value="">Todos los puestos</option>
              {puestosFiltrados.map(x => (
                <option key={x.id} value={x.id}>
                  {x.numero ? `#${x.numero} · ` : ''}{x.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nivel 3: QUIÉN + tipo de evento */}
        <div style={{ marginBottom: 14 }}>
          <Label>Tipo de evento (multi)</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIPOS_EVENTO.map(t => {
              const active = draft.tipos.includes(t.slug)
              return (
                <button
                  key={t.slug}
                  onClick={() => toggleTipo(t.slug)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    border: `1.5px solid ${active ? '#F05A28' : '#D0D9E8'}`,
                    background: active ? '#FFF3EE' : '#fff',
                    color: active ? '#F05A28' : '#3D5277',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  {t.icon} {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <Label>Autor (guarda/sup.)</Label>
            <select style={inp} value={draft.autor_id} onChange={e => apply({ autor_id: e.target.value })}>
              <option value="">Todos</option>
              {p.autores.map(a => (
                <option key={a.id} value={a.auth_id ?? a.id}>
                  {a.nombre || a.email?.split('@')[0] || a.id.slice(0, 8)} {a.rol ? `· ${a.rol}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nivel 4: ESTADO */}
          <div>
            <Label>Estado</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => apply({ novedad: draft.novedad === 'si' ? '' : 'si' })}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1.5px solid ${draft.novedad === 'si' ? '#DC2626' : '#D0D9E8'}`,
                  background: draft.novedad === 'si' ? '#FEE2E2' : '#fff',
                  color: draft.novedad === 'si' ? '#DC2626' : '#3D5277',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                ⚠️ Solo con novedad
              </button>
            </div>
          </div>

          <div>
            <Label>Buscar</Label>
            <input
              type="text"
              value={draft.q}
              onChange={e => setDraft({ ...draft, q: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') apply() }}
              placeholder="Placa, contenedor, código..."
              style={inp}
            />
          </div>
        </div>
      </div>

      {/* ── Tabla agnóstica ──────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 14, boxShadow: '0 2px 8px rgba(11,29,58,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #D0D9E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Eventos
            </span>
            <span style={{ fontSize: 12, color: '#7A90B0', marginLeft: 8 }}>
              {p.totalRows} resultado{p.totalRows !== 1 ? 's' : ''}
              {p.totalRows > p.rows.length && ` · mostrando primeros ${p.rows.length}`}
            </span>
          </div>
          <button onClick={exportCSV} style={btnExport}>↓ Exportar CSV</button>
        </div>

        {p.rows.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                  {['Tipo', 'Fecha', 'Cliente · Puesto', 'Autor', 'Resumen', '⚠️'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.rows.map((r, i) => {
                  const meta = TIPO_META[r.tipo_evento]
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E8E3D8', background: i % 2 === 0 ? '#fff' : '#FAF9F5' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: '#F4F1EB', border: '1px solid #D0D9E8', fontSize: 11, fontWeight: 600, color: '#0B1D3A' }}>
                          {meta?.icon ?? '📄'} {meta?.label ?? r.tipo_label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#7A90B0', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {r.fecha ? new Date(r.fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#0B1D3A' }}>
                        <div style={{ fontWeight: 600 }}>{clienteNombre(r.cliente_id)}</div>
                        <div style={{ fontSize: 11, color: '#7A90B0' }}>{puestoNombre(r.puesto_id)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#0B1D3A', fontSize: 12 }}>
                        {autorNombre(r.autor_id)}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#0B1D3A' }}>
                        <div>{r.resumen || '—'}</div>
                        {r.placa && <div style={{ fontSize: 11, color: '#7A90B0' }}>Placa: {r.placa}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {r.tiene_novedad ? (
                          <span title={r.descripcion_novedad ?? ''} style={{ color: '#DC2626', fontSize: 16 }}>⚠️</span>
                        ) : (
                          <span style={{ color: '#A0AFC4' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#A0AFC4', fontSize: 13 }}>
            {hayFiltros ? 'No hay eventos que coincidan con los filtros' : 'Aún no hay eventos registrados'}
          </div>
        )}
      </div>

      {/* ── Zona 5: Gráficas ─────────────────────────────────────── */}
      <GraficasZona5
        eventosPorDia={p.eventosPorDia}
        eventosPorTipo={p.eventosPorTipo}
        heatmap={p.heatmap}
      />

    </div>
  )
}

// ── helpers visuales ───────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#7A90B0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  )
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 99,
        border: '1.5px solid #D0D9E8',
        background: '#fff',
        color: '#3D5277',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {children}
    </button>
  )
}

const inp: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #D0D9E8',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#0B1D3A',
  fontSize: 13,
  fontFamily: 'Outfit, sans-serif',
  width: '100%',
  outline: 'none',
}

const btnApply: React.CSSProperties = {
  background: '#F05A28',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
}

const btnExport: React.CSSProperties = {
  background: '#0B1D3A',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
  letterSpacing: '0.03em',
}
