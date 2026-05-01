import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

export default async function CierresAraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRows } = await supabase.rpc('get_my_profile')
  const profile = profileRows?.[0] ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EB', display: 'flex', flexDirection: 'column' }}>
      <Header userName={user.email ?? ''} userRole={profile?.role} />
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src="/cierres-ara.html"
          style={{
            width: '100%',
            height: 'calc(100vh - 56px)',
            border: 'none',
            display: 'block',
          }}
          title="Cierres ARA"
        />
      </div>
    </div>
  )
}
