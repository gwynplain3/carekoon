'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import Input from '@/components/ui/Input'
import Popup from '@/components/ui/Popup'
import LayoutTransition from '@/components/layout/LayoutTransition'
import {
  applyFontSize,
  FONT_SIZE_DEFAULT,
  resolveFontSize,
} from '@/lib/fontSize'
import { compressImage } from '@/lib/avatar'
import { supabase } from '@/lib/supabase/client'
import {
  Settings, User, LogOut, HeartPulse
} from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, updateProfile, isVirtual } = useUser()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name || '')
    setFontSize(resolveFontSize(profile.font_size, profile.id))
    setAvatarUrl(profile.avatar_url || null)
  }, [profile])

  async function saveProfile(patch: { display_name?: string; font_size?: number; avatar_url?: string }) {
    const id = profile?.id
    if (!id) return { error: new Error('not logged in') }
    
    if (isVirtual) {
      return supabase.from('virtual_elders').update(patch).eq('id', id)
    }
    return supabase.from('profiles').upsert({ id, ...patch, updated_at: new Date().toISOString() })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = profile?.id
    if (!file || !id) return

    if (profile?.is_profile_locked) {
      setPopup({ type: 'error', message: 'โปรไฟล์ถูกล็อคโดยผู้ดูแล ไม่สามารถแก้ไขได้ครับ' })
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `${id}.jpg`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const finalUrl = `${publicUrl}?t=${Date.now()}`
      
      const { error: saveError } = await saveProfile({ avatar_url: finalUrl })
      if (saveError) throw saveError

      setAvatarUrl(finalUrl)
      updateProfile({ avatar_url: finalUrl })
      setPopup({ type: 'success', message: 'เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว' })
    } catch (err: any) {
      console.error('Upload error:', err)
      setPopup({ type: 'error', message: `อัปโหลดรูปไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}` })
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('virtual_elder_id')
    localStorage.removeItem('virtual_elder_name')
    router.replace('/welcome')
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '16px', borderRadius: '24px' }}>
              <Settings size={36} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '2.4rem' }}>การตั้งค่า</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', marginLeft: '88px' }}>
            ตั้งค่าข้อมูลส่วนตัวและการใช้งาน
          </p>
        </header>

        <section className="card" style={{ marginBottom: '32px', padding: '32px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>โปรไฟล์ของฉัน</h2>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary-light)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} color="var(--primary)" />}
              </div>
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
              </label>
            </div>
            <div style={{ flex: 1 }}>
               <Input 
                label="ชื่อที่แสดง" 
                icon={<User size={20} />} 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                disabled={profile?.is_profile_locked}
              />
            </div>
          </div>
          <button 
            className="btn-large" 
            onClick={() => { 
              if (profile?.is_profile_locked) {
                setPopup({ type: 'error', message: 'โปรไฟล์ถูกล็อคโดยผู้ดูแล ไม่สามารถแก้ไขได้ครับ' })
                return
              }
              setSaving(true); 
              saveProfile({ display_name: displayName }).then(() => { 
                setSaving(false); 
                setPopup({ type: 'success', message: 'บันทึกเรียบร้อย' }); 
                updateProfile({ display_name: displayName }); 
              }); 
            }} 
            disabled={saving || profile?.is_profile_locked} 
            style={{ 
              width: '100%', 
              background: profile?.is_profile_locked ? 'var(--border)' : 'var(--primary)', 
              color: 'white',
              opacity: profile?.is_profile_locked ? 0.7 : 1
            }}
          >
            {saving ? <Loader2 size={24} className="animate-spin" /> : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </section>

        <button className="btn-large" onClick={() => setShowLogoutConfirm(true)} style={{ width: '100%', background: 'white', color: 'var(--danger)', border: '3px solid var(--danger)' }}>
          <LogOut size={32} /> ออกจากระบบ
        </button>
      </div>

      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
            <h2>ยืนยันออกจากระบบ?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
              <button className="btn-large" onClick={handleLogout} style={{ background: 'var(--danger)', color: 'white' }}>ใช่ ออกจากระบบ</button>
              <button className="btn-large" onClick={() => setShowLogoutConfirm(false)} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </LayoutTransition>
  )
}

import { Camera, Loader2 } from 'lucide-react'
