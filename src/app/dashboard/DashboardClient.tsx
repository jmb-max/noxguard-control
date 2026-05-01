'use client'

import { useState, useMemo } from 'react'

interface Registro {
  id: string
  form_no: string | null
  created_at: string
  placa_veh: string | null
  num_contenedor: string | null
  nombre_conductor: string | null
  guard_id: string | null
  ubicacion: string | null
}

interface DashboardClientProps {
  registros: Registro[]
}

export default function DashboardClient({ registros }: DashboardClientProps) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [guardiaSeleccionado, setGuardiaSeleccionado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Guardias únicos
  const guardias = useMemo(() => {
    const ids = registros.map(r => r.guard_id).filter(Boolean) as string[]
    return Array.from(new Set(ids))
  }, [registros])

  // Filtros combinados
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      const fechaReg = new Date(r.created_at)

      if (desde) {
        const fechaDesde = new Date(desde)
        fechaDesde.setHours(0, 0, 0, 0)
        if (fechaReg < fechaDesde) return false
      }
      if (hasta) {
        const fechaHasta = new Date(hasta)
        fechaHasta.setHours(23, 59, 59, 999)
        if (fechaReg > fechaHasta) return false
      }
      if (guardiaSeleccionado && r.guard_id !== guardiaSeleccionado) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const enPlaca = (r.placa_veh ?? '').toLowerCase().includes(q)
        const enContenedor = (r.num_contenedor ?? '').toLowerCase().includes(q)
        if (!enPlaca && !enContenedor) return false
      }
      return true
    })
  }, [registros, desde, hasta, guardiaSeleccionado, busqueda])

  const exportCSV = () => {
    const headers = ['Form No.', 'Fecha', 'Placa', 'Contenedor', 'Conductor', 'Ubicación']
    const rows = registrosFiltrados.map(r => [
      r.form_no ?? '',
      new Date(r.created_at).toLocaleDateString('es-CO'),
      r.placa_veh ?? '',
      r.num_contenedor ?? '',
      r.nombre_conductor ?? '',
      r.ubicacion ?? ''
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inspecciones.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const limpiarFiltros = () => {
    setDesde('')
    setHasta('')
    setGuardiaSeleccionado('')
    setBusqueda('')
  }

  const hayFiltros = desde || hasta || guardiaSeleccionado || busqueda

  return (
    <div>
      {/* Filtros */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #D0D9E8',
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(11,29,58,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filtros
          </span>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              style={{ fontSize: 12, color: '#F05A28', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guardia
            </label>
            <select
              value={guardiaSeleccionado}
              onChange={e => setGuardiaSeleccionado(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todos</option>
              {guardias.map(g => (
                <option key={g} value={g}>{g.slice(0, 8)}…</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Buscar placa / contenedor
            </label>
            <input
              type="text"
              placeholder="Ej: ABC123 o CSNU..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Tabla + Exportar */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #D0D9E8',
        boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #D0D9E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1D3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Registros
            </span>
            <span style={{ fontSize: 12, color: '#7A90B0', marginLeft: 8 }}>
              {registrosFiltrados.length} resultado{registrosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={exportCSV}
            style={{
              background: '#F05A28',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.03em'
            }}>
            ↓ Exportar CSV
          </button>
        </div>

        {registrosFiltrados.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                  {['Form No.', 'Fecha', 'Placa', 'Contenedor', 'Conductor', 'Ubicación', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#7A90B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #D0D9E8',
                      background: i % 2 === 0 ? '#ffffff' : '#F9F8F5'
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#F05A28', whiteSpace: 'nowrap' }}>
                      {r.form_no || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#7A90B0', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#0B1D3A', whiteSpace: 'nowrap' }}>
                      {r.placa_veh || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#0B1D3A', whiteSpace: 'nowrap' }}>
                      {r.num_contenedor || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#0B1D3A' }}>
                      {r.nombre_conductor || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#7A90B0' }}>
                      {r.ubicacion || '—'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, color: '#A0AFC4' }}>—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#A0AFC4', fontSize: 13 }}>
            No hay registros que coincidan con los filtros
          </div>
        )}
      </div>

      {/* Placeholder gráficas */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #D0D9E8',
        padding: 24,
        textAlign: 'center',
        color: '#7A90B0',
        marginTop: 24,
        boxShadow: '0 2px 8px rgba(11,29,58,0.06)'
      }}>
        📊 Gráficas — próximamente (requiere instalación de chart library)
      </div>
    </div>
  )
}
