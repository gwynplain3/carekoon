'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import SideNav from '@/components/layout/SideNav'
import MedicineWidget from '@/components/home/MedicineWidget'
import WaterWidget from '@/components/home/WaterWidget'
import GroceryWidget from '@/components/home/GroceryWidget'
import TodoWidget from '@/components/home/TodoWidget'
import DiaryBlogWidget from '@/components/home/DiaryBlogWidget'
import Popup from '@/components/ui/Popup'
import { 
  Plus, Loader2, ListTodo, Calendar, Clock, BookOpen, MessageSquare, ChevronRight, HeartPulse, Droplets, ShoppingCart, Users, Megaphone, Camera, User, Lock
} from 'lucide-react'
import LayoutTransition from '@/components/layout/LayoutTransition'
import Link from 'next/link'

export default function Home() {
  const { user, profile, isVirtual, loading } = useUser()
  const router = useRouter()

  if (loading) return null // ponytail: avoid heavy loading screen, just wait for transition
  
  const [selectedElder, setSelectedElder] = useState<{ id: string, type: 'real' | 'virtual', name?: string } | null>(null)
  const [allElders, setAllElders] = useState<any[]>([])

  const targetId = isVirtual ? profile?.id : (selectedElder?.id || (profile?.role !== 'caretaker' ? user?.id : null))
  const targetType = isVirtual ? 'virtual' : (selectedElder?.type || 'real')

  const today = new Date()
  const thaiDate = today.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!loading) {
      if (!user && !isVirtual) {
        router.replace('/welcome')
      } else if (profile?.role === 'caretaker') {
        router.replace('/manage')
      }
    }
  }, [profile, user, isVirtual, loading, router])

  async function fetchLinkedElders() {
    if (!user) return
    const { data: real } = await supabase.from('caretaker_elder_links').select('elder_id, profiles:elder_id(display_name)').eq('caretaker_id', user.id)
    const { data: virtual } = await supabase.from('virtual_elders').select('id, display_name').eq('caretaker_id', user.id)
    const combined = [
      ...(real || []).map(r => ({ id: r.elder_id, name: (r.profiles as any)?.display_name, type: 'real' })),
      ...(virtual || []).map(v => ({ id: v.id, name: v.display_name, type: 'virtual' }))
    ]
    setAllElders(combined)
    if (combined.length > 0 && !selectedElder) setSelectedElder({ id: combined[0].id, type: combined[0].type as any, name: combined[0].name })
  }

  const [activeBroadcast, setActiveBroadcast] = useState<any>(null)

  useEffect(() => {
    if (targetId) fetchActiveBroadcast()
  }, [targetId, targetType])

  async function fetchActiveBroadcast() {
    let caretakerId = null
    
    if (targetType === 'virtual') {
      const { data } = await supabase.from('virtual_elders').select('caretaker_id').eq('id', targetId).single()
      caretakerId = data?.caretaker_id
    } else {
      const { data } = await supabase.from('caretaker_elder_links').select('caretaker_id').eq('elder_id', targetId).single()
      caretakerId = data?.caretaker_id
    }

    if (caretakerId) {
      const { data } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('caretaker_id', caretakerId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setActiveBroadcast(data)
    }
  }

  const [uploading, setUploading] = useState(false)
  const [popup, setPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (profile.is_profile_locked) {
      setPopup({ type: 'error', message: 'โปรไฟล์ของคุณถูกล็อคโดยผู้ดูแล ไม่สามารถเปลี่ยนรูปได้ครับ' })
      return
    }
    
    setUploading(true)
    try {
      const { compressImage } = await import('@/lib/avatar')
      const compressed = await compressImage(file)
      const path = isVirtual ? `${profile.id}.jpg` : `${user?.id || profile.id}.jpg`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true, contentType: 'image/jpeg', cacheControl: '0' })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`
      
      const { error } = await supabase.from(isVirtual ? 'virtual_elders' : 'profiles').update({ avatar_url: finalUrl }).eq('id', profile.id)
      if (error) throw error
      
      window.location.reload() // ponytail: simplest way to sync everything
    } catch (err: any) {
      setPopup({ type: 'error', message: `อัปโหลดรูปไม่สำเร็จ: ${err.message}` })
    } finally {
      setUploading(false)
    }
  }

  // Main Dashboard View
  return (
    <LayoutTransition>
      <SideNav />
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      <div className="main-wrapper">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.2rem' }}>สวัสดีครับ, คุณ{profile?.display_name || 'ผู้ใช้งาน'}!</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', margin: '6px 0 0 0' }}>วันนี้เป็นวันสุขภาพที่ดีครับ 🌿</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-dark)', fontWeight: 'bold', fontSize: '1.1rem' }}><Calendar size={22} /> {thaiDate}</div>
             <div style={{ fontSize: '2.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}><Clock size={32} color="var(--text-muted)" />{today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>
        
        {/* Active Broadcast Banner */}
        <AnimatePresence>
          {activeBroadcast && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '32px' }}
            >
              <div style={{ 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
                padding: '32px', 
                borderRadius: '32px', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                boxShadow: '0 15px 35px rgba(2, 132, 199, 0.25)' 
              }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '20px' }}>
                  <Megaphone size={40} className="animate-pulse" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>ประกาศจากผู้ดูแล</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', lineHeight: '1.3' }}>{activeBroadcast.message}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Widgets Container */}
        {targetId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <MedicineWidget userId={targetId} targetType={targetType} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
               <TodoWidget userId={targetId} targetType={targetType} />
               <WaterWidget userId={targetId} targetType={targetType} />
               <GroceryWidget userId={targetId} targetType={targetType} />
            </div>
          </div>
        )}
      </div>
    </LayoutTransition>
  )
}