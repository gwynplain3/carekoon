'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Droplets, Plus, Minus, Loader2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'

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
      const { data, error } = await query.eq('log_date', today).single()
      
      if (data) {
        setGlasses(data.glasses)
      } else {
        setGlasses(0)
        // If it doesn't exist and we are the elder, we could auto-create it on first drink.
        // But for display, 0 is fine.
      }
      setLoading(false)
    }
    if (userId) fetch()
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
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
          <Droplets size={24} color="white" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>การดื่มน้ำ</h2>
      </div>

      <div className="card" style={{ padding: effectiveReadOnly ? '20px' : '28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}><Loader2 className="animate-spin" size={32} color="#0ea5e9" /></div>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: effectiveReadOnly ? '12px' : '24px' }}>
              {!effectiveReadOnly && (
                <button onClick={() => update(glasses - 1)} disabled={glasses === 0} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={20} color="#64748b" /></button>
              )}

              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: effectiveReadOnly ? '3.5rem' : '5rem', fontWeight: '900', color: done ? '#0369a1' : '#1e293b', lineHeight: 1 }}>
                  {glasses}
                </div>
                <div style={{ fontSize: '1rem', color: '#64748b' }}>/ {GOAL} แก้ว</div>
              </div>

              {!effectiveReadOnly && (
                <button onClick={() => update(glasses + 1)} disabled={done} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: '#0ea5e9', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={24} /></button>
              )}
            </div>

            <div style={{ background: '#e2e8f0', borderRadius: '6px', height: '12px', overflow: 'hidden', marginBottom: effectiveReadOnly ? '10px' : '0' }}>
              <div style={{ height: '100%', background: done ? '#0369a1' : '#0ea5e9', width: `${pct}%`, transition: 'width 0.4s' }} />
            </div>

            {!effectiveReadOnly && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: GOAL }).map((_, i) => (
                  <span key={i} style={{ fontSize: '1.4rem', opacity: i < glasses ? 1 : 0.2 }}>🥤</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
