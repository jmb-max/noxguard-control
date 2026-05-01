import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import FormsClient from './FormsClient'

export default async function FormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profileRows } = await supabase.rpc('get_my_profile')
  const profile = profileRows?.[0] ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB', fontFamily: 'Outfit, sans-serif' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />
      <FormsClient userName={user.email ?? ''} userRole={profile?.role ?? ''} />
    </div>
  )
}
