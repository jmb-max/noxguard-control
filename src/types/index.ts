export type Rol = 'admin' | 'directivo' | 'coordinador' | 'supervisor' | 'guarda' | 'cliente'

export interface Usuario {
  id: string
  email: string
  nombre?: string
  rol: Rol
  zona?: string
  ruta?: string
  placa?: string
  activo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  nombre: string
  nit?: string
  tipo: 'tienda' | 'bodega' | 'hospital' | 'urbanizacion' | 'empresa' | 'otro'
  direccion?: string
  ciudad?: string
  zona?: string
  activo: boolean
  created_at: string
}

export interface Puesto {
  id: string
  numero?: string
  nombre: string
  direccion?: string
  cliente_id?: string
  zona?: string
  ruta?: string
  coords_lat?: number | null
  coords_lng?: number | null
  activo: boolean
  created_at: string
}
