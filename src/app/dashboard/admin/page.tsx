'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Usuario } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setUsuarios(data)
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">⚙️ Panel Admin</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">👤 Usuarios</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : usuarios.length === 0 ? (
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
    </div>
  )
}
