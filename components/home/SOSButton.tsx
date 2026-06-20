'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LifeBuoy, Loader2, CheckCircle2, HeartPulse } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SOSButton({ userId, targetType = 'real' }: { userId: string, targetType?: 'real' | 'virtual' }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSOS() {
    if (loading) return
    setLoading(true)
    
    let lat = null
    let lon = null
    
    // Website Location Log: Uses browser geolocation API
    // Note: Needs user permission. If blocked, we log null but still send the alert.
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            timeout: 5000,
            enableHighAccuracy: true 
          })
        })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      } catch (err) {
        console.warn('Geolocation permission denied or timed out.')
      }
    }

    const payload: any = {
      message: 'ต้องการการช่วยเหลือ (ขอความช่วยเหลือด่วน)',
      latitude: lat,
      longitude: lon,
      status: 'pending'
    }

    if (targetType === 'virtual') {
      payload.virtual_elder_id = userId
    } else {
      payload.user_id = userId
    }

    const { error } = await supabase.from('alerts').insert(payload)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 6000)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '110px', right: '24px', zIndex: 1000 }}>
       <AnimatePresence>
         {success && (
           <motion.div 
             initial={{ opacity: 0, x: 20, scale: 0.8 }}
             animate={{ opacity: 1, x: 0, scale: 1 }}
             exit={{ opacity: 0, x: 20 }}
             style={{ 
               position: 'absolute', bottom: '90px', right: 0, width: '280px',
               background: '#059669', color: 'white', padding: '20px', borderRadius: '24px',
               boxShadow: '0 12px 40px rgba(5, 150, 105, 0.4)', textAlign: 'center'
             }}
           >
             <CheckCircle2 size={36} style={{ margin: '0 auto 10px' }} strokeWidth={3} />
             <div style={{ fontWeight: '900', fontSize: '1.2rem', marginBottom: '4px' }}>ส่งสัญญาณเรียบร้อย</div>
             <div style={{ fontSize: '1rem', opacity: 0.9 }}>ผู้ดูแลของคุณได้รับเรื่องแล้วครับ</div>
           </motion.div>
         )}
       </AnimatePresence>

       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSOS}
            disabled={loading}
            style={{ 
              width: '88px', height: '88px', borderRadius: '50%',
              background: loading ? 'var(--border)' : '#fb923c', /* Warm Orange (Softer than Red) */
              color: 'white', border: '5px solid white', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(251, 146, 60, 0.5)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={32} /> : (
              <LifeBuoy size={40} strokeWidth={2.5} />
            )}
          </motion.button>
          <div style={{ 
            background: 'white', padding: '4px 12px', borderRadius: '12px', 
            fontSize: '0.9rem', fontWeight: 'bold', color: '#ea580c',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            ขอความช่วยเหลือ
          </div>
       </div>
    </div>
  )
}
