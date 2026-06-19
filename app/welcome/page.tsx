'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCog, Heart, User, Check, AlertCircle } from 'lucide-react'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { supabase } from '@/lib/supabase/client'
import Popup from '@/components/ui/Popup'

export default function WelcomePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'welcome' | 'elder_choice' | 'elder_code'>('welcome')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleElderCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim() || loading) return
    setLoading(true); setError('')

    const { data: elder, error: fetchError } = await supabase
      .from('virtual_elders')
      .select('*')
      .eq('login_code', inviteCode.trim().toUpperCase())
      .single()

    if (fetchError || !elder) {
      setError('รหัส 10 หลักไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งครับ')
      setLoading(false)
      return
    }

    localStorage.setItem('virtual_elder_id', elder.id)
    localStorage.setItem('virtual_elder_name', elder.display_name)

    setPopup({ type: 'success', message: `ยินดีต้อนรับครับคุณ ${elder.display_name}! กำลังพาไปหน้าแรก...` })
    setTimeout(() => { window.location.href = '/' }, 1500)
  }

  return (
    <LayoutTransition>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {phase === 'welcome' ? (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h1 style={{ marginBottom: '12px', fontSize: '2.8rem' }}>สวัสดีครับ 🌿</h1>
              <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '48px' }}> ยินดีต้อนรับสู่แอป Care คุณ<br />กรุณาเลือกรูปแบบการใช้งาน </p>

              <div style={{ display: 'grid', gap: '24px' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/caretaker_login?role=caretaker')} className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'left', cursor: 'pointer', background: 'white', width: '100%', padding: '32px', border: '2px solid var(--border)' }}>
                  <div style={{ backgroundColor: 'var(--primary)', padding: '20px', borderRadius: '24px', color: 'white' }}><UserCog size={48} /></div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>สำหรับผู้ดูแล</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '1.2rem' }}>เข้าสู่ระบบด้วยอีเมลเพื่อจัดการผู้สูงอายุ</p>
                  </div>
                </motion.button>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPhase('elder_choice')} className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'left', cursor: 'pointer', background: 'white', width: '100%', padding: '32px', border: '2px solid var(--border)' }}>
                  <div style={{ backgroundColor: '#0EA5E9', padding: '20px', borderRadius: '24px', color: 'white' }}><Heart size={48} /></div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>สำหรับผู้สูงอายุ</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '1.2rem' }}>กดที่นี่เพื่อเข้าใช้งานระบบสำหรับผู้ใหญ่</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : phase === 'elder_choice' ? (
            <motion.div key="elder-choice" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 style={{ marginBottom: '32px', fontSize: '2.2rem' }}>เลือกรูปแบบการใช้งาน</h2>
              <div style={{ display: 'grid', gap: '20px' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPhase('elder_code')} className="card" style={{ padding: '32px', textAlign: 'left', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ backgroundColor: '#0EA5E9', padding: '16px', borderRadius: '20px', color: 'white' }}><Check size={32} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.6rem' }}>มีผู้ดูแลจัดการให้</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.15rem' }}>ใช้รหัส 10 หลักจากผู้ดูแลเพื่อเข้าสู่ระบบ</p>
                  </div>
                </motion.button>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/caretaker_login?role=elder_self')} className="card" style={{ padding: '32px', textAlign: 'left', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '24px', border: '2px solid var(--primary-light)' }}>
                  <div style={{ backgroundColor: 'var(--primary)', padding: '16px', borderRadius: '20px', color: 'white' }}><User size={32} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.6rem' }}>ใช้ระบบในฐานะผู้สูงอายุ (ดูแลตัวเอง)</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.15rem' }}>ลงทะเบียนด้วยอีเมลแยกจากผู้ดูแล</p>
                  </div>
                </motion.button>

                <button onClick={() => setPhase('welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', marginTop: '32px', cursor: 'pointer', fontSize: '1.2rem' }}>ย้อนกลับ</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="code-input" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="card" style={{ padding: '48px 40px' }}>
              <h2 style={{ marginBottom: '12px', fontSize: '2rem' }}>ใส่รหัสเข้าใช้งาน</h2>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '32px' }}>กรุณาใส่รหัส 10 หลักที่ได้รับจากผู้ดูแลของคุณครับ</p>
              <form onSubmit={handleElderCodeSubmit}>
                <div style={{ marginBottom: '32px' }}>
                  <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC123XYZ9" maxLength={10} style={{ width: '100%', height: '90px', fontSize: '2rem', textAlign: 'center', fontWeight: '900', letterSpacing: '4px', borderRadius: '24px', border: error ? '3px solid var(--danger)' : '3px solid var(--border)', backgroundColor: '#F8FAFC' }} autoFocus />
                  {error && ( <div style={{ color: 'var(--danger)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}> <AlertCircle size={24} /> <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error}</span> </div> )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button type="submit" className="btn-large" disabled={inviteCode.length < 10 || loading} style={{ background: 'var(--primary)', color: 'white', width: '100%', height: '80px', fontSize: '1.5rem' }}> {loading ? 'กำลังเข้าสู่ระบบ...' : 'ตกลง'} </button>
                  <button type="button" className="btn-large" onClick={() => { setPhase('elder_choice'); setError(''); setInviteCode(''); }} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', width: '100%', height: '80px', fontSize: '1.3rem' }}> ย้อนกลับ </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
        <p style={{ marginTop: '48px', color: 'var(--text-muted)' }}>Care คุณ v1.1</p>
      </div>
    </LayoutTransition>
  )
}
