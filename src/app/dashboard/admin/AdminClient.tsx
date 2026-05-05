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
        const [{ data: uData, error: uError }, { data: cData }] = await Promise.all([
          supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
          supabase.from('clientes').select('id, nombre, zona, tipo, activo, created_at').eq('activo', true).order('nombre'),
        ])
        if (!uError && uData) setUsuarios(uData)
        if (cData) setClientes(cData)
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
          <UsuariosTab usuarios={usuarios} clientes={clientes} onReload={loadData} />
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

function UsuariosTab({ usuarios, clientes, onReload }: {
  usuarios: Usuario[]
  clientes: Cliente[]
  onReload: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nombre: '', email: '', password: '', rol: 'guarda', zona: '', cliente_id: '',
  })

  // Estado de edición — null = sin modal abierto
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [editData, setEditData] = useState({ nombre: '', rol: '', zona: '', cliente_id: '', activo: true })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Roles que necesitan cliente_id
  const rolNecesitaCliente = (r: string) => r === 'cliente' || r === 'coordinador'
  // Roles que necesitan zona
  const rolNecesitaZona = (r: string) => r === 'supervisor'

  // ── Crear usuario ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: any = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
      }
      if (rolNecesitaCliente(formData.rol) && formData.cliente_id) body.cliente_id = formData.cliente_id
      if (rolNecesitaZona(formData.rol) && formData.zona) body.zona = formData.zona

      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Error al crear'); return }
      setShowForm(false)
      setFormData({ nombre: '', email: '', password: '', rol: 'guarda', zona: '', cliente_id: '' })
      onReload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Abrir modal edición ───────────────────────────────────────────────────
  const abrirEdicion = (u: Usuario) => {
    setEditando(u)
    setEditData({
      nombre: u.nombre || '',
      rol: u.rol || '',
      zona: (u as any).zona || '',
      cliente_id: (u as any).cliente_id || '',
      activo: u.activo ?? true,
    })
    setEditError('')
  }

  // ── Guardar edición ───────────────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setEditLoading(true)
    setEditError('')
    try {
      const body: any = {
        id: editando.id,
        nombre: editData.nombre,
        rol: editData.rol,
        zona: rolNecesitaZona(editData.rol) ? editData.zona : null,
        cliente_id: rolNecesitaCliente(editData.rol) ? editData.cliente_id : null,
        activo: editData.activo,
      }
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setEditError(json.error || 'Error al guardar'); return }
      setEditando(null)
      onReload()
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  // ── Eliminar usuario ──────────────────────────────────────────────────────
  const handleDelete = async (u: Usuario) => {
    if (!confirm(`¿Eliminar a ${u.nombre || u.email}? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error || 'Error al eliminar'); return }
      onReload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const rolLabel = (r: string) => ({
    admin: '⚙️ Admin', directivo: '👔 Directivo', coordinador: '📋 Coordinador',
    supervisor: '🔍 Supervisor', guarda: '🛡️ Guarda', cliente: '🏢 Cliente',
  }[r] ?? r)

  const clienteNombre = (id: string | null) =>
    id ? (clientes.find(c => c.id === id)?.nombre ?? id.slice(0, 8) + '…') : '—'

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1D3A', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
          Usuarios
        </h2>
        <button onClick={() => { setShowForm(!showForm); setError('') }} style={btnPrimary}>
          {showForm ? '✕ Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* ── Formulario crear ── */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          marginBottom: 24, padding: 20,
          background: '#F9F8F5', border: '1px solid #D0D9E8', borderRadius: 12
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input style={inputStyle} placeholder="Nombre completo" required
              value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            <input style={inputStyle} placeholder="Email" type="email" required
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input style={inputStyle} placeholder="Contraseña" type="password" required minLength={6}
              value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <select style={inputStyle} value={formData.rol}
              onChange={e => setFormData({ ...formData, rol: e.target.value, zona: '', cliente_id: '' })}>
              <option value="guarda">🛡️ Guarda</option>
              <option value="supervisor">🔍 Supervisor</option>
              <option value="coordinador">📋 Coordinador</option>
              <option value="directivo">👔 Directivo</option>
              <option value="admin">⚙️ Admin</option>
              <option value="cliente">🏢 Cliente</option>
            </select>

            {/* Campo condicional: empresa (cliente / coordinador) */}
            {rolNecesitaCliente(formData.rol) && (
              <select style={inputStyle} value={formData.cliente_id}
                onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                <option value="">— Selecciona empresa —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}

            {/* Campo condicional: zona (supervisor) */}
            {rolNecesitaZona(formData.rol) && (
              <input style={inputStyle} placeholder="Zona asignada (ej: Zona Norte)"
                value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
            )}
          </div>

          {error && (
            <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>
              ⚠️ {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {/* ── Tabla ── */}
      {usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0AFC4', fontFamily: 'Outfit, sans-serif' }}>
          No hay usuarios
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #D0D9E8' }}>
                {['Nombre', 'Email', 'Rol', 'Empresa / Zona', 'Activo', 'Acciones'].map(h => (
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
                      {rolLabel(u.rol)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#7A90B0', fontSize: 12 }}>
                    {rolNecesitaCliente(u.rol)
                      ? clienteNombre((u as any).cliente_id)
                      : (u as any).zona || '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{u.activo ? '✅' : '❌'}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => abrirEdicion(u)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #D0D9E8', background: '#fff', cursor: 'pointer', marginRight: 6, fontFamily: 'Outfit, sans-serif' }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal edición ── */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11,29,58,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={handleEdit} style={{
            background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440,
            boxShadow: '0 8px 32px rgba(11,29,58,0.18)', fontFamily: 'Outfit, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1D3A' }}>
                ✏️ Editar Usuario
              </h3>
              <button type="button" onClick={() => setEditando(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#7A90B0' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 4 }}
                  value={editData.nombre}
                  onChange={e => setEditData({ ...editData, nombre: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</label>
                <select style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 4 }}
                  value={editData.rol}
                  onChange={e => setEditData({ ...editData, rol: e.target.value, zona: '', cliente_id: '' })}>
                  <option value="guarda">🛡️ Guarda</option>
                  <option value="supervisor">🔍 Supervisor</option>
                  <option value="coordinador">📋 Coordinador</option>
                  <option value="directivo">👔 Directivo</option>
                  <option value="admin">⚙️ Admin</option>
                  <option value="cliente">🏢 Cliente</option>
                </select>
              </div>

              {rolNecesitaCliente(editData.rol) && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa asignada</label>
                  <select style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 4 }}
                    value={editData.cliente_id}
                    onChange={e => setEditData({ ...editData, cliente_id: e.target.value })}>
                    <option value="">— Sin empresa —</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {rolNecesitaZona(editData.rol) && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#7A90B0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona asignada</label>
                  <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 4 }}
                    placeholder="Ej: Zona Norte"
                    value={editData.zona}
                    onChange={e => setEditData({ ...editData, zona: e.target.value })} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="editActivo" checked={editData.activo}
                  onChange={e => setEditData({ ...editData, activo: e.target.checked })} />
                <label htmlFor="editActivo" style={{ fontSize: 13, color: '#0B1D3A', cursor: 'pointer' }}>
                  Usuario activo
                </label>
              </div>
            </div>

            {editError && (
              <div style={{ color: '#DC2626', fontSize: 12, marginTop: 10 }}>⚠️ {editError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" disabled={editLoading}
                style={{ ...btnSecondary, flex: 1, opacity: editLoading ? 0.6 : 1 }}>
                {editLoading ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditando(null)}
                style={{ ...btnPrimary, background: '#7A90B0', flex: 'none', padding: '8px 16px' }}>
                Cancelar
              </button>
            </div>
          </form>
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
  const [formData, setFormData] = useState({ numero: '', nombre: '', cliente_id: '', direccion: '', zona: '', ruta: '', coords_lat: '', coords_lng: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ coords_lat: string; coords_lng: string }>({ coords_lat: '', coords_lng: '' })
  const [editLoading, setEditLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        coords_lat: formData.coords_lat ? parseFloat(formData.coords_lat) : null,
        coords_lng: formData.coords_lng ? parseFloat(formData.coords_lng) : null,
      }
      const { error } = await supabase.from('puestos').insert(payload)
      if (!error) {
        setShowForm(false)
        setFormData({ numero: '', nombre: '', cliente_id: '', direccion: '', zona: '', ruta: '', coords_lat: '', coords_lng: '' })
        window.location.reload()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  const geocodeAddress = async (direccion: string, ciudad = 'Colombia') => {
    if (!direccion.trim()) return
    setGeocoding(true)
    setGeocodeError('')
    try {
      const query = encodeURIComponent(`${direccion}, ${ciudad}`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'NoxGuardControl/1.0' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          coords_lat: parseFloat(data[0].lat).toFixed(6),
          coords_lng: parseFloat(data[0].lon).toFixed(6),
        }))
      } else {
        setGeocodeError('Dirección no encontrada — ingresa coords manualmente')
      }
    } catch {
      setGeocodeError('Error de red — ingresa coords manualmente')
    } finally {
      setGeocoding(false)
    }
  }

  const handleEditCoords = async (id: string) => {
    setEditLoading(true)
    try {
      const { error } = await supabase.from('puestos').update({
        coords_lat: editData.coords_lat ? parseFloat(editData.coords_lat) : null,
        coords_lng: editData.coords_lng ? parseFloat(editData.coords_lng) : null,
      }).eq('id', id)
      if (!error) {
        setEditingId(null)
        window.location.reload()
      }
    } catch (err) {
      console.error('Error al guardar coords:', err)
    } finally {
      setEditLoading(false)
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
            <button
              type="button"
              onClick={() => geocodeAddress(formData.direccion)}
              disabled={geocoding || !formData.direccion.trim()}
              style={{ ...inputStyle, background: geocoding ? '#7A90B0' : '#0B1D3A', color: '#fff', border: 'none', cursor: geocoding || !formData.direccion.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: !formData.direccion.trim() ? 0.5 : 1 }}
            >
              {geocoding ? '🔍 Buscando...' : '🔍 Buscar coords'}
            </button>
            {geocodeError && (
              <div style={{ gridColumn: '1/-1', fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                ⚠️ {geocodeError}
              </div>
            )}
            <input style={inputStyle} placeholder="Zona"
              value={formData.zona} onChange={e => setFormData({ ...formData, zona: e.target.value })} />
            <input style={inputStyle} placeholder="Ruta"
              value={formData.ruta} onChange={e => setFormData({ ...formData, ruta: e.target.value })} />
            <input style={inputStyle} placeholder="Latitud (auto o manual)"
              value={formData.coords_lat} onChange={e => setFormData({ ...formData, coords_lat: e.target.value })} />
            <input style={inputStyle} placeholder="Longitud (auto o manual)"
              value={formData.coords_lng} onChange={e => setFormData({ ...formData, coords_lng: e.target.value })} />
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
                {['Número', 'Nombre', 'Cliente', 'Zona', 'Ruta', 'GPS', 'Activo', ''].map(h => (
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
                  <td style={{ ...tdStyle, fontSize: 11 }}>
                    {editingId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
                        <input
                          style={{ ...inputStyle, padding: '4px 8px', fontSize: 11 }}
                          placeholder="Lat (ej: 4.6097)"
                          value={editData.coords_lat}
                          onChange={e => setEditData({ ...editData, coords_lat: e.target.value })}
                        />
                        <input
                          style={{ ...inputStyle, padding: '4px 8px', fontSize: 11 }}
                          placeholder="Lng (ej: -74.0817)"
                          value={editData.coords_lng}
                          onChange={e => setEditData({ ...editData, coords_lng: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleEditCoords(p.id)}
                            disabled={editLoading}
                            style={{ ...btnSecondary, padding: '4px 10px', fontSize: 11, opacity: editLoading ? 0.6 : 1 }}
                          >
                            {editLoading ? '...' : '✓ Guardar'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ background: 'none', border: '1px solid #D0D9E8', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#7A90B0' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: (p as any).coords_lat ? '#22C55E' : '#A0AFC4' }}>
                        {(p as any).coords_lat
                          ? `${Number((p as any).coords_lat).toFixed(4)}, ${Number((p as any).coords_lng).toFixed(4)}`
                          : '— sin GPS'}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{p.activo ? '✅' : '❌'}</td>
                  <td style={{ ...tdStyle }}>
                    {editingId !== p.id && (
                      <button
                        onClick={() => {
                          setEditingId(p.id)
                          setEditData({
                            coords_lat: (p as any).coords_lat?.toString() ?? '',
                            coords_lng: (p as any).coords_lng?.toString() ?? '',
                          })
                        }}
                        style={{ background: 'none', border: '1px solid #D0D9E8', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: '#0B1D3A', fontWeight: 600 }}
                      >
                        📍 GPS
                      </button>
                    )}
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
