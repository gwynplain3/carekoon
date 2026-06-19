'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Popup from '@/components/ui/Popup'
import { useUser } from '@/lib/hooks/useUser'
import { User, Lock, LogIn } from 'lucide-react'

function LoginForm() {
  const { user, loading: authLoading } = useUser()
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPopup(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setPopup({ type: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' })
      setLoading(false)
    } else {
      setPopup({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับกลับมาครับ/ค่ะ' })
      setLoading(false)
    }
  }

  const handlePopupClose = () => {
    if (popup?.type === 'success') {
      router.push('/')
    }
    setPopup(null)
  }

  return (
    <main style={{ padding: '60px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ background: 'var(--primary-light)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
          <User size={40} />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
          {isElderFlow ? 'เข้าสู่ระบบผู้สูงอายุ' : 'เข้าสู่ระบบผู้ดูแล'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          {isElderFlow ? 'ยินดีต้อนรับครับคุณตาคุณยาย' : 'ยินดีต้อนรับกลับมาครับผู้ดูแล'}
        </p>
      </header>

      <form onSubmit={handleLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Input label="อีเมลของคุณ" icon={<User size={24} />} type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="รหัสผ่าน" icon={<Lock size={24} />} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="btn-large" type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'white', height: '64px', fontSize: '1.3rem', marginTop: '24px' }}>
          {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={24} /> เข้าสู่ระบบ</>}
        </button>
      </form>

      <footer style={{ marginTop: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>ยังไม่มีบัญชีใช่หรือไม่?</p>
        <Link href={`/register?role=${role}`} style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.3rem', textDecoration: 'underline' }}>
          ลงทะเบียนใหม่ที่นี่
        </Link>
        <div style={{ marginTop: '32px' }}>
          <button onClick={() => router.push('/welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '1.1rem' }}>
            ย้อนกลับไปหน้าเริ่มต้น
          </button>
        </div>
      </footer>

      {popup && <Popup type={popup.type} message={popup.message} onClose={handlePopupClose} />}
    </main>
  )
}

function Loader2({ className }: { className?: string }) {
  return <div className={className} style={{ width: '24px', height: '24px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
