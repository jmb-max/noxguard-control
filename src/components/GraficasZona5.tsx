'use client'
/**
 * GraficasZona5 — Zona 5 del dashboard: 3 visualizaciones con Recharts.
 *
 * Gráfica 1: Línea — eventos por día últimos 30 días (una serie por tipo)
 * Gráfica 2: Donut — distribución por tipo de evento
 * Gráfica 3: Heatmap 24×7 — horas activas por día de semana
 *
 * Los datos vienen como props desde page.tsx (server-side) para no
 * duplicar queries — el servidor ya tiene la conexión a Supabase.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface EventoDia {
  dia: string        // 'YYYY-MM-DD'
  tipo_evento: string
  tipo_label: string
  total: number
}

export interface EventoTipo {
  tipo_evento: string
  tipo_label: string
  total: number
}

export interface HeatmapCell {
  dow: number   // 0=domingo … 6=sábado
  hora: number  // 0-23
  total: number
}

interface Props {
  eventosPorDia: EventoDia[]
  eventosPorTipo: EventoTipo[]
  heatmap: HeatmapCell[]
}

// ── Paleta de colores por tipo de evento ────────────────────────────────────

const COLORES: Record<string, string> = {
  inspeccion_contenedor: '#0B1D3A',
  control_armas:         '#F05A28',
  atencion_alarmas:      '#DC2626',
  supervision_diaria:    '#2563EB',
  supervision_general:   '#7C3AED',
  chequeo_moto:          '#D97706',
  alerta_riesgos:        '#BE123C',
  ronda_ingenio:         '#15803D',
  ronda_hospital:        '#0891B2',
  visita_cliente:        '#CA8A04',
  descargues_ara:        '#9333EA',
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Transforma eventosPorDia en el formato que LineChart espera:
 *  [{ dia: '05/05', inspeccion_contenedor: 3, control_armas: 1, ... }]
 */
function buildLineData(rows: EventoDia[]) {
  const byDia: Record<string, Record<string, number>> = {}
  rows.forEach(r => {
    if (!byDia[r.dia]) byDia[r.dia] = {}
    byDia[r.dia][r.tipo_evento] = (byDia[r.dia][r.tipo_evento] ?? 0) + r.total
  })
  return Object.entries(byDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, vals]) => ({
      dia: dia.slice(5).replace('-', '/'), // '05/05'
      ...vals,
    }))
}

/** Tipos únicos presentes en los datos */
function tiposUnicos(rows: EventoDia[]) {
  const seen = new Map<string, string>()
  rows.forEach(r => seen.set(r.tipo_evento, r.tipo_label))
  return Array.from(seen.entries()).map(([slug, label]) => ({ slug, label }))
}

