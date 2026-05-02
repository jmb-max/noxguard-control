import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRows } = await supabase.rpc('get_my_profile')
  const profile = profileRows?.[0] ?? null

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>
        <AdminClient />
      </main>
    </div>
  )
}
