'use client'
import { useState } from 'react'
import Link from 'next/link'

const CATEGORIAS = [
  {
    id: 'inspecciones', name: 'Inspecciones', icon: '🔍',
    forms: [
      { id: 'inspeccion-contenedor', name: 'Inspección de Contenedores', desc: 'Control antinarcóticos, sellos y unidad canina', active: true },
      { id: 'insp-vehiculo', name: 'Inspección de Vehículo', desc: 'Control físico de vehículos en planta', active: false },
      { id: 'insp-personal', name: 'Inspección de Personal', desc: 'Control de ingreso de personas', active: false },
    ]
  },
  {
    id: 'alarmas-rondas', name: 'Alarmas y Rondas', icon: '🔔',
    forms: [
      { id: 'atencion-alarmas', name: 'Atención de Alarmas', desc: 'Reporte de atención y verificación perimetral', active: true },
      { id: 'ronda-ingenio', name: 'Ronda Patrulla / Ingenio', desc: 'Escaneo QR por escenario, riesgos y novedades', active: false },
      { id: 'ronda-hospital', name: 'Ronda Hospital', desc: 'Control por puntos QR en instalaciones clínicas', active: false },
    ]
  },
  {
    id: 'novedades', name: 'Novedades y Riesgos', icon: '⚠️',
    forms: [
      { id: 'alerta-riesgos', name: 'Alerta de Riesgos', desc: 'Identificación y recomendación de riesgos en campo', active: true },
    ]
  },
  {
    id: 'vehiculos', name: 'Vehículos', icon: '🏍️',
    forms: [
      { id: 'chequeo-moto', name: 'Chequeo de Moto', desc: 'Revisión técnica de motocicleta operativa (27 ítems)', active: true },
    ]
  },
  {
    id: 'armas-equipos', name: 'Armas y Equipos', icon: '🔫',
    forms: [
      { id: 'control-armas', name: 'Control Armas y Comunicaciones', desc: 'Entrega, cambio y retiro de armamento', active: false },
    ]
  },
  {
    id: 'supervision', name: 'Supervisión', icon: '👁️',
    forms: [
      { id: 'sup-diaria', name: 'Supervisión Diaria', desc: 'Reporte de puesto, vigilante y observaciones', active: false },
      { id: 'sup-general', name: 'Supervisión General', desc: 'Armamento, comunicaciones, uniforme y actitud', active: false },
    ]
  },
  {
    id: 'operaciones-ara', name: 'Operaciones ARA', icon: '🏪',
    forms: [
      { id: 'descargues-ara', name: 'Reporte de Descargues ARA', desc: 'Registro de descargue en tiendas, horarios y novedades', active: false },
    ]
  },
  {
    id: 'visitas', name: 'Visitas', icon: '🤝',
    forms: [
      { id: 'visita-cliente', name: 'Visita Cliente Operativa', desc: 'Acta con asistentes, compromisos y firmas', active: false },
    ]
  },
]

interface Props {
  userName: string
  userRole: string
}

export default function FormsClient({ userName, userRole }: Props) {
  const [search, setSearch] = useState('')

  const totalActive = CATEGORIAS.reduce((sum, c) => sum + c.forms.filter(f => f.active).length, 0)
  const totalSoon = CATEGORIAS.reduce((sum, c) => sum + c.forms.filter(f => !f.active).length, 0)

  const query = search.trim().toLowerCase()
  const filteredForms = query
    ? CATEGORIAS.flatMap(cat =>
        cat.forms
          .filter(f =>
            f.name.toLowerCase().includes(query) ||
            f.desc.toLowerCase().includes(query)
          )
          .map(f => ({ ...f, catName: cat.name }))
      )
    : []

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 0' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[{v: CATEGORIAS.length, l: 'Categorías', c: '#0B1D3A'}, {v: totalActive, l: 'Disponibles', c: '#15803D'}, {v: totalSoon, l: 'En desarrollo', c: '#7A90B0'}].map(s => (
          <div key={s.l} style={{ background: '#fff', borderRadius: 12, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(11,29,58,0.08)', border: '1px solid #D0D9E8' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: 'monospace' }}>{s.v}</div>
            <div style={{ fontSize: 10, color: '#7A90B0', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar formulario..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #D0D9E8', background: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', color: '#0B1D3A', outline: 'none', marginBottom: 14, boxSizing: 'border-box' as const }}
      />

      {query ? (
        /* Lista plana filtrada */
        <div>
          {filteredForms.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7A90B0', fontSize: 13, padding: '32px 0' }}>
              No se encontraron formularios
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderRadius: 12, overflow: 'hidden' }}>
              {filteredForms.map((form, i) => (
                form.active ? (
                  <Link key={form.id} href={`/forms/${form.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < filteredForms.length - 1 ? '1px solid #E8E3D8' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803D', flexShrink: 0, marginLeft: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A' }}>{form.name}</div>
                      <div style={{ fontSize: 11, color: '#7A90B0', marginTop: 1 }}>{form.catName} · {form.desc}</div>
                    </div>
                    <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>ACTIVO</span>
                  </Link>
                ) : (
                  <div key={form.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < filteredForms.length - 1 ? '1px solid #E8E3D8' : 'none', opacity: 0.45 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D0D9E8', flexShrink: 0, marginLeft: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A' }}>{form.name}</div>
                      <div style={{ fontSize: 11, color: '#7A90B0', marginTop: 1 }}>{form.catName} · {form.desc}</div>
                    </div>
                    <span style={{ background: '#E8E3D8', color: '#7A90B0', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>PRONTO</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Categorías colapsables */
        <>
          {CATEGORIAS.map(cat => (
            <details key={cat.id} style={{ marginBottom: 8 }}>
              <summary style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, background: '#fff', border: '1px solid #D0D9E8', cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,29,58,0.08)', listStyle: 'none', userSelect: 'none' }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0B1D3A' }}>{cat.name}</span>
                <span style={{ background: '#F4F1EB', border: '1px solid #D0D9E8', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: '#7A90B0' }}>{cat.forms.length}</span>
                <span style={{ fontSize: 11, color: '#7A90B0' }}>▼</span>
              </summary>
              <div style={{ background: '#fff', border: '1px solid #D0D9E8', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                {cat.forms.map((form, i) => (
                  form.active ? (
                    <Link key={form.id} href={`/forms/${form.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < cat.forms.length - 1 ? '1px solid #E8E3D8' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803D', flexShrink: 0, marginLeft: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A' }}>{form.name}</div>
                        <div style={{ fontSize: 11, color: '#7A90B0', marginTop: 1 }}>{form.desc}</div>
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>ACTIVO</span>
                    </Link>
                  ) : (
                    <div key={form.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < cat.forms.length - 1 ? '1px solid #E8E3D8' : 'none', opacity: 0.45 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D0D9E8', flexShrink: 0, marginLeft: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1D3A' }}>{form.name}</div>
                        <div style={{ fontSize: 11, color: '#7A90B0', marginTop: 1 }}>{form.desc}</div>
                      </div>
                      <span style={{ background: '#E8E3D8', color: '#7A90B0', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>PRONTO</span>
                    </div>
                  )
                ))}
              </div>
            </details>
          ))}

          {(userRole === 'supervisor' || userRole === 'admin') && (
            <div style={{ marginTop: 16, paddingBottom: 32 }}>
              <Link href="/dashboard" style={{ fontSize: 12, color: '#1D6FE8', textDecoration: 'none', fontWeight: 600 }}>← Ver Dashboard</Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
