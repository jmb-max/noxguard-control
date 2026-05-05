'use client'
/**
 * ContextoOperativo — sección compartida en los 11 formularios.
 *
 * Captura el "contexto" del registro de forma uniforme cross-form:
 *   - Cliente (FK a clientes)
 *   - Puesto (FK a puestos, dependiente del cliente)
 *   - GPS (lat/lng captura automática)
 *   - Novedad (toggle + descripción opcional)
 *
 * Producto: el form padre lee `value` y al submit hace .insert({ ...value })
 * directamente — los nombres de las propiedades coinciden exactamente con
 * las columnas agregadas a las 11 tablas en la migración F0:
 *   cliente_id, puesto_id, coords_lat, coords_lng, tiene_novedad,
 *   descripcion_novedad
 */

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ContextoValue {
  cliente_id: string | null
  puesto_id: string | null
  coords_lat: number | null
  coords_lng: number | null
  tiene_novedad: boolean
  descripcion_novedad: string
}

export const EMPTY_CONTEXTO: ContextoValue = {
  cliente_id: null,
  puesto_id: null,
  coords_lat: null,
  coords_lng: null,
  tiene_novedad: false,
  descripcion_novedad: '',
}

interface Cliente { id: string; nombre: string; zona: string | null }
interface Puesto  { id: string; nombre: string; cliente_id: string | null; numero: string | null }

interface Props {
  value: ContextoValue
  onChange: (v: ContextoValue) => void
  /** Si true, el bloque de novedad es obligatorio (descripción requerida si hay novedad). */
  requiereNovedad?: boolean
}

