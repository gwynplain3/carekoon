'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Trophy, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WeeklyProgressWidget({ userId, targetType = 'real' }: { userId: string, targetType?: 'real' | 'virtual' }) {
  const [history, setHistory] = useState<{ date: string, isDone: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!userId) return
      setLoading(true)
      
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }

      // Progress check: Glasses of water as primary metric for now
      const { data: water } = await supabase.from('water_logs')
        .select('log_date, glasses')
        .in('log_date', days)
        .eq(targetType === 'virtual' ? 'virtual_elder_id' : 'user_id', userId)

      const historyData = days.map(date => {
        const w = water?.find(log => log.log_date === date)
        // Encouragement threshold: 4+ glasses counts as a "Good Day"
        const isDone = (w?.glasses || 0) >= 4 
        return { date, isDone }
      })

      setHistory(historyData)
      setLoading(false)
    }
    fetchStats()
  }, [userId, targetType])

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    )
  }

  const reverseHistory = [...history].reverse()
  let streakCount = 0
  const todayStr = new Date().toISOString().split('T')[0]
  for (const day of reverseHistory) {
    if (day.date === todayStr && !day.isDone) continue // skip today if not done yet
    if (day.isDone) streakCount++
    else break
  }

  return (
    <div className="card" style={{ padding: '24px', background: 'linear-gradient(to bottom, #ffffff, var(--primary-light))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '10px' }}>
             <Trophy size={20} />
           </div>
           <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-dark)' }}>เป้าหมายสัปดาห์นี้</h3>
         </div>
         {streakCount > 0 && (
           <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '1rem', fontWeight: '900' }}>
             เก่งมาก! {streakCount} วันแล้ว
           </div>
         )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        {history.map((day, i) => {
          const dateObj = new Date(day.date)
          const labels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
          const isToday = day.date === new Date().toISOString().split('T')[0]
          
          return (
            <div key={day.date} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: isToday ? '900' : 'bold', 
                color: isToday ? 'var(--primary)' : 'var(--text-muted)', 
                marginBottom: '10px' 
              }}>
                {labels[dateObj.getDay()]}
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: i * 0.05 }}
              >
                {day.isDone ? (
                  <div style={{ color: 'var(--primary)', filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.4))' }}>
                    <CheckCircle2 size={40} strokeWidth={3} />
                  </div>
                ) : (
                  <div style={{ color: 'var(--border)' }}>
                    <Circle size={40} strokeWidth={2.5} />
                  </div>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
