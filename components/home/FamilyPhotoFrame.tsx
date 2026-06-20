'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Heart, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FamilyPhotoFrame({ userId, targetType = 'real' }: { userId: string, targetType?: 'real' | 'virtual' }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPhotos() {
      if (!userId) return
      setLoading(true)
      let query = supabase.from('family_photos').select('*')
      if (targetType === 'virtual') {
        query = query.eq('virtual_elder_id', userId)
      } else {
        query = query.eq('user_id', userId)
      }
      const { data } = await query.order('created_at', { ascending: false })
      setPhotos(data || [])
      setLoading(false)
    }
    fetchPhotos()
  }, [userId, targetType])

  // Auto-slide effect
  useEffect(() => {
    if (photos.length <= 1) return
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % photos.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [photos])

  if (loading) return (
    <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" color="var(--primary)" />
    </div>
  )

  if (photos.length === 0) return (
    <div className="card" style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--primary-light)', border: '2px dashed var(--primary)' }}>
      <Heart size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '12px' }} />
      <p style={{ color: 'var(--primary-dark)', fontWeight: 'bold' }}>ครอบครัวยังไม่ได้แชร์รูปภาพครับ</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>เมื่อผู้ดูแลลงรูป รูปจะมาปรากฏที่นี่</p>
    </div>
  )

  const current = photos[index]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', height: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
      <AnimatePresence mode="wait">
        <motion.div
           key={current.id}
           initial={{ opacity: 0, scale: 1.1 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1.5, ease: 'easeOut' }}
           style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          <img 
            src={current.photo_url} 
            alt={current.caption || 'ความทรงจำของครอบครัว'} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            padding: '40px 24px 24px', color: 'white'
          }}>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}
            >
              <Heart size={24} fill="#f43f5e" color="#f43f5e" /> {current.caption || 'ความทรงจำที่ดี'}
            </motion.h3>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Overlays */}
      {photos.length > 1 && (
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 10px', pointerEvents: 'none' }}>
          <button 
            onClick={() => setIndex(prev => (prev - 1 + photos.length) % photos.length)} 
            style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={30} color="white" />
          </button>
          <button 
            onClick={() => setIndex(prev => (prev + 1) % photos.length)} 
            style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={30} color="white" />
          </button>
        </div>
      )}

      {/* Counter */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: '12px', color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>
        {index + 1} / {photos.length}
      </div>
    </div>
  )
}
