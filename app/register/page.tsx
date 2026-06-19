'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Popup from '@/components/ui/Popup'
import { useUser } from '@/lib/hooks/useUser'
import { User, Lock, Mail, UserPlus, Heart, UserCog } from 'lucide-react'

function RegisterForm() {
  const { user, loading: authLoading } = useUser()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'caretaker'
  const isElderFlow = role === 'elder_self'

  useEffect(() => {
    if (!authLoading && user && !popup) router.replace('/')
  }, [user, authLoading, popup, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPopup(null)

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          display_name: displayName,
          role: role
        }
      }
    })

    if (authError) {
      setPopup({ type: 'error', message: 'ลงทะเบียนไม่สำเร็จ: ' + authError.message })
      setLoading(false)
      return
    }

    if (authData.user) {
      // Create the profile with explicit role
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        display_name: displayName,
        role: role, // 'caretaker' or 'elder_self'
        font_size: isElderFlow ? 22 : 18 // Professional scaling for elders vs caretakers
      })
      
      if (profileError) {
        setPopup({ type: 'error', message: 'สร้างโปรไฟล์ไม่สำเร็จ: ' + profileError.message })
      } else {
        setPopup({ type: 'success', message: 'ลงทะเบียนสำเร็จ! ยินดีต้อนรับครับ/ค่ะ' })
      }
      setLoading(false)
    }
  }

  const handlePopupClose = () => {
    if (popup?.type === 'success') {
      window.location.href = '/'
    }
    setPopup(null)
  }

  return (
    <main style={{ padding: '60px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ background: isElderFlow ? 'var(--primary-light)' : '#fef3c7', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: isElderFlow ? 'var(--primary)' : '#d97706' }}>
          {isElderFlow ? <Heart size={40} /> : <UserCog size={40} />}
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
          {isElderFlow ? 'ลงทะเบียนผู้สูงอายุ' : 'ลงทะเบียนผู้ดูแล'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          มาร่วมเป็นส่วนหนึ่งกับครอบครัว Care คุณ นะครับ
        </p>
      </header>

      <form onSubmit={handleRegister} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Input label={isElderFlow ? "ชื่อเล่นหรือชื่อของคุณ" : "ชื่อ-นามสกุล"} icon={<User size={24} />} placeholder={isElderFlow ? "ตัวอย่าง: คุณตาแดง" : "ระบุชื่อของคุณ"} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <Input label="อีเมล (ใช้แยกจากคนอื่น)" icon={<Mail size={24} />} type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="รหัสผ่าน (อย่างน้อย 6 ตัว)" icon={<Lock size={24} />} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        
        <button className="btn-large" type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', height: '64px', fontSize: '1.3rem', marginTop: '24px' }}>
          {loading ? 'กำลังลงทะเบียน...' : <><UserPlus size={24} /> สร้างบัญชีใหม่</>}
        </button>
      </form>

      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>มีบัญชีอยู่แล้ว?</p>
        <Link href={`/caretaker_login?role=${role}`} style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.3rem', textDecoration: 'underline' }}>
          เข้าสู่ระบบที่นี่
        </Link>
      </footer>

      {popup && <Popup type={popup.type} message={popup.message} onClose={handlePopupClose} />}
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
