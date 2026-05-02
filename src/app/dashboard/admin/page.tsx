'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Usuario, Cliente } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
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
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : activeTab === 'usuarios' ? (
          <UsuariosTab usuarios={usuarios} />
        ) : (
          <ClientesTab clientes={clientes} />
        )}
      </div>
    </div>
  )
}

function UsuariosTab({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Usuarios</h2>
      {usuarios.length === 0 ? (
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
