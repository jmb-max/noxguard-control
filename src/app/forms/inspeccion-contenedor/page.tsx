import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import InspeccionContenedorForm from './InspeccionContenedorForm'

export default async function InspeccionContenedorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />
      <InspeccionContenedorForm userId={user.id} userEmail={user.email ?? ''} />
    </div>
  )
}
