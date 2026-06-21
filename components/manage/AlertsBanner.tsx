'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle, MapPin, CheckCircle2, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AlertsBanner({ caretakerId }: { caretakerId: string }) {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loadingIds, setLoadingIds] = useState<string[]>([])
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Audio Synthesizer for SOS
  const playSirene = async () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()
      
      // Repeating dual-tone siren
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.5
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(i % 2 === 0 ? 660 : 880, time)
        gain.gain.setValueAtTime(0.4, time)
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4)
        
        osc.start(time)
        osc.stop(time + 0.45)
      }
      return true
    } catch (e) {
      console.error('Siren synthesis failed', e)
      return false
    }
  }

  const handleEnableSound = async () => {
    const worked = await playSirene()
    if (worked) {
      setSoundEnabled(true)
      alert('เปิดระบบเสียงฉุกเฉินแล้ว! หากคุณได้ยินเสียงไซเรนเมื่อครู่ แสดงว่าระบบพร้อมทำงานแล้วครับ')
    }
  }

  useEffect(() => {
    if (!caretakerId) return
    
    // Initial fetch
    fetchAlerts()

    // Real-time listener
    const channel = supabase.channel('alerts_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        console.log('New alert!', payload)
        playSirene()
        fetchAlerts()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alerts' }, fetchAlerts)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'alerts' }, fetchAlerts)
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [caretakerId])

  async function fetchAlerts() {
    // 1. Get virtual elders IDs for this caretaker
    const { data: vElders } = await supabase.from('virtual_elders').select('id').eq('caretaker_id', caretakerId)
    const vIds = vElders?.map(v => v.id) || []
    
    // 2. Get real linked elder IDs
    const { data: realLinks } = await supabase.from('caretaker_elder_links').select('elder_id').eq('caretaker_id', caretakerId)
    const rIds = realLinks?.map(r => r.elder_id) || []

    // 3. Fetch pending alerts
    const { data } = await supabase.from('alerts')
      .select('*, virtual_elder:virtual_elder_id(display_name), real_elder:user_id(display_name)')
      .eq('status', 'pending')
      .or(`virtual_elder_id.in.(${vIds.length ? vIds.join(',') : '\"\"'}),user_id.in.(${rIds.length ? rIds.join(',') : '\"\"'})`)
      .order('created_at', { ascending: false })
      
    setAlerts(data || [])
  }

  async function resolveAlert(id: string) {
    setLoadingIds(prev => [...prev, id])
    const { error } = await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }
    setLoadingIds(prev => prev.filter(i => i !== id))
  }

  return (
    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!soundEnabled && (
        <button 
          onClick={handleEnableSound}
          style={{ width: '100%', padding: '16px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)', fontSize: '1.2rem' }}
        >
          🚨 คลิกเปิดระบบเสียงฉุกเฉิน (ทดสอบไซเรนด่วน)
        </button>
      )}
      <AnimatePresence>
        {alerts.length > 0 && alerts.map(alert => (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.9 }}
            key={alert.id}
            style={{ 
              background: '#fff7ed', border: '2px solid #fdba74', padding: '24px', 
              borderRadius: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 12px 30px rgba(251, 146, 60, 0.2)', overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: '#f97316', color: 'white', padding: '14px', borderRadius: '50%' }}>
                <AlertTriangle size={32} strokeWidth={3} className="animate-pulse" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#9a3412', fontWeight: '900' }}>
                  {alert.virtual_elder?.display_name || alert.real_elder?.display_name || 'ผู้อยู่ในความดูแล'} ขอความช่วยเหลือครับ!
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '1.1rem', color: '#ea580c', fontWeight: 'bold' }}>
                  <span>{new Date(alert.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                  {alert.latitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`} 
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', textDecoration: 'underline' }}
                    >
                      <MapPin size={20} /> ดูตำแหน่งบนแผนที่
                    </a>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => resolveAlert(alert.id)}
              disabled={loadingIds.includes(alert.id)}
              style={{ 
                background: '#ea580c', color: 'white', border: 'none', 
                padding: '16px 32px', borderRadius: '18px', fontWeight: '900', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '1.1rem', boxShadow: '0 6px 15px rgba(234, 88, 12, 0.3)'
              }}
            >
              {loadingIds.includes(alert.id) ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} strokeWidth={3} />}
              ช่วยเหลือแล้ว
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
