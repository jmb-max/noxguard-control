'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Usuario, Cliente, Puesto } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">⚙️ Panel Admin</h1>

      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'usuarios'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👤 Usuarios
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'clientes'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🏪 Clientes
        </button>
        <button
          onClick={() => setActiveTab('puestos')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'puestos'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📍 Puestos
        </button>
        <button
          onClick={() => setActiveTab('ia')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'ia'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🤖 Monitoreo IA
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
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

function UsuariosTab({ usuarios }: { usuarios: Usuario[] }) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'guarda' })

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
        setFormData({ nombre: '', email: '', password: '', rol: 'guarda' })
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
        >
          {showForm ? '✕ Cancelar' : '➕ Nuevo Usuario'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              placeholder="Nombre"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="p-2 border rounded text-sm"
            />
            <input
              placeholder="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="p-2 border rounded text-sm"
            />
            <input
              placeholder="Contraseña"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="p-2 border rounded text-sm"
            />
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="p-2 border rounded text-sm"
            >
              <option value="guarda">Guarda</option>
              <option value="supervisor">Supervisor</option>
              <option value="coordinador">Coordinador</option>
              <option value="directivo">Directivo</option>
              <option value="admin">Admin</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}
      {usuarios.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-500">No hay usuarios</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold">Nombre</th>
                <th className="p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Rol</th>
                <th className="p-3 text-left font-semibold">Zona</th>
                <th className="p-3 text-center font-semibold">Activo</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{usuario.nombre || '-'}</td>
                  <td className="p-3 text-xs text-gray-600">{usuario.email}</td>
                  <td className="p-3 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600">{usuario.zona || '-'}</td>
                  <td className="p-3 text-center">
                    {usuario.activo ? '✅' : '❌'}
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

function IaTab({ iaUsage }: { iaUsage: any[] }) {
  const totalCosto = iaUsage.reduce((sum, item) => sum + (item.costo_estimado || 0), 0)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🤖 Monitoreo IA</h2>
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded">
        <p className="text-sm text-gray-600">Gasto total en IA:</p>
        <p className="text-2xl font-bold text-orange-600">${totalCosto.toFixed(6)}</p>
      </div>
      {iaUsage.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay datos de IA</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold">Usuario ID</th>
                <th className="p-3 text-left font-semibold">Fecha</th>
                <th className="p-3 text-right font-semibold">Consultas</th>
                <th className="p-3 text-right font-semibold">Tokens Input</th>
                <th className="p-3 text-right font-semibold">Tokens Output</th>
                <th className="p-3 text-right font-semibold">Costo</th>
              </tr>
            </thead>
            <tbody>
              {iaUsage.map((item) => (
                <tr key={`${item.usuario_id}-${item.fecha}`} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-xs text-gray-600 font-mono">{item.usuario_id}</td>
                  <td className="p-3 text-xs text-gray-600">{item.fecha}</td>
                  <td className="p-3 text-right">{item.consultas_count}</td>
                  <td className="p-3 text-right text-xs text-gray-600">{item.tokens_input}</td>
                  <td className="p-3 text-right text-xs text-gray-600">{item.tokens_output}</td>
                  <td className="p-3 text-right font-semibold text-orange-600">
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

function PuestosTab({ puestos, clientes }: { puestos: Puesto[]; clientes: Cliente[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Puestos</h2>
      {puestos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay puestos</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold">Número</th>
                <th className="p-3 text-left font-semibold">Nombre</th>
                <th className="p-3 text-left font-semibold">Cliente</th>
                <th className="p-3 text-left font-semibold">Zona</th>
                <th className="p-3 text-left font-semibold">Ruta</th>
                <th className="p-3 text-center font-semibold">Activo</th>
              </tr>
            </thead>
            <tbody>
              {puestos.map((puesto) => (
                <tr key={puesto.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-xs text-gray-600">{puesto.numero || '-'}</td>
                  <td className="p-3">{puesto.nombre}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {clientes.find((c) => c.id === puesto.cliente_id)?.nombre || '-'}
                  </td>
                  <td className="p-3 text-xs text-gray-600">{puesto.zona || '-'}</td>
                  <td className="p-3 text-xs text-gray-600">{puesto.ruta || '-'}</td>
                  <td className="p-3 text-center">
                    {puesto.activo ? '✅' : '❌'}
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

function ClientesTab({ clientes }: { clientes: Cliente[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Clientes</h2>
      {clientes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay clientes</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold">Nombre</th>
                <th className="p-3 text-left font-semibold">NIT</th>
                <th className="p-3 text-left font-semibold">Tipo</th>
                <th className="p-3 text-left font-semibold">Ciudad</th>
                <th className="p-3 text-left font-semibold">Zona</th>
                <th className="p-3 text-center font-semibold">Activo</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{cliente.nombre}</td>
                  <td className="p-3 text-xs text-gray-600">{cliente.nit || '-'}</td>
                  <td className="p-3 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {cliente.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600">{cliente.ciudad || '-'}</td>
                  <td className="p-3 text-xs text-gray-600">{cliente.zona || '-'}</td>
                  <td className="p-3 text-center">
                    {cliente.activo ? '✅' : '❌'}
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
