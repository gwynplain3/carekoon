'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Droplets, Plus, Minus, Loader2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { motion } from 'framer-motion'

const GOAL = 8

export default function WaterWidget({ userId, targetType = 'real', readOnly = false }: { userId: string, targetType?: 'real' | 'virtual', readOnly?: boolean }) {
  const { profile, isVirtual } = useUser()
  const effectiveReadOnly = readOnly
  
  const [glasses, setGlasses] = useState(0)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase.from('water_logs').select('glasses')
      if (targetType === 'virtual') {
        query = query.eq('virtual_elder_id', userId)
      } else {
        query = query.eq('user_id', userId)
      }
      const { data } = await query.eq('log_date', today).single()
      setGlasses(data?.glasses || 0)
      setLoading(false)
    }

    if (userId) {
      fetch()
      const channel = supabase.channel(`water-updates-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'water_logs' }, fetch)
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [userId, targetType, today])

  async function update(next: number) {
    if (effectiveReadOnly) return // Caretakers cannot edit real water
    
    const clamped = Math.max(0, Math.min(next, GOAL))
    setGlasses(clamped)
    
    const payload: any = { log_date: today, glasses: clamped }
    let conflict = 'user_id,log_date'

    if (targetType === 'virtual') {
      payload.virtual_elder_id = userId
      conflict = 'virtual_elder_id,log_date'
    } else {
      payload.user_id = userId
    }

    await supabase
      .from('water_logs')
      .upsert(payload, { onConflict: conflict })
  }

  const pct = Math.round((glasses / GOAL) * 100)
  const done = glasses >= GOAL

  return (
    <div className="card" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', background: 'white', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}>
       {/* Background Decoration */}
       <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '50%', zIndex: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ backgroundColor: '#0EA5E9', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)' }}>
          <Droplets size={28} color="white" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>การดื่มน้ำประจำวัน</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ padding: '40px' }}><Loader2 className="animate-spin" size={40} color="#0ea5e9" /></div>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '4.5rem', fontWeight: '900', color: '#0ea5e9', lineHeight: 1, textShadow: '0 10px 20px rgba(14, 165, 233, 0.1)' }}>
                {glasses}
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '4px' }}>จากเป้าหมาย {GOAL} แก้ว</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
               <button 
                onClick={() => update(glasses - 1)} 
                disabled={glasses === 0} 
                style={{ flex: 1, height: '64px', borderRadius: '20px', border: '2px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: glasses === 0 ? 0.3 : 1, transition: 'all 0.2s' }}
               >
                 <Minus size={28} color="#64748b" strokeWidth={3} />
               </button>

               <button 
                onClick={() => update(glasses + 1)} 
                disabled={done} 
                style={{ flex: 2, height: '64px', borderRadius: '20px', border: 'none', background: '#0ea5e9', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: '900', fontSize: '1.3rem', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)', opacity: done ? 0.5 : 1, transition: 'all 0.2s' }}
               >
                 <Plus size={28} strokeWidth={3} /> ดื่มน้ำ
               </button>
            </div>

            <div style={{ background: '#e2e8f0', borderRadius: '12px', height: '16px', overflow: 'hidden', position: 'relative' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)', boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: GOAL }).map((_, i) => (
                <div key={i} style={{ fontSize: '1.8rem', transform: `scale(${i < glasses ? 1.2 : 0.9})`, opacity: i < glasses ? 1 : 0.15, filter: i < glasses ? 'none' : 'grayscale(1)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  🥤
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
