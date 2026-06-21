'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Plus, Trash2, Clock, MapPin, Stethoscope, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/lib/hooks/useUser'

interface Appointment {
  id: number
  doctor_name: string
  location?: string
  appt_date: string
  appt_time?: string
  note?: string
  is_completed?: boolean
}

interface AppointmentWidgetProps {
  userId: string
  targetType: 'real' | 'virtual'
  readOnly?: boolean
  isSelfCare?: boolean
}

export default function AppointmentWidget({ userId, targetType, readOnly = false, isSelfCare = false }: AppointmentWidgetProps) {
  const { profile } = useUser()
  const canEdit = profile?.role === 'caretaker' || isSelfCare
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    doctor_name: '',
    location: '',
    appt_date: new Date().toISOString().split('T')[0],
    appt_time: '',
    note: ''
  })

  useEffect(() => {
    fetchAppointments()
  }, [userId, targetType])

  async function fetchAppointments() {
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*')
      .gte('appt_date', new Date().toISOString().split('T')[0])
      .order('appt_date', { ascending: true })
      .limit(5)

    if (targetType === 'virtual') query = query.eq('virtual_elder_id', userId)
    else query = query.eq('user_id', userId)

    const { data, error } = await query
    if (!error) setAppointments(data || [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.doctor_name || !form.appt_date) return
    setSaving(true)

    const payload: any = { ...form }
    if (targetType === 'virtual') payload.virtual_elder_id = userId
    else payload.user_id = userId

    const { error } = await supabase.from('appointments').insert(payload)
    if (!error) {
      setShowForm(false)
      setForm({
        doctor_name: '',
        location: '',
        appt_date: new Date().toISOString().split('T')[0],
        appt_time: '',
        note: ''
      })
      fetchAppointments()
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('ยืนยันการลบนัดหมาย?')) return
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (!error) setAppointments(p => p.filter(a => a.id !== id))
  }

  return (
    <div className="card" style={{ padding: '32px', borderRadius: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}>
            <Calendar size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>นัดหมายคุณหมอ</h2>
        </div>
        {!readOnly && canEdit && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showForm ? 'ยกเลิก' : <><Plus size={20} /> เพิ่มนัด</>}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <form onSubmit={handleAdd} style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
              <input required placeholder="ชื่อคุณหมอ / โรงพยาบาล" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} style={{ width: '100%', height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem' }} />
              <input placeholder="สถานที่ (รพ. / คลินิก)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input required type="date" value={form.appt_date} onChange={e => setForm({ ...form, appt_date: e.target.value })} style={{ height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem' }} />
                <input type="time" value={form.appt_time} onChange={e => setForm({ ...form, appt_time: e.target.value })} style={{ height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem' }} />
              </div>
              <button disabled={saving} style={{ height: '56px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
                {saving ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'บันทึกนัดหมาย'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" color="var(--primary)" /></div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '24px', border: '2px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>ยังไม่มีนัดหมายใหม่ครับ</p>
          </div>
        ) : (
          appointments.map(appt => {
            const date = new Date(appt.appt_date)
            const diff = Math.ceil((date.getTime() - new Date().setHours(0,0,0,0)) / 86400000)
            const isSoon = diff <= 2
            
            return (
              <div key={appt.id} style={{ display: 'flex', gap: '20px', padding: '20px', background: appt.is_completed ? '#f8fafc' : (isSoon ? 'rgba(239, 68, 68, 0.05)' : 'white'), borderRadius: '24px', border: isSoon && !appt.is_completed ? '2px solid #ef444450' : '1px solid var(--border)', position: 'relative', opacity: appt.is_completed ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                   <input 
                    type="checkbox" 
                    checked={appt.is_completed || false} 
                    onChange={async () => {
                      const newState = !appt.is_completed
                      const { error } = await supabase.from('appointments').update({ is_completed: newState }).eq('id', appt.id)
                      if (!error) setAppointments(p => p.map(a => a.id === appt.id ? { ...a, is_completed: newState } : a))
                    }}
                    style={{ width: '32px', height: '32px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                   />
                </div>
                <div style={{ textAlign: 'center', background: appt.is_completed ? '#e2e8f0' : (isSoon ? '#fee2e2' : '#f1f5f9'), padding: '12px 16px', borderRadius: '16px', minWidth: '70px', height: 'fit-content' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: appt.is_completed ? '#94a3b8' : (isSoon ? '#dc2626' : 'var(--primary)') }}>{appt.is_completed ? 'เสร็จ' : (diff === 0 ? 'วันนี้' : `${diff} วัน`)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '4px', textDecoration: appt.is_completed ? 'line-through' : 'none' }}>{appt.doctor_name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                      <Clock size={16} /> {date.toLocaleDateString('th-TH', { month: 'long', day: 'numeric' })} {appt.appt_time ? ` · ${appt.appt_time.slice(0, 5)} น.` : ''}
                    </div>
                    {appt.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                        <MapPin size={16} /> {appt.location}
                      </div>
                    )}
                  </div>
                </div>
                {!readOnly && canEdit && (
                  <button onClick={() => handleDelete(appt.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
