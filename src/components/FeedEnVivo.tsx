'use client'
/**
 * FeedEnVivo — Últimos 20 eventos con suscripción Supabase Realtime.
 *
 * Comportamiento:
 *   1. Al montar: carga los 20 eventos más recientes vía query normal
 *   2. Supabase Realtime escucha INSERT en las 11 tablas de v_eventos_unificados
 *      → cuando llega un evento nuevo, lo prepend al feed (max 20)
 *   3. Eventos con tiene_novedad=true se marcan en rojo ⚠️
 *   4. Indicador "● EN VIVO" muestra estado de la conexión Realtime
 *
 * Limitación de Supabase Realtime con vistas:
 *   Las vistas NO emiten eventos Realtime directamente — PostgreSQL no soporta
 *   replicación en views. Suscribimos a la tabla base con mayor volumen:
 *   inspecciones_contenedor. Para las otras 10 tablas, hacemos polling
 *   liviano cada 30s como fallback (suficiente para reportes operativos).
 *
 * Nota: ssr:false no requerido (no usa window en el top-level), pero el
 * componente padre debe ser 'use client'.
 */

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Tipos ────────────────────────────────────────────────────────────────────

interface EventoFeed {
  id: string
  tipo_evento: string
  tipo_label: string
  fecha: string | null
  cliente_id: string | null
  puesto_id: string | null
  autor_id: string | null
  tiene_novedad: boolean
  resumen: string | null
  coords_lat: number | null
  coords_lng: number | null
}

interface Cliente { id: string; nombre: string }
interface Puesto  { id: string; nombre: string; cliente_id: string | null }
interface Autor   { id: string; auth_id: string | null; nombre: string | null; email: string | null }

interface Props {
  clientes: Cliente[]
  puestos:  Puesto[]
  autores:  Autor[]
}

// ── Iconos por tipo de evento ────────────────────────────────────────────────

const TIPO_ICON: Record<string, string> = {
  inspeccion_contenedor: '📦',
  control_armas:         '🔫',
  atencion_alarmas:      '🚨',
  supervision_diaria:    '👁️',
  supervision_general:   '📋',
  chequeo_moto:          '🏍️',
  alerta_riesgos:        '⚠️',
  ronda_ingenio:         '🌾',
  ronda_hospital:        '🏥',
  visita_cliente:        '🤝',
  descargues_ara:        '🏪',
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function FeedEnVivo({ clientes, puestos, autores }: Props) {
  const [eventos, setEventos] = useState<EventoFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [realtimeOk, setRealtimeOk] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Helpers de nombre ──────────────────────────────────────────────────────
  const clienteNombre = (id: string | null) =>
    id ? (clientes.find(c => c.id === id)?.nombre ?? '—') : '—'
  const puestoNombre = (id: string | null) =>
    id ? (puestos.find(p => p.id === id)?.nombre ?? '—') : '—'
  const autorNombre = (id: string | null) => {
    if (!id) return '—'
    const u = autores.find(a => a.auth_id === id || a.id === id)
    return u?.nombre || u?.email?.split('@')[0] || id.slice(0, 8) + '…'
  }

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const cargarEventos = async () => {
    const { data, error } = await supabase
      .from('v_eventos_unificados')
      .select('id, tipo_evento, tipo_label, fecha, cliente_id, puesto_id, autor_id, tiene_novedad, resumen, coords_lat, coords_lng')
      .order('fecha', { ascending: false })
      .limit(20)

    if (!error && data) {
      setEventos(data as EventoFeed[])
    }
    setLoading(false)
  }

  // ── Realtime: escucha INSERT en todas las tablas via broadcast ─────────────
  useEffect(() => {
    cargarEventos()

    // Suscripción Realtime — escuchamos cambios en postgres a nivel de tabla
    // Para cada INSERT en cualquiera de las 11 tablas, recargamos el feed.
    // Es más simple y confiable que parsear el payload (que varía por tabla).
    const channel = supabase
      .channel('feed-eventos-noxguard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inspecciones_contenedor' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'control_armas' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atencion_alarmas' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supervision_diaria' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supervision_general' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chequeos_moto' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas_riesgos' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ronda_ingenio' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ronda_hospital' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visita_cliente' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'descargues_ara' },
        () => cargarEventos()
      )
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D0D9E8',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #D0D9E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#0B1D3A',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: 'Outfit, sans-serif',
        }}>
          Feed de eventos
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600,
          color: realtimeOk ? '#22C55E' : '#A0AFC4',
          fontFamily: 'Outfit, sans-serif',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: realtimeOk ? '#22C55E' : '#D0D9E8',
            display: 'inline-block',
            boxShadow: realtimeOk ? '0 0 6px #22C55E' : 'none',
          }} />
          {realtimeOk ? 'En vivo' : 'Conectando…'}
        </span>
      </div>

      {/* Lista de eventos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#A0AFC4', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>
            Cargando…
          </div>
        ) : eventos.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#A0AFC4', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>
            Sin eventos recientes
          </div>
        ) : (
          eventos.map((e, i) => (
            <div
              key={e.id}
              style={{
                padding: '10px 16px',
                borderBottom: i < eventos.length - 1 ? '1px solid #F0EDE6' : 'none',
                background: e.tiene_novedad ? '#FFF5F5' : '#fff',
                transition: 'background 0.2s',
              }}
            >
              {/* Línea 1: icono + tipo + hora */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: e.tiene_novedad ? '#DC2626' : '#0B1D3A', fontFamily: 'Outfit, sans-serif' }}>
                  {e.tiene_novedad ? '⚠️ ' : (TIPO_ICON[e.tipo_evento] ?? '📄') + ' '}
                  {e.tipo_label}
                </span>
                <span style={{ fontSize: 10, color: '#A0AFC4', fontFamily: 'monospace', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {e.fecha
                    ? new Date(e.fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>

              {/* Línea 2: cliente · puesto */}
              <div style={{ fontSize: 11, color: '#7A90B0', fontFamily: 'Outfit, sans-serif', marginBottom: 2 }}>
                {clienteNombre(e.cliente_id)} {e.puesto_id ? `· ${puestoNombre(e.puesto_id)}` : ''}
              </div>

              {/* Línea 3: resumen + autor */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#3D5277', fontFamily: 'Outfit, sans-serif' }}>
                  {e.resumen || '—'}
                </span>
                <span style={{ fontSize: 10, color: '#A0AFC4', fontFamily: 'Outfit, sans-serif', marginLeft: 8, whiteSpace: 'nowrap' }}>
                  {autorNombre(e.autor_id)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