/** Intensidad de color para el heatmap */
function heatColor(val: number, max: number): string {
  if (val === 0) return '#F4F1EB'
  const ratio = val / max
  if (ratio < 0.25) return '#DBEAFE'
  if (ratio < 0.5)  return '#93C5FD'
  if (ratio < 0.75) return '#3B82F6'
  return '#1D4ED8'
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function GraficasZona5({ eventosPorDia, eventosPorTipo, heatmap }: Props) {
  const lineData = buildLineData(eventosPorDia)
  const tipos = tiposUnicos(eventosPorDia)
  const maxHeat = Math.max(...heatmap.map(h => h.total), 1)

  // Construir grid 7×24 para el heatmap
  const heatGrid: Record<string, number> = {}
  heatmap.forEach(h => { heatGrid[`${h.dow}-${h.hora}`] = h.total })

  const sinDatos = eventosPorDia.length === 0 && eventosPorTipo.length === 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 16,
      marginTop: 20,
    }}>

      {/* ── Gráfica 1: Línea por día ─────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeader}>
          <span style={cardTitle}>📈 Eventos por día</span>
          <span style={cardSub}>Últimos 30 días</span>
        </div>
        {sinDatos || lineData.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E3D8" />
              <XAxis dataKey="dia" tick={{ fontSize: 9, fill: '#7A90B0' }} />
              <YAxis tick={{ fontSize: 9, fill: '#7A90B0' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, border: '1px solid #D0D9E8', borderRadius: 8 }}
                labelStyle={{ fontWeight: 700, color: '#0B1D3A' }}
              />
              {tipos.slice(0, 6).map(t => (
                <Line
                  key={t.slug}
                  type="monotone"
                  dataKey={t.slug}
                  name={t.label}
                  stroke={COLORES[t.slug] ?? '#7A90B0'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Gráfica 2: Donut por tipo ────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeader}>
          <span style={cardTitle}>🍩 Por tipo de evento</span>
          <span style={cardSub}>Total histórico</span>
        </div>
        {eventosPorTipo.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={eventosPorTipo}
                  dataKey="total"
                  nameKey="tipo_label"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {eventosPorTipo.map(t => (
                    <Cell key={t.tipo_evento} fill={COLORES[t.tipo_evento] ?? '#7A90B0'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, border: '1px solid #D0D9E8', borderRadius: 8 }}
                  formatter={(value, name) => [`${value}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Leyenda compacta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', paddingTop: 4 }}>
              {eventosPorTipo.slice(0, 5).map(t => {
                const pct = Math.round((t.total / eventosPorTipo.reduce((s, x) => s + x.total, 0)) * 100)
                return (
                  <div key={t.tipo_evento} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORES[t.tipo_evento] ?? '#7A90B0', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#3D5277', flex: 1, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.tipo_label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0B1D3A', fontFamily: 'monospace' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Gráfica 3: Heatmap 24×7 ──────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeader}>
          <span style={cardTitle}>🌡️ Horas activas</span>
          <span style={cardSub}>Día × hora</span>
        </div>
        {heatmap.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Cabecera horas */}
            <div style={{ display: 'flex', gap: 1, marginBottom: 2, marginLeft: 24 }}>
              {[0,4,8,12,16,20].map(h => (
                <div key={h} style={{ width: 20, fontSize: 8, color: '#A0AFC4', textAlign: 'center', fontFamily: 'monospace', flex: '0 0 auto' }}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
            {/* Grid 7 filas × 24 cols */}
            {DIAS_SEMANA.map((dia, dow) => (
              <div key={dow} style={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                <div style={{ width: 22, fontSize: 8, color: '#7A90B0', fontFamily: 'Outfit, sans-serif', fontWeight: 600, flexShrink: 0 }}>
                  {dia}
                </div>
                {Array.from({ length: 24 }, (_, hora) => {
                  const val = heatGrid[`${dow}-${hora}`] ?? 0
                  return (
                    <div
                      key={hora}
                      title={val > 0 ? `${dia} ${String(hora).padStart(2,'0')}h: ${val} eventos` : undefined}
                      style={{
                        width: 10, height: 10,
                        background: heatColor(val, maxHeat),
                        borderRadius: 2,
                        flexShrink: 0,
                        cursor: val > 0 ? 'pointer' : 'default',
                      }}
                    />
                  )
                })}
              </div>
            ))}
            {/* Escala */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8 }}>
              <span style={{ fontSize: 8, color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>Bajo</span>
              {['#DBEAFE','#93C5FD','#3B82F6','#1D4ED8'].map(c => (
                <div key={c} style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              ))}
              <span style={{ fontSize: 8, color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>Alto</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ── helpers visuales ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: '#A0AFC4', fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>
      Sin datos suficientes aún
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #D0D9E8',
  borderRadius: 14,
  padding: '14px 16px',
  boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
}

const cardHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
}

const cardTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#0B1D3A',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Outfit, sans-serif',
}

const cardSub: React.CSSProperties = {
  fontSize: 10,
  color: '#A0AFC4',
  fontFamily: 'Outfit, sans-serif',
}
