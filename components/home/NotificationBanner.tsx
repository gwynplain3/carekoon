'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Pill, Calendar, Sun, X, Check, ChevronRight } from 'lucide-react'

interface Notification {
  id: string
  type: 'medicine' | 'appointment' | 'morning'
  title: string
  message: string
  time?: string
  priority: 'high' | 'medium' | 'low'
  action?: () => void
}

export default function NotificationBanner({ userId, targetType = 'real' }: { userId: string, targetType?: 'real' | 'virtual' }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Audio for notifications
  const playPing = () => {
    try {
      const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_783332483a.mp3')
      audio.volume = 0.8
      audio.play().catch(e => console.log('Audio Blocked:', e))
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (userId) {
      checkNotifications()
      
      // Realtime subscription
      const channel = supabase
        .channel('elder-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medicines' }, (p) => checkNotifications(true))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'medicines' }, () => checkNotifications(false))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (p) => checkNotifications(true))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => checkNotifications(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'water_logs' }, () => checkNotifications(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calorie_logs' }, () => checkNotifications(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => checkNotifications(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_list' }, () => checkNotifications(false))
        .subscribe()

      const interval = setInterval(checkNotifications, 30000)
      return () => {
        clearInterval(interval)
        supabase.removeChannel(channel)
      }
    }
  }, [userId, targetType, dismissed])

  async function checkNotifications(shouldPlaySound = false) {
    const list: Notification[] = []
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const todayStr = now.toLocaleDateString('en-CA')

    // 1. Morning Greeting (5:00 - 10:00)
    if (now.getHours() >= 5 && now.getHours() < 10 && !dismissed.includes('morning-greeting')) {
      list.push({
        id: 'morning-greeting',
        type: 'morning',
        title: 'อรุณสวัสดิ์ครับ!',
        message: 'ตื่นเช้ามาดื่มน้ำอุ่นสักแก้ว เพื่อสุขภาพที่ดีนะครับ 🌿',
        priority: 'medium'
      })
    }

    // 2. Medicine Reminders
    try {
      let query = supabase.from('medicines').select('*')
      if (targetType === 'virtual') query = query.eq('virtual_elder_id', userId)
      else query = query.eq('user_id', userId)
      
      const { data: meds } = await query
      if (meds) {
        meds.forEach(med => {
          const total = med.total_doses || 1
          const remaining = med.remaining_doses
          const eaten = total - remaining
          const timings = Array.isArray(med.timing) ? med.timing : []
          
          if (remaining > 0) {
            const nextDose = timings[eaten]
            if (nextDose && nextDose.time) {
              const [h, m] = nextDose.time.split(':').map(Number)
              const doseTime = h * 60 + m
              
              // Notify if within 30 mins before or 60 mins after
              if (currentTime >= doseTime - 30 && currentTime <= doseTime + 120) {
                const id = `med-${med.id}-${nextDose.time}`
                if (!dismissed.includes(id)) {
                  list.push({
                    id,
                    type: 'medicine',
                    title: 'ได้เวลาทานยาแล้วครับ',
                    message: `อย่าลืมทาน ${med.name} (${nextDose.label}) นะครับ`,
                    time: nextDose.time,
                    priority: 'high'
                  })
                }
              }
            }
          }
        })
      }
    } catch (err) { console.error(err) }

    // 3. Appointments
    try {
      let q = supabase.from('appointments').select('*').eq('appointment_date', todayStr).eq('is_completed', false)
      if (targetType === 'virtual') q = q.eq('virtual_elder_id', userId)
      else q = q.eq('user_id', userId)

      const { data: appts } = await q
      if (appts) {
        appts.forEach(appt => {
          const id = `appt-${appt.id}`
          if (!dismissed.includes(id)) {
            list.push({
              id,
              type: 'appointment',
              title: 'นัดหมายแพทย์วันนี้',
              message: `คุณมีนัดที่ ${appt.location}${appt.appointment_time ? ' เวลา ' + appt.appointment_time : ''} ครับ`,
              priority: 'high'
            })
          }
        })
      }
    } catch (err) { console.error(err) }

    const sortedList = list.sort((a, b) => (a.priority === 'high' ? -1 : 1))
    
    // Play sound if we found something new and sound is requested
    if (shouldPlaySound && list.length > notifications.length) {
      playPing()
    }

    setNotifications(sortedList)
  }

  function handleDismiss(id: string) {
    setDismissed(prev => [...prev, id])
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!soundEnabled ? (
        <button 
          onClick={() => { setSoundEnabled(true); playPing(); }}
          style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)', fontSize: '1.2rem' }}
        >
          🔊 คลิกปุ่มนี้เพื่อเปิดระบบเสียง (ระบบจะทดสอบเสียงทันที)
        </button>
      ) : (
        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>📡 ระบบแจ้งเตือนทำงานแบบ Real-time</div>
      )}
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              background: notif.priority === 'high' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'white',
              color: notif.priority === 'high' ? 'white' : 'var(--text)',
              padding: '24px 32px',
              borderRadius: '28px',
              boxShadow: notif.priority === 'high' ? '0 12px 24px rgba(239, 68, 68, 0.2)' : '0 8px 20px rgba(0,0,0,0.05)',
              border: notif.priority === 'high' ? 'none' : '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}>
              <div style={{ 
                background: notif.priority === 'high' ? 'rgba(255,255,255,0.2)' : 'var(--primary-light)',
                padding: '16px',
                borderRadius: '20px',
                color: notif.priority === 'high' ? 'white' : 'var(--primary)'
              }}>
                {notif.type === 'medicine' && <Pill size={32} strokeWidth={2.5} />}
                {notif.type === 'appointment' && <Calendar size={32} strokeWidth={2.5} />}
                {notif.type === 'morning' && <Sun size={32} strokeWidth={2.5} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', opacity: 0.9, marginBottom: '2px' }}>
                  {notif.type === 'medicine' ? 'แจ้งเตือนทานยา' : notif.type === 'appointment' ? 'คิวนัดหมาย' : 'ทักทายตอนเช้า'}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: '1.2' }}>{notif.title}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '500', opacity: 0.9, marginTop: '4px' }}>{notif.message}</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleDismiss(notif.id)}
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '20px', 
                    background: notif.priority === 'high' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    border: 'none', color: notif.priority === 'high' ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Check size={32} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
