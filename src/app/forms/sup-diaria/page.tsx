import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import SupDiariaForm from './SupDiariaForm'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />
      <SupDiariaForm userId={user.id} userEmail={user.email ?? ''} />
    </div>
  )
}
