'use client'
/**
 * MapaPuestos — Mapa Leaflet con markers de puestos y eventos recientes.
 *
 * IMPORTANTE: Este componente debe importarse SIEMPRE con dynamic + ssr:false
 * porque Leaflet accede al DOM (window) y rompe el SSR de Next.js App Router.
 *
 * Uso en DashboardClient:
 *   const MapaPuestos = dynamic(() => import('@/components/MapaPuestos'), { ssr: false })
 *
 * Props:
 *   puestos    — lista de puestos con coords (pueden tener coords_lat/lng null → no se muestran)
 *   clientes   — para mostrar nombre del cliente en el popup
 *   eventos    — últimos eventos con coords (markers secundarios, más pequeños)
 *   onPuestoClick — callback cuando el usuario hace click en un marker de puesto
 *                   → el dashboard aplica el filtro cliente_id/puesto_id
 */

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Fix clásico de Leaflet + webpack: los íconos por defecto usan rutas
// relativas que webpack rompe. Los sobreescribimos con URLs absolutas de CDN.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Íconos personalizados ────────────────────────────────────────────────────

/** Marker azul oscuro — puesto fijo */
const iconPuesto = L.divIcon({
  className: '',
  html: `<div style="
    width:32px; height:32px; border-radius:50% 50% 50% 0;
    background:#0B1D3A; border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
})

/** Marker naranja — evento sin novedad */
const iconEvento = L.divIcon({
  className: '',
  html: `<div style="
    width:14px; height:14px; border-radius:50%;
    background:#F05A28; border:2px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

/** Marker rojo — evento con novedad */
const iconEventoNovedad = L.divIcon({
  className: '',
  html: `<div style="
    width:16px; height:16px; border-radius:50%;
    background:#DC2626; border:2px solid #fff;
    box-shadow:0 1px 6px rgba(220,38,38,0.5);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
})

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Puesto {
  id: string
  nombre: string
  numero?: string | null
  cliente_id?: string | null
  coords_lat?: number | null
  coords_lng?: number | null
}

interface Cliente {
  id: string
  nombre: string
}

interface Evento {
  id: string
  tipo_label: string
  fecha: string | null
  coords_lat: number | null
  coords_lng: number | null
  tiene_novedad: boolean
  resumen: string | null
  autor_id: string | null
  puesto_id: string | null
  cliente_id: string | null
}

interface Props {
  puestos: Puesto[]
  clientes: Cliente[]
  eventos: Evento[]
  onPuestoClick?: (puestoId: string, clienteId: string | null) => void
}

// ── Componente auxiliar para ajustar bounds al montar ───────────────────────

function AutoBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.setView(coords[0], 15)
    } else {
      map.fitBounds(coords, { padding: [40, 40] })
    }
  }, [map, coords])
  return null
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function MapaPuestos({ puestos, clientes, eventos, onPuestoClick }: Props) {
  // Solo puestos con coords válidas
  const puestosConCoords = puestos.filter(
    p => p.coords_lat != null && p.coords_lng != null
  )

  // Solo eventos con coords válidas
  const eventosConCoords = eventos.filter(
    e => e.coords_lat != null && e.coords_lng != null
  )

  // Todas las coords para calcular bounds automáticos
  const todasCoords: [number, number][] = [
    ...puestosConCoords.map(p => [p.coords_lat!, p.coords_lng!] as [number, number]),
    ...eventosConCoords.map(e => [e.coords_lat!, e.coords_lng!] as [number, number]),
  ]

  // Centro por defecto: Bogotá
  const centro: [number, number] = todasCoords.length > 0
    ? todasCoords[0]
    : [4.6097, -74.0817]

  const clienteNombre = (id: string | null) =>
    id ? (clientes.find(c => c.id === id)?.nombre ?? '—') : '—'

  return (
    <MapContainer
      center={centro}
      zoom={13}
      style={{ width: '100%', height: '100%', borderRadius: 12 }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Ajustar bounds automáticamente */}
      <AutoBounds coords={todasCoords} />

      {/* ── Markers de puestos (azul oscuro, grandes) ── */}
      {puestosConCoords.map(p => (
        <Marker
          key={`puesto-${p.id}`}
          position={[p.coords_lat!, p.coords_lng!]}
          icon={iconPuesto}
          eventHandlers={{
            click: () => onPuestoClick?.(p.id, p.cliente_id ?? null),
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0B1D3A', marginBottom: 4 }}>
                {p.numero ? `#${p.numero} · ` : ''}{p.nombre}
              </div>
              <div style={{ fontSize: 11, color: '#7A90B0', marginBottom: 8 }}>
                {clienteNombre(p.cliente_id ?? null)}
              </div>
              {onPuestoClick && (
                <button
                  onClick={() => onPuestoClick(p.id, p.cliente_id ?? null)}
                  style={{
                    background: '#0B1D3A', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '5px 12px', fontSize: 11,
                    fontWeight: 600, cursor: 'pointer', width: '100%',
                  }}
                >
                  Filtrar por este puesto
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ── Markers de eventos recientes (naranja/rojo, pequeños) ── */}
      {eventosConCoords.map(e => (
        <Marker
          key={`evento-${e.id}`}
          position={[e.coords_lat!, e.coords_lng!]}
          icon={e.tiene_novedad ? iconEventoNovedad : iconEvento}
        >
          <Popup>
            <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: 140 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: e.tiene_novedad ? '#DC2626' : '#0B1D3A', marginBottom: 2 }}>
                {e.tiene_novedad ? '⚠️ ' : ''}{e.tipo_label}
              </div>
              <div style={{ fontSize: 11, color: '#7A90B0', marginBottom: 2 }}>
                {e.fecha ? new Date(e.fecha).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              {e.resumen && (
                <div style={{ fontSize: 11, color: '#3D5277' }}>{e.resumen}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Mensaje cuando no hay puestos con GPS */}
      {puestosConCoords.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.9)', borderRadius: 8,
          padding: '12px 20px', fontSize: 12, color: '#7A90B0',
          fontFamily: 'Outfit, sans-serif', zIndex: 1000, pointerEvents: 'none',
        }}>
          📍 Agrega coordenadas GPS a los puestos en Panel Admin
        </div>
      )}
    </MapContainer>
  )
}
