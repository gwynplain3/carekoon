'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCog, Heart, User, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import LayoutTransition from '@/components/layout/LayoutTransition'

export default function RoleSetupPage() {
  const { user, updateProfile } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  
  // Phase 1: Selector, Phase 2: Elder Choice, Phase 3: Elder Code
  const [phase, setPhase] = useState<'selector' | 'elder_choice' | 'elder_code'>('selector')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  async function handleRoleSelect(role: 'caretaker' | 'elder' | 'elder_self') {
    if (role === 'elder') {
      setPhase('elder_choice')
      return
    }
    await saveRole(role)
  }

  async function saveRole(role: string) {
    if (!user) return
    setLoading(role)
    
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    if (!error) {
      updateProfile({ role: role as any })
      router.push('/')
    }
    setLoading(null)
  }

  async function submitElderCode(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !inviteCode.trim()) return
    setError('')
    setLoading('submitting_code')

    // 1. Check if code exists and is pending
    const { data: invite, error: fetchError } = await supabase
      .from('caretaker_invites')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .eq('status', 'pending')
      .single()

    if (fetchError || !invite) {
      setError('รหัสไม่ถูกต้อง หรืออาจถูกใช้งานไปแล้วครับ')
      setLoading(null)
      return
    }

    // 2. Link elder to invite
    const { error: updateError } = await supabase
      .from('caretaker_invites')
      .update({ elder_id: user.id })
      .eq('id', invite.id)

    if (updateError) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ')
      setLoading(null)
      return
    }

    // 3. Set role as elder
    await saveRole('elder')
  }

  const roles = [
    {
      id: 'caretaker',
      title: 'ผู้ดูแล (Caretaker)',
      description: 'ดูแลและจัดการสุขภาพให้กับผู้อื่น',
      icon: <UserCog size={48} />,
      color: 'var(--primary)',
    },
    {
      id: 'elder',
      title: 'ผู้สูงอายุ (Elder)',
      description: 'เข้าใช้งานในฐานะผู้สูงอายุ',
      icon: <Heart size={48} />,
      color: '#0EA5E9',
    }
  ]

  return (
    <LayoutTransition>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '40px 20px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <AnimatePresence mode="wait">
          {phase === 'selector' ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 style={{ marginBottom: '12px' }}>ยินดีต้อนรับครับ</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '40px' }}>
                กรุณาเลือกรูปแบบการใช้งานที่เหมาะสมกับคุณ
              </p>

              <div style={{ display: 'grid', gap: '20px' }}>
                {roles.map((r) => (
                  <motion.button
                    key={r.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!!loading}
                    onClick={() => handleRoleSelect(r.id as any)}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      textAlign: 'left',
                      border: loading === r.id ? '3px solid var(--primary)' : '2px solid var(--border)',
                      cursor: 'pointer',
                      background: 'white',
                      width: '100%',
                      padding: '30px'
                    }}
                  >
                    <div style={{ 
                      backgroundColor: r.color, 
                      padding: '16px', 
                      borderRadius: '20px', 
                      color: 'white',
                      boxShadow: `0 4px 12px ${r.color}40`
                    }}>
                      {r.icon}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)' }}>{r.title}</h2>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>{r.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : phase === 'elder_choice' ? (
            <motion.div
              key="elder-choice"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 style={{ marginBottom: '32px' }}>รูปแบบการดูแลสุขภาพ</h2>
              <div style={{ display: 'grid', gap: '20px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhase('elder_code')}
                  className="card"
                  style={{ padding: '30px', textAlign: 'left', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}
                >
                   <div style={{ backgroundColor: '#0EA5E9', padding: '12px', borderRadius: '16px', color: 'white' }}><Check size={28} /></div>
                   <div>
                     <h3 style={{ margin: 0 }}>มีผู้ดูแลจัดการให้</h3>
                     <p style={{ margin: 0, color: 'var(--text-muted)' }}>ใช้รหัสผ่านจากผู้ดูแลเพื่อเชื่อมต่อ</p>
                   </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => saveRole('elder_self')}
                  className="card"
                  style={{ padding: '30px', textAlign: 'left', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}
                >
                   <div style={{ backgroundColor: '#F59E0B', padding: '12px', borderRadius: '16px', color: 'white' }}><User size={28} /></div>
                   <div>
                     <h3 style={{ margin: 0 }}>จัดการด้วยตนเอง</h3>
                     <p style={{ margin: 0, color: 'var(--text-muted)' }}>ตั้งค่าตารางเวลาและกิจกรรมด้วยตัวเอง</p>
                   </div>
                </motion.button>

                <button 
                  onClick={() => setPhase('selector')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', marginTop: '20px', cursor: 'pointer' }}
                >
                  ย้อนกลับ
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="code-input"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="card"
              style={{ padding: '40px' }}
            >
              <h2 style={{ marginBottom: '12px' }}>ใส่รหัสการเชื่อมต่อ</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
                กรุณาใส่รหัส 6 หลักที่ได้รับจากผู้ดูแลของคุณครับ
              </p>

              <form onSubmit={submitElderCode}>
                <div style={{ marginBottom: '24px' }}>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="เช่น AB1234"
                    maxLength={6}
                    style={{
                      width: '100%',
                      height: '80px',
                      fontSize: '2.5rem',
                      textAlign: 'center',
                      fontWeight: '900',
                      letterSpacing: '8px',
                      borderRadius: '20px',
                      border: error ? '2px solid var(--danger)' : '2px solid var(--border)',
                      backgroundColor: '#F8FAFC'
                    }}
                    autoFocus
                  />
                  {error && (
                    <div style={{ color: 'var(--danger)', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <AlertCircle size={20} />
                      <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{error}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button
                    type="submit"
                    className="btn-large"
                    disabled={inviteCode.length < 4 || !!loading}
                    style={{ background: 'var(--primary)', color: 'white', width: '100%', height: '72px', fontSize: '1.3rem' }}
                  >
                    {loading ? 'กำลังตรวจสอบ...' : 'ตกลง'}
                  </button>
                  <button
                    type="button"
                    className="btn-large"
                    onClick={() => { setPhase('elder_choice'); setError(''); setInviteCode(''); }}
                    style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', width: '100%', height: '72px' }}
                  >
                    ย้อนกลับ
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutTransition>
  )
}