export default function ContextoOperativo({ value, onChange, requiereNovedad = false }: Props) {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [puestos,  setPuestos]  = useState<Puesto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [gpsState, setGpsState] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [gpsError, setGpsError] = useState<string>('')

  // Cargar datos maestros una sola vez
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from('clientes').select('id, nombre, zona').eq('activo', true).order('nombre'),
        supabase.from('puestos').select('id, nombre, cliente_id, numero').eq('activo', true).order('nombre'),
      ])
      if (cancelled) return
      setClientes(cs ?? [])
      setPuestos(ps ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-capturar GPS al montar (silenciosamente — el usuario lo puede re-disparar)
  useEffect(() => {
    captureGPS()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsState('error'); setGpsError('Geolocalización no disponible')
      return
    }
    setGpsState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange({ ...value, coords_lat: pos.coords.latitude, coords_lng: pos.coords.longitude })
        setGpsState('ok')
      },
      err => {
        setGpsState('error')
        setGpsError(err.code === 1 ? 'Permiso denegado' : err.code === 2 ? 'Posición no disponible' : 'Tiempo agotado')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Puestos filtrados por cliente seleccionado
  const puestosDelCliente = useMemo(() => {
    if (!value.cliente_id) return []
    return puestos.filter(p => p.cliente_id === value.cliente_id)
  }, [value.cliente_id, puestos])

  // Si cambia cliente, limpiar puesto seleccionado si ya no aplica
  useEffect(() => {
    if (value.puesto_id && !puestosDelCliente.some(p => p.id === value.puesto_id)) {
      onChange({ ...value, puesto_id: null })
    }
  }, [value.cliente_id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D0D9E8',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(11,29,58,0.08)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #D0D9E8',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'linear-gradient(90deg,#FFF7F4 0%,white 100%)',
      }}>
        <div style={{
          width: 24, height: 24, background: '#F05A28', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>0</div>
        <span style={{ fontSize: 15 }}>📋</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A' }}>Contexto Operativo</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7A90B0', fontWeight: 500 }}>
          Obligatorio
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {/* Cliente + Puesto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <Field label="Cliente" req>
            <select
              style={inp}
              value={value.cliente_id ?? ''}
              onChange={e => onChange({ ...value, cliente_id: e.target.value || null, puesto_id: null })}
              disabled={loading}
            >
              <option value="">{loading ? 'Cargando...' : 'Seleccione cliente'}</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.zona ? ` · ${c.zona}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Puesto" req>
            <select
              style={inp}
              value={value.puesto_id ?? ''}
              onChange={e => onChange({ ...value, puesto_id: e.target.value || null })}
              disabled={!value.cliente_id || loading}
            >
              <option value="">
                {!value.cliente_id ? 'Elija cliente primero' : puestosDelCliente.length === 0 ? 'Sin puestos para este cliente' : 'Seleccione puesto'}
              </option>
              {puestosDelCliente.map(p => (
                <option key={p.id} value={p.id}>
                  {p.numero ? `#${p.numero} · ` : ''}{p.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* GPS */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: '#F4F1EB',
          border: '1px solid #D0D9E8', borderRadius: 8, marginBottom: 14,
        }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <div style={{ flex: 1, fontSize: 12 }}>
            {gpsState === 'idle' && <span style={{ color: '#7A90B0' }}>Sin ubicación capturada</span>}
            {gpsState === 'loading' && <span style={{ color: '#7A90B0' }}>Obteniendo ubicación...</span>}
            {gpsState === 'ok' && value.coords_lat !== null && (
              <span style={{ color: '#15803D', fontWeight: 600 }}>
                ✓ {value.coords_lat.toFixed(5)}, {value.coords_lng?.toFixed(5)}
              </span>
            )}
            {gpsState === 'error' && (
              <span style={{ color: '#DC2626', fontWeight: 600 }}>✕ {gpsError}</span>
            )}
          </div>
          <button
            type="button"
            onClick={captureGPS}
            style={{
              fontSize: 11, padding: '6px 12px', borderRadius: 6,
              border: '1px solid #D0D9E8', background: '#fff', color: '#0B1D3A',
              fontWeight: 600, cursor: 'pointer',
            }}>
            {gpsState === 'ok' ? 'Recapturar' : 'Capturar GPS'}
          </button>
        </div>

        {/* Novedad */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3D5277', marginBottom: 6 }}>
            ¿Hubo novedad?{requiereNovedad && <span style={{ color: '#F05A28', marginLeft: 2 }}>*</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: value.tiene_novedad ? 10 : 0 }}>
            {[false, true].map(v => (
              <button
                key={String(v)}
                type="button"
                onClick={() => onChange({
                  ...value,
                  tiene_novedad: v,
                  descripcion_novedad: v ? value.descripcion_novedad : '',
                })}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  border: `1.5px solid ${value.tiene_novedad === v ? (v ? '#DC2626' : '#15803D') : '#D0D9E8'}`,
                  background: value.tiene_novedad === v ? (v ? '#FEE2E2' : '#DCFCE7') : '#F4F1EB',
                  color: value.tiene_novedad === v ? (v ? '#DC2626' : '#15803D') : '#7A90B0',
                }}>
                {v ? '⚠️ SÍ' : '✓ NO'}
              </button>
            ))}
          </div>
          {value.tiene_novedad && (
            <textarea
              style={{ ...inp, minHeight: 70, resize: 'vertical' }}
              placeholder="Describa la novedad observada..."
              value={value.descripcion_novedad}
              onChange={e => onChange({ ...value, descripcion_novedad: e.target.value })}
              required={requiereNovedad}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── helpers visuales ────────────────────────────────────────────────────
function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#3D5277' }}>
        {label}{req && <span style={{ color: '#F05A28', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  background: '#F4F1EB',
  border: '1.5px solid #D0D9E8',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#0B1D3A',
  fontSize: 14,
  fontFamily: 'Outfit, sans-serif',
  width: '100%',
  outline: 'none',
}

/**
 * Helper: valida que el contexto está completo antes de submit.
 * Devuelve un mensaje de error o null si está OK.
 */
export function validarContexto(v: ContextoValue): string | null {
  if (!v.cliente_id) return 'Selecciona un cliente'
  if (!v.puesto_id)  return 'Selecciona un puesto'
  if (v.tiene_novedad && !v.descripcion_novedad.trim()) {
    return 'Describe la novedad reportada'
  }
  return null
}
