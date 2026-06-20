'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Apple, Plus, Loader2, Info, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STROKE_WIDTH = 2.5
const DAILY_GOAL = 2000

export default function CalorieWidget({ userId, targetType = 'real', readOnly = false }: { userId: string, targetType?: 'real' | 'virtual', readOnly?: boolean }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [desc, setDesc] = useState('')
  const [kcal, setKcal] = useState('300')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (userId) fetchLogs()
  }, [userId, targetType, today])

  async function fetchLogs() {
    setLoading(true)
    let query = supabase.from('meal_logs').select('*').eq('log_date', today)
    if (targetType === 'virtual') {
      query = query.eq('virtual_elder_id', userId)
    } else {
      query = query.eq('user_id', userId)
    }
    const { data } = await query.order('created_at', { ascending: true })
    setLogs(data || [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim() || saving) return
    
    setSaving(true)
    const payload: any = {
      description: desc.trim(),
      calories: parseInt(kcal) || 0,
      log_date: today
    }

    if (targetType === 'virtual') {
      payload.virtual_elder_id = userId
    } else {
      payload.user_id = userId
    }

    const { error } = await supabase.from('meal_logs').insert(payload)
    if (!error) {
      setDesc('')
      setShowAdd(false)
      fetchLogs()
    }
    setSaving(false)
  }

  const calories = logs.reduce((acc, curr) => acc + (curr.calories || 0), 0)
  const pct = Math.min(100, Math.round((calories / DAILY_GOAL) * 100))

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '16px', color: 'white' }}>
            <Apple size={26} strokeWidth={STROKE_WIDTH} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>การทานอาหาร</h2>
        </div>
        {!readOnly && !showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            เพิ่มข้อมูล
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>{calories}</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 'bold', paddingBottom: '4px' }}>/ {DAILY_GOAL} kcal</span>
      </div>

      <div style={{ height: '16px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '28px' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }}
        />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            style={{ marginBottom: '24px', background: 'var(--primary-light)', padding: '20px', borderRadius: '20px', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-dark)', display: 'block', marginBottom: '4px' }}>ทานอะไรไป?</label>
                <input 
                  value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="เช่น ข้าวต้มปลา"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid white', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-dark)', display: 'block', marginBottom: '4px' }}>แคลอรี</label>
                <input 
                  type="number" value={kcal} onChange={e => setKcal(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid white', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'บันทึก'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '12px 18px', borderRadius: '14px', background: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                ยกเลิก
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
         {loading ? <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div> : logs.length === 0 ? (
           <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>ยังไม่ได้บันทึกการทานอาหารในวันนี้</p>
         ) : logs.map(log => (
           <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
               <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{log.description}</span>
             </div>
             <span style={{ color: 'var(--primary-dark)', fontWeight: '900', fontSize: '1.1rem' }}>+{log.calories} <small>kcal</small></span>
           </div>
         ))}
      </div>
    </div>
  )
}
