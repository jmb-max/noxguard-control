'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Usuario, Cliente, Puesto } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [iaUsage, setIaUsage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'usuarios') {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error && data) setUsuarios(data)
      } else if (activeTab === 'clientes') {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error && data) setClientes(data)
      } else if (activeTab === 'puestos') {
        const { data, error } = await supabase
          .from('puestos')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error && data) setPuestos(data)
      } else if (activeTab === 'ia') {
        const { data, error } = await supabase
          .from('ia_usage')
          .select('*')
          .order('costo_estimado', { ascending: false })
        if (!error && data) setIaUsage(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'usuarios', label: '👤 Usuarios' },
    { id: 'clientes', label: '🏪 Clientes' },
    { id: 'puestos', label: '📍 Puestos' },
    { id: 'ia', label: '🤖 Monitoreo IA' },
  ]

  return (
    <div>
      {/* Título */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#0B1D3A',
          fontFamily: 'Outfit, sans-serif', margin: 0
        }}>
          ⚙️ Panel Admin
        </h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '2px solid #D0D9E8', paddingBottom: 0
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? '#F05A28' : '#7A90B0',
              borderBottom: activeTab === tab.id ? '2px solid #F05A28' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #D0D9E8',
        boxShadow: '0 2px 8px rgba(11,29,58,0.06)',
        padding: 24
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#7A90B0', fontFamily: 'Outfit, sans-serif' }}>
            Cargando...
          </div>
        ) : activeTab === 'usuarios' ? (
          <UsuariosTab usuarios={usuarios} />
        ) : activeTab === 'clientes' ? (
          <ClientesTab clientes={clientes} />
        ) : activeTab === 'puestos' ? (
          <PuestosTab puestos={puestos} clientes={clientes} />
        ) : (
          <IaTab iaUsage={iaUsage} />
        )}
      </div>
    </div>
  )
}

// ─── Estilos compartidos ───────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', fontSize: 12, fontWeight: 700,
  fontFamily: 'Outfit, sans-serif', borderRadius: 8, border: 'none',
  cursor: 'pointer', background: '#F05A28', color: '#fff',
  letterSpacing: '0.03em',
}

const btnSecondary: React.CSSProperties = {
  ...btnPrimary, background: '#22c55e',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  border: '1px solid #D0D9E8', borderRadius: 8,
  fontFamily: 'Outfit, sans-serif', color: '#0B1D3A',
  boxSizing: 'border-box',
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11,
  fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase',
  letterSpacing: '0.05em', whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px', fontSize: 13, color: '#0B1D3A',
}

// ─── Tab Usuarios ──────────────────────────────────────────────────────────────

