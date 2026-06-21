'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import LayoutTransition from '@/components/layout/LayoutTransition'
import SideNav from '@/components/layout/SideNav'
import AppointmentWidget from '@/components/home/AppointmentWidget'
import { Calendar, Users, Loader2 } from 'lucide-react'

export default function ManagedAppointmentsPage() {
  const { user, loading: authLoading } = useUser()
  const [managedElders, setManagedElders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      fetchManagedElders()
    }
  }, [authLoading, user])

  async function fetchManagedElders() {
    setLoading(true)
    const { data: real } = await supabase.from('caretaker_elder_links').select('elder_id, profiles:elder_id(display_name)').eq('caretaker_id', user!.id)
    const { data: virtual } = await supabase.from('virtual_elders').select('id, display_name').eq('caretaker_id', user!.id)
    
    const combined = [
      ...(real || []).map(r => ({ id: r.elder_id, name: (r.profiles as any)?.display_name, type: 'real' })),
      ...(virtual || []).map(v => ({ id: v.id, name: v.display_name, type: 'virtual' }))
    ]
    setManagedElders(combined)
    setLoading(false)
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
            <div style={{ background: 'var(--primary)', padding: '16px', borderRadius: '20px', color: 'white' }}>
              <Calendar size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900' }}>การนัดหมายแพทย์</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', margin: 0 }}>จัดการตารางนัดหมายทั้งหมดของผู้สูงอายุในความดูแลของคุณ</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" color="var(--primary)" size={48} /></div>
        ) : managedElders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', borderRadius: '32px' }}>
             <Users size={64} color="var(--border)" style={{ marginBottom: '20px' }} />
             <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>คุณยังไม่มีผู้สูงอายุในความดูแลครับ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {managedElders.map(elder => (
              <section key={elder.id}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '32px', background: 'var(--primary)', borderRadius: '6px' }} />
                  คุณ {elder.name}
                </h2>
                <AppointmentWidget userId={elder.id} targetType={elder.type} />
              </section>
            ))}
          </div>
        )}
      </div>
    </LayoutTransition>
  )
}
