'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { Megaphone, Clock, Send, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { motion, AnimatePresence } from 'framer-motion'

const STROKE_WIDTH = 2.5
export default function BroadcastPage() {
  const { user, profile, loading: authLoading } = useUser()
  const [message, setMessage] = useState('')
  const [hours, setHours] = useState(4)
  const [saving, setSaving] = useState(false)
  const [activeBroadcasts, setActiveBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchActiveBroadcasts()
  }, [user])

  async function fetchActiveBroadcasts() {
    setLoading(true)
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('caretaker_id', user?.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setActiveBroadcasts(data || [])
    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || saving || !user) return

    setSaving(true)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hours)

    const { error } = await supabase.from('broadcasts').insert({
      caretaker_id: user.id,
      message: message.trim(),
      expires_at: expiresAt.toISOString()
    })

    if (!error) {
      setMessage('')
      fetchActiveBroadcasts()
    }
    setSaving(false)
  }

  async function deleteBroadcast(id: string) {
    await supabase.from('broadcasts').delete().eq('id', id)
    fetchActiveBroadcasts()
  }

  if (authLoading) return null

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '16px', color: 'white' }}>
              <Megaphone size={32} strokeWidth={STROKE_WIDTH} />
            </div>
            <h1 style={{ margin: 0 }}>ประกาศถึงผู้อยู่อาศัย</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>ส่งข้อความสำคัญที่จะไปปรากฏที่ด้านบนสุดของหน้าจอผู้สูงอายุทันที</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Create Broadcast */}
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>เริ่มประกาศใหม่</h2>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>ข้อความประกาศ</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="เช่น: วันนี้หมอนัดตอน 10 โมงนะครับ หรือ อย่าลืมดื่มน้ำเยอะๆ นะ"
                  style={{ width: '100%', height: '150px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '1.1rem', outline: 'none', resize: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>ระยะเวลาการแสดงผล</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[1, 4, 8, 24].map(h => (
                    <button 
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: hours === h ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: hours === h ? 'var(--primary-light)' : 'white',
                        color: hours === h ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {h} ชม.
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving || !message.trim()} 
                className="btn-large" 
                style={{ width: '100%', background: 'var(--primary)', color: 'white' }}
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Send size={20} /> ส่งประกาศทันที</>}
              </button>
            </form>
          </div>

          {/* Active Broadcasts */}
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>รายการประกาศที่กำลังแสดง</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? <Loader2 className="animate-spin" /> : activeBroadcasts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Megaphone size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>ไม่มีประกาศที่กำลังแสดงในขณะนี้</p>
                </div>
              ) : activeBroadcasts.map(b => (
                <div key={b.id} style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>{b.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Clock size={16} /> หมดเวลา: {new Date(b.expires_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button onClick={() => deleteBroadcast(b.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={24} strokeWidth={STROKE_WIDTH} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LayoutTransition>
  )
}