function UsuariosTab({ usuarios }: { usuarios: Usuario[] }) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'guard' })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ nombre: '', email: '', password: '', rol: 'guard' })
        window.location.reload()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
          Usuarios
        </h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} style={{
          marginBottom: 24, padding: 20,
          background: '#F9F8F5', border: '1px solid #D0D9E8', borderRadius: 12
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input style={inputStyle} placeholder="Nombre" required
              value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            <input style={inputStyle} placeholder="Email" type="email" required
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input style={inputStyle} placeholder="Contraseña" type="password" required
              value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <select style={inputStyle} value={formData.rol}
              onChange={e => setFormData({ ...formData, rol: e.target.value })}>
              <option value="guard">Guarda</option>
              <option value="supervisor">Supervisor</option>
              <option value="coordinador">Coordinador</option>
              <option value="directivo">Directivo</option>
              <option value="admin">Admin</option>
              <option value="client">Cliente</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
          No hay usuarios
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                {['Nombre', 'Email', 'Rol', 'Zona', 'Activo'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #D0D9E8', background: i % 2 === 0 ? '#fff' : '#F9F8F5' }}>
                  <td style={tdStyle}>{u.nombre || '—'}</td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#EBF0FF', color: '#3B5BDB' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{u.zona || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{u.activo ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab Clientes ──────────────────────────────────────────────────────────────

function ClientesTab({ clientes }: { clientes: Cliente[] }) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', nit: '', tipo: 'tienda', direccion: '', ciudad: '', zona: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('clientes').insert(formData)
      if (!error) {
        setShowForm(false)
        setFormData({ nombre: '', nit: '', tipo: 'tienda', direccion: '', ciudad: '', zona: '' })
        window.location.reload()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
          Clientes
        </h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          marginBottom: 24, padding: 20,
          background: '#F9F8F5', border: '1px solid #D0D9E8', borderRadius: 12
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input style={inputStyle} placeholder="Nombre" required
              value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            <input style={inputStyle} placeholder="NIT"
              value={formData.nit} onChange={e => setFormData({ ...formData, nit: e.target.value })} />
            <select style={inputStyle} value={formData.tipo}
              onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
              <option value="tienda">Tienda</option>
              <option value="bodega">Bodega</option>
              <option value="hospital">Hospital</option>
              <option value="urbanizacion">Urbanización</option>
              <option value="empresa">Empresa</option>
              <option value="otro">Otro</option>
            </select>
            <input style={inputStyle} placeholder="Dirección"
              value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
            <input style={inputStyle} placeholder="Ciudad"
              value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} />
            <input style={inputStyle} placeholder="Zona"
              value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creando...' : 'Crear Cliente'}
          </button>
        </form>
      )}

      {clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
          No hay clientes
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                {['Nombre', 'NIT', 'Tipo', 'Ciudad', 'Zona', 'Activo'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #D0D9E8', background: i % 2 === 0 ? '#fff' : '#F9F8F5' }}>
                  <td style={tdStyle}>{c.nombre}</td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{c.nit || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#DCFCE7', color: '#16a34a' }}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{c.ciudad || '—'}</td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{c.zona || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{c.activo ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab Puestos ───────────────────────────────────────────────────────────────

function PuestosTab({ puestos, clientes }: { puestos: Puesto[]; clientes: Cliente[] }) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ numero: '', nombre: '', cliente_id: '', direccion: '', zona: '', ruta: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('puestos').insert(formData)
      if (!error) {
        setShowForm(false)
        setFormData({ numero: '', nombre: '', cliente_id: '', direccion: '', zona: '', ruta: '' })
        window.location.reload()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
          Puestos
        </h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Puesto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          marginBottom: 24, padding: 20,
          background: '#F9F8F5', border: '1px solid #D0D9E8', borderRadius: 12
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input style={inputStyle} placeholder="Número"
              value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
            <input style={inputStyle} placeholder="Nombre" required
              value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            <select style={inputStyle} required value={formData.cliente_id}
              onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <input style={inputStyle} placeholder="Dirección"
              value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
            <input style={inputStyle} placeholder="Zona"
              value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
            <input style={inputStyle} placeholder="Ruta"
              value={formData.ruta} onChange={e => setFormData({ ...formData, ruta: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creando...' : 'Crear Puesto'}
          </button>
        </form>
      )}

      {puestos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
          No hay puestos
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                {['Número', 'Nombre', 'Cliente', 'Zona', 'Ruta', 'Activo'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {puestos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #D0D9E8', background: i % 2 === 0 ? '#fff' : '#F9F8F5' }}>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{p.numero || '—'}</td>
                  <td style={tdStyle}>{p.nombre}</td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>
                    {clientes.find(c => c.id === p.cliente_id)?.nombre || '—'}
                  </td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{p.zona || '—'}</td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>{p.ruta || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{p.activo ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab IA ────────────────────────────────────────────────────────────────────

function IaTab({ iaUsage }: { iaUsage: any[] }) {
  const totalCosto = iaUsage.reduce((sum, item) => sum + (item.costo_estimado || 0), 0)

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', marginBottom: 20 }}>
        🤖 Monitoreo IA
      </h2>
      <div style={{
        marginBottom: 24, padding: 20,
        background: '#FFF7F5', border: '1px solid #FDD0C0', borderRadius: 12
      }}>
        <p style={{ fontSize: 12, color: '#7A90B0', margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>Gasto total estimado</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#F05A28', margin: 0, fontFamily: 'monospace' }}>
          ${totalCosto.toFixed(6)}
        </p>
      </div>

      {iaUsage.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
          No hay datos de IA
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                {['Usuario ID', 'Fecha', 'Consultas', 'Tokens In', 'Tokens Out', 'Costo'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {iaUsage.map((item, i) => (
                <tr key={`${item.usuario_id}-${item.fecha}`} style={{ borderBottom: '1px solid #D0D9E8', background: i % 2 === 0 ? '#fff' : '#F9F8F5' }}>
                  <td style={{ ...tdStyle, fontSize: 11, color: '#7A90B0', fontFamily: 'monospace' }}>{item.usuario_id}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#7A90B0' }}>{item.fecha}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{item.consultas_count}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, color: '#7A90B0' }}>{item.tokens_input}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, color: '#7A90B0' }}>{item.tokens_output}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#F05A28' }}>
                    ${item.costo_estimado?.toFixed(6) || '0.000000'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
