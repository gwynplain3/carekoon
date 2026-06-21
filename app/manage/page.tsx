'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import Input from '@/components/ui/Input'
import Popup from '@/components/ui/Popup'
import LayoutTransition from '@/components/layout/LayoutTransition'
import MedicineWidget from '@/components/home/MedicineWidget'
import WaterWidget from '@/components/home/WaterWidget'
import GroceryWidget from '@/components/home/GroceryWidget'
import TodoWidget from '@/components/home/TodoWidget'
import WeeklyProgressWidget from '@/components/health/WeeklyProgressWidget'
import PhotoUpload from '@/components/manage/PhotoUpload'
import AlertsBanner from '@/components/manage/AlertsBanner'
import CalorieWidget from '@/components/home/CalorieWidget'
import AppointmentWidget from '@/components/home/AppointmentWidget'
import { compressImage } from '@/lib/avatar'
import {
  Settings, User, Minus, Plus, LogOut, Loader2, 
  Save, QrCode, CheckCircle2, Trash2, UserCheck, ClipboardList,
  ChevronRight, X, HeartPulse, Droplets, ShoppingCart, Users, Copy, Check, Camera, Search, ListTodo, BookOpen, Lock, Unlock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STROKE_WIDTH = 2.5
export default function ManagementPage() {
  const { user, profile, logout, loading } = useUser()
  const router = useRouter()
  
  if (loading) return null // ponytail: avoid heavy loading screen
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Elders List
  const [elderName, setElderName] = useState('')
  const [virtualElders, setVirtualElders] = useState<any[]>([])
  const [realLinks, setRealLinks] = useState<any[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])

  // Selection UI State
  const [showElderListModal, setShowElderListModal] = useState(false)
  const [showAddElderModal, setShowAddElderModal] = useState(false)
  const [successCode, setSuccessCode] = useState<{ name: string, code: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Current Active Elder
  const [selectedElder, setSelectedElder] = useState<any | null>(null)
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.body.classList.add('caretaker-mode')
    return () => document.body.classList.remove('caretaker-mode')
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/welcome')
      } else if (profile?.role !== 'caretaker') {
        router.replace('/')
      } else {
        fetchAllConnections()
      }
    }
  }, [profile, user, loading, router])

  async function fetchAllConnections() {
    if (!user) return
    const { data: virtual } = await supabase.from('virtual_elders').select('*').eq('caretaker_id', user.id).order('created_at')
    const virtuals = (virtual || []).map(v => ({ ...v, type: 'virtual' as const }))
    setVirtualElders(virtuals)

    const { data: real } = await supabase.from('caretaker_elder_links').select(`id, elder:elder_id(id, display_name, avatar_url)`).eq('caretaker_id', user.id)
    const reals = (real || []).map(l => ({ ...l.elder, type: 'real' as const, link_id: l.id }))
    setRealLinks(real || []) // Keeping original setRealLinks for other logic

    // Auto-select first elder if none selected
    if (!selectedElder) {
      if (virtuals.length > 0) setSelectedElder(virtuals[0])
      else if (reals.length > 0) setSelectedElder(reals[0])
    }

    const { data: invites } = await supabase.from('caretaker_invites').select('*, elder:elder_id(display_name)').eq('caretaker_id', user.id).eq('status', 'pending')
    setPendingInvites(invites || [])
  }

  async function createVirtualElder() {
    if (!elderName.trim() || !user) return
    setSaving(true)
    const code = Array.from({length: 10}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
    const { error } = await supabase.from('virtual_elders').insert({ caretaker_id: user.id, display_name: elderName.trim(), login_code: code })
    
    if (!error) { 
      setSuccessCode({ name: elderName.trim(), code })
      setElderName(''); 
      fetchAllConnections(); 
      setShowAddElderModal(false);
    } else {
      setPopup({ type: 'error', message: 'ไม่สามารถสร้างโปรไฟล์ได้' })
    }
    setSaving(false)
  }

  async function toggleLock(elderId: string, elderType: 'real' | 'virtual', currentStatus: boolean) {
    if (!user) return
    const nextStatus = !currentStatus
    const { error } = await supabase.from(elderType === 'virtual' ? 'virtual_elders' : 'profiles').update({ is_profile_locked: nextStatus }).eq('id', elderId)
    
    if (!error) {
      if (elderType === 'virtual') {
        setVirtualElders(prev => prev.map(ev => ev.id === elderId ? { ...ev, is_profile_locked: nextStatus } : ev))
      } else {
        setRealLinks(prev => prev.map(l => l.elder.id === elderId ? { ...l, elder: { ...l.elder, is_profile_locked: nextStatus } } : l))
      }
      if (selectedElder?.id === elderId) setSelectedElder({ ...selectedElder, is_profile_locked: nextStatus })
      setPopup({ type: 'success', message: nextStatus ? 'ล็อคโปรไฟล์เรียบร้อยแล้ว' : 'ปลดล็อคโปรไฟล์เรียบร้อยแล้ว' })
    } else {
      setPopup({ type: 'error', message: 'ไม่สามารถเปลี่ยนสถานะล็อคได้' })
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>, elderId: string, elderType: 'real' | 'virtual') {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `${elderId}.jpg` // Simplified flat path
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`
      
      const { error } = await supabase.from(elderType === 'virtual' ? 'virtual_elders' : 'profiles').update({ avatar_url: finalUrl }).eq('id', elderId)
      if (error) throw error
      
      if (elderType === 'virtual') {
        setVirtualElders(prev => prev.map(ev => ev.id === elderId ? { ...ev, avatar_url: finalUrl } : ev))
      } else {
        setRealLinks(prev => prev.map(l => l.elder.id === elderId ? { ...l, elder: { ...l.elder, avatar_url: finalUrl } } : l))
      }
      if (selectedElder?.id === elderId) setSelectedElder({ ...selectedElder, avatar_url: finalUrl })
      setPopup({ type: 'success', message: 'อัปโหลดรูปเรียบร้อยแล้ว' })
    } catch (err: any) {
      console.error('Upload error:', err)
      setPopup({ type: 'error', message: `อัปโหลดรูปไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}` })
    } finally {
      setUploading(false)
    }
  }

  async function deleteElder(id: string, isVirtual: boolean) {
    if (isVirtual) await supabase.from('virtual_elders').delete().eq('id', id)
    else await supabase.from('caretaker_elder_links').delete().eq('id', id)
    fetchAllConnections()
    setSelectedElder(null)
  }

  const handleCopy = () => {
    if (!successCode) return
    navigator.clipboard.writeText(successCode.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (profile?.role !== 'caretaker') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>สงวนสิทธิ์สำหรับผู้ดูแลเท่านั้นครับ</div>
  }

  const combinedElders = [
    ...virtualElders.map(e => ({ ...e, type: 'virtual' })),
    ...realLinks.map(l => ({ ...l.elder, type: 'real', link_id: l.id }))
  ]

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <AlertsBanner caretakerId={user?.id || ''} />
        {/* Management Header */}
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ backgroundColor: 'var(--primary)', padding: '12px', borderRadius: '16px' }}><Users size={28} color="white" /></div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>ศูนย์จัดการผู้อยู่ในความดูแล</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedElder ? `กำลังจัดการ: ${selectedElder.display_name}` : 'เลือกผู้สูงอายุเพื่อเริ่มต้น'}</p>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)', borderLeft: '2px solid var(--border)', paddingLeft: '12px' }}>
                    {currentTime.toLocaleTimeString('th-TH')} น.
                  </span>
                </div>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-large" onClick={() => setShowElderListModal(true)} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: 'none', padding: '0 24px' }}>
              <Search size={24} strokeWidth={STROKE_WIDTH} /> <span>เลือกผู้สูงอายุ</span>
            </button>
            <button className="btn-large" onClick={() => setShowAddElderModal(true)} style={{ background: 'var(--primary)', color: 'white', padding: '0 24px' }}>
              <Plus size={24} strokeWidth={STROKE_WIDTH} /> <span>เพิ่มคนใหม่</span>
            </button>
          </div>
        </header>

        {/* Selected Elder Dashboard */}
        <AnimatePresence mode="wait">
          {selectedElder ? (
            <motion.div key={selectedElder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="card" style={{ marginBottom: '24px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--primary-light)' }}>
                       {selectedElder.avatar_url ? <img src={selectedElder.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="var(--primary)" style={{ margin: '16px' }} />}
                    </div>
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedElder.display_name}</h2>
                     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedElder.type === 'virtual' ? `รหัสเข้าใช้งาน: ${selectedElder.login_code}` : 'อีเมลลการเชื่อมต่อ'}</span>
                         <button onClick={() => { if (confirm('ลบผู้สูงอายุ?')) deleteElder(selectedElder.type === 'virtual' ? selectedElder.id : selectedElder.link_id, selectedElder.type === 'virtual'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}><Trash2 size={24} strokeWidth={STROKE_WIDTH} /></button>
                      </div>
                    </div>
                 </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button 
                        onClick={() => toggleLock(selectedElder.id, selectedElder.type, selectedElder.is_profile_locked)}
                        className="btn-large" 
                        style={{ 
                          background: selectedElder.is_profile_locked ? '#fee2e2' : 'var(--surface)', 
                          color: selectedElder.is_profile_locked ? 'var(--danger)' : 'var(--text)',
                          border: selectedElder.is_profile_locked ? '1px solid #ef4444' : '1px solid var(--border)',
                          padding: '0 20px',
                          fontSize: '1rem'
                        }}
                      >
                        {selectedElder.is_profile_locked ? <Lock size={20} strokeWidth={STROKE_WIDTH} /> : <Unlock size={20} strokeWidth={STROKE_WIDTH} />}
                        {selectedElder.is_profile_locked ? 'ล็อคอยู่ (Elder แก้ไม่ได้)' : 'ล็อคโปรไฟล์'}
                      </button>

                      <label className="btn-large" style={{ background: 'var(--surface)', fontSize: '1rem', padding: '0 20px', cursor: 'pointer', border: '1px solid var(--border)' }}>
                         {uploading ? <Loader2 size={24} strokeWidth={STROKE_WIDTH} className="animate-spin" /> : <Camera size={24} strokeWidth={STROKE_WIDTH} />}
                         {uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}
                         <input type="file" hidden accept="image/*" onChange={e => handleAvatarChange(e, selectedElder.id, selectedElder.type)} disabled={uploading} />
                      </label>
                 </div>
              </div>

               {/* Bento Grid layout */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                <WeeklyProgressWidget userId={selectedElder.id} targetType={selectedElder.type} />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                  <MedicineWidget userId={selectedElder.id} targetType={selectedElder.type} />
                  <PhotoUpload userId={selectedElder.id} targetType={selectedElder.type} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  <CalorieWidget userId={selectedElder.id} targetType={selectedElder.type} readOnly />
                  <WaterWidget userId={selectedElder.id} targetType={selectedElder.type} />
                  <TodoWidget userId={selectedElder.id} targetType={selectedElder.type} />
                  <GroceryWidget userId={selectedElder.id} targetType={selectedElder.type} />
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '32px', border: '2px dashed var(--border)' }}>
               <Users size={64} color="var(--border)" style={{ marginBottom: '20px' }} />
               <h2 style={{ color: 'var(--text-muted)' }}>ยังไม่ได้เลือกผู้สูงอายุครับ</h2>
               <p style={{ color: 'var(--text-muted)' }}>กรุณาคลิกปุ่ม "เลือกผู้สูงอายุ" ด้านบนเพื่อดูข้อมูล</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Elder Selector Popup */}
      <AnimatePresence>
        {showElderListModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card" style={{ width: '100%', maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '24px' }}>
               <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2 style={{ margin: 0 }}>เลือกผู้สูงอายุ</h2>
                 <button onClick={() => setShowElderListModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
               </div>
               <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {combinedElders.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>ยังไม่มีผู้สูงอายุในระบบครับ</p>}
                 {combinedElders.map(elder => (
                   <button 
                     key={elder.id} 
                     onClick={() => { setSelectedElder(elder); setShowElderListModal(false); }}
                     style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '16px', border: selectedElder?.id === elder.id ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedElder?.id === elder.id ? 'var(--primary-light)' : 'white', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                   >
                     <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: 'var(--primary-light)', flexShrink: 0 }}>
                        {elder.avatar_url ? <img src={elder.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} color="var(--primary)" style={{ margin: '12px' }} />}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{elder.display_name}</div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{elder.type === 'virtual' ? `Code: ${elder.login_code}` : 'อีเมลลการเชื่อมต่อ'}</div>
                     </div>
                     <ChevronRight size={20} color="var(--text-muted)" />
                   </button>
                 ))}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Elder Popup */}
      <AnimatePresence>
        {showAddElderModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', textAlign: 'center', borderRadius: '24px' }}>
               <h2 style={{ marginBottom: '8px' }}>เพิ่มผู้สูงอายุใหม่</h2>
               <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>สร้างโปรไฟล์ใหม่สำหรับการดูแล</p>
               <input autoFocus value={elderName} onChange={e => setElderName(e.target.value)} placeholder="ชื่อผู้สูงอายุ" style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1.1rem', textAlign: 'center', marginBottom: '20px' }} />
               <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-large" onClick={() => setShowAddElderModal(false)} style={{ flex: 1, background: 'var(--surface)', color: 'var(--text-muted)', border: 'none' }}>ยกเลิก</button>
                  <button className="btn-large" onClick={createVirtualElder} disabled={saving || !elderName.trim()} style={{ flex: 2, background: 'var(--primary)', color: 'white' }}>{saving ? <Loader2 className="animate-spin" /> : 'สร้างโปรไฟล์'}</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Code Popup */}
      <AnimatePresence>
        {successCode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', textAlign: 'center', border: '3px solid var(--primary)', borderRadius: '24px' }}>
               <h2 style={{ marginBottom: '8px' }}>สร้างเรียบร้อย!</h2>
               <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>รหัสเข้าใช้งานของ {successCode.name}</p>
               <div onClick={handleCopy} style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: '16px', cursor: 'pointer', marginBottom: '24px', border: '2px dashed var(--primary)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary-dark)', letterSpacing: '4px' }}>{successCode.code}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', marginTop: '8px' }}>{copied ? 'คัดลอกแล้ว!' : 'คลิกเพื่อคัดลอก'}</div>
               </div>
               <button className="btn-large" onClick={() => setSuccessCode(null)} style={{ width: '100%', background: 'var(--primary)', color: 'white' }}>ตกลง</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .manage-widget-section {
          background: #f8fafc;
          padding: 24px;
          border-radius: 32px;
          border: 1px solid var(--border);
        }
      `}</style>
      
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
    </LayoutTransition>
  )
}
