import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import FormsClient from './FormsClient'

export default async function FormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Obtener rol directo de tabla usuarios
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('auth_id', user.id)
    .single()
  
  const userRole = usuarios?.rol ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB', fontFamily: 'Outfit, sans-serif' }}>
      <Header userName={user.email ?? ''} userRole={userRole} />
      <FormsClient userName={user.email ?? ''} userRole={userRole ?? ''} />
    </div>
  )
}
