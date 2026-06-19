'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pill, Plus, Trash2, Loader2, Clock, CheckCircle2, Utensils, Minus, Sparkles, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/lib/hooks/useUser'
import Input from '@/components/ui/Input'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface DoseTiming {
  label: string
  time: string
}

interface Medicine {
  id: number
  name: string
  dosage: string
  timing: DoseTiming[] | string
  reminder_time: string | null
  total_doses: number
  remaining_doses: number
  is_recurring: boolean
  last_updated_at: string
}

export default function MedicineWidget({ userId, targetType = 'real', readOnly = false }: { userId: string, targetType?: 'real' | 'virtual', readOnly?: boolean }) {
  const { profile, isVirtual } = useUser()
  
  // Elders under care (role 'elder' or unauthenticated virtual elders) should not manage medicines
  const isUnderCare = profile?.role === 'elder' || (isVirtual && profile?.role !== 'caretaker')
  const effectiveReadOnly = readOnly || isUnderCare

  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isRecurring, setIsRecurring] = useState(true) // Medicines recur by default
  const [animatingId, setAnimatingId] = useState<number | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [totalDoses, setTotalDoses] = useState(1)
  const [doseTimings, setDoseTimings] = useState<DoseTiming[]>([{ label: 'หลังอาหารเช้า', time: '08:00' }])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (userId) {
      fetchMedicines()
    }
  }, [userId])

  useEffect(() => {
    setDoseTimings(prev => {
      const newTimings = [...prev]
      const defaults = [
        { label: 'หลังอาหารเช้า', time: '08:00' },
        { label: 'กลางวัน', time: '12:00' },
        { label: 'หลังอาหารเย็น', time: '18:00' },
        { label: 'ก่อนนอน', time: '21:00' }
      ]
      
      if (totalDoses > newTimings.length) {
        for (let i = newTimings.length; i < totalDoses; i++) {
          newTimings.push(defaults[i] || { label: 'หลังอาหารเช้า', time: '08:00' })
        }
      } else if (totalDoses < newTimings.length) {
        return newTimings.slice(0, totalDoses)
      }
      return newTimings
    })
  }, [totalDoses])

  async function fetchMedicines() {
    setLoading(true)
    try {
      let query = supabase.from('medicines').select('*')
      if (targetType === 'virtual') {
        query = query.eq('virtual_elder_id', userId)
      } else {
        query = query.eq('user_id', userId)
      }
      const { data, error } = await query.order('id', { ascending: true })

      if (error) throw error

      if (data) {
        const today = new Date().toLocaleDateString('en-CA');
        const updatedMedicines = await Promise.all(data.map(async (med) => {
          const lastUpdateDate = med.last_updated_at ? new Date(med.last_updated_at).toLocaleDateString('en-CA') : null;
          
          // Only reset if it's RECURRING and it's a new day
          if (med.is_recurring && lastUpdateDate !== today) {
            const { data: resetMed, error: resetError } = await supabase
              .from('medicines')
              .update({ 
                remaining_doses: med.total_doses || 1,
                last_updated_at: new Date().toISOString()
              })
              .eq('id', med.id)
              .select()
              .single()
            
            return resetError ? med : resetMed
          }
          return med
        }))
        
        setMedicines(updatedMedicines)
      }
    } catch (err) {
      console.error('Error fetching medicines:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || saving) return

    setSaving(true)
    const payload: any = {
      name: name.trim(),
      dosage: '1 เม็ด',
      timing: doseTimings,
      total_doses: totalDoses,
      remaining_doses: totalDoses,
      is_recurring: isRecurring,
      last_updated_at: new Date().toISOString()
    }

    if (targetType === 'virtual') {
      payload.virtual_elder_id = userId
    } else {
      payload.user_id = userId
    }

    const { data, error } = await supabase
      .from('medicines')
      .insert(payload)
      .select()
      .single()

    if (!error && data) {
      setMedicines(prev => [...prev, data])
      setName('')
      setTotalDoses(1)
      setDoseTimings([{ label: 'หลังอาหารเช้า', time: '08:00' }])
      setShowAddModal(false)
    }
    setSaving(false)
  }

  async function handleEat(med: Medicine) {
    if (med.remaining_doses <= 0) return

    // Start animation
    setAnimatingId(med.id)
    setTimeout(() => setAnimatingId(null), 1000)

    const newRemaining = med.remaining_doses - 1
    
    setMedicines(prev => prev.map(m => 
      m.id === med.id ? { ...m, remaining_doses: newRemaining } : m
    ))

    const { error } = await supabase
      .from('medicines')
      .update({ 
        remaining_doses: newRemaining,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', med.id)

    if (error) {
      fetchMedicines()
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', deleteId)

    if (!error) {
      setMedicines(prev => prev.filter(m => m.id !== deleteId))
    }
    setDeleteId(null)
  }

  const timingOptions = [
    "ก่อนอาหารเช้า",
    "หลังอาหารเช้า",
    "กลางวัน",
    "หลังอาหารเย็น",
    "ก่อนนอน"
  ]

  function TimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [h, m] = value.split(':').map(Number)
    
    const adjustTime = (type: 'h' | 'm', amount: number) => {
      let newH = h, newM = m
      if (type === 'h') {
        newH = (h + amount + 24) % 24
      } else {
        newM = (m + amount + 60) % 60
      }
      onChange(`${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`)
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button type="button" onClick={() => adjustTime('h', 1)} style={{ padding: '3px', background: '#f1f5f9', borderRadius: '6px', border: 'none' }}><Plus size={14} /></button>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', width: '32px', textAlign: 'center' }}>{h.toString().padStart(2, '0')}</div>
          <button type="button" onClick={() => adjustTime('h', -1)} style={{ padding: '3px', background: '#f1f5f9', borderRadius: '6px', border: 'none' }}><Minus size={14} /></button>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button type="button" onClick={() => adjustTime('m', 5)} style={{ padding: '3px', background: '#f1f5f9', borderRadius: '6px', border: 'none' }}><Plus size={14} /></button>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', width: '32px', textAlign: 'center' }}>{m.toString().padStart(2, '0')}</div>
          <button type="button" onClick={() => adjustTime('m', -5)} style={{ padding: '3px', background: '#f1f5f9', borderRadius: '6px', border: 'none' }}><Minus size={14} /></button>
        </div>
      </div>
    )
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              backgroundColor: 'var(--primary)', 
              padding: '10px', 
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Pill size={26} color="white" />
          </motion.div>
          <h2 style={{ margin: 0, fontSize: effectiveReadOnly ? '1.2rem' : '1.65rem', fontWeight: '800' }}>การทานยา</h2>
        </div>
        {!showAddModal && !effectiveReadOnly && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-large"
            onClick={() => setShowAddModal(true)}
            style={{ 
              background: 'var(--primary)', 
              color: 'white',
              padding: '10px 22px', 
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={22} /> เพิ่มยา
          </motion.button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '28px' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        </div>
      ) : medicines.length === 0 && !showAddModal ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <Pill size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '1.15rem', color: '#64748b', fontWeight: '600', marginBottom: '10px' }}>ยังไม่มีรายการยา</p>
          {!effectiveReadOnly && (
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '1.05rem', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
            >
              กดที่นี่เพื่อเพิ่มยา
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          layout
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {medicines.map((med) => {
            const total = med.total_doses || 1
            const remaining = med.remaining_doses
            const eaten = total - remaining
            const isDone = remaining === 0
            
            const timings = Array.isArray(med.timing) ? med.timing : []
            const nextDose = timings[eaten] || timings[timings.length - 1]
            const nextLabel = typeof nextDose === 'string' ? nextDose : nextDose?.label
            const nextTime = typeof nextDose === 'string' ? '' : nextDose?.time

            return (
              <motion.div 
                layout
                key={med.id} 
                className="card"
                style={{ 
                  padding: '18px 22px', 
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header: Name and Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-dark)', margin: 0, fontWeight: '800' }}>{med.name}</h3>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: med.is_recurring ? 'var(--primary-light)' : '#f1f5f9', color: med.is_recurring ? 'var(--primary-dark)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                        {med.is_recurring ? 'ทานทุกวัน' : 'ทานเฉพาะวันนี้'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      ทานไปแล้ว {eaten} / {total} ครั้ง
                    </div>
                  </div>
                  {isDone && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <CheckCircle2 color="#10b981" size={34} />
                    </motion.div>
                  )}
                  {!effectiveReadOnly && (
                    <button 
                      onClick={() => setDeleteId(med.id)}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Body Section: Highlights and Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <AnimatePresence mode="wait">
                    {!isDone ? (
                      <motion.div 
                        key="active"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{ 
                          background: '#ecfdf5', padding: '12px 16px', borderRadius: '14px', textAlign: 'center',
                          border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ color: '#047857', fontSize: '0.9rem', fontWeight: 'bold' }}>รอบต่อไป</div>
                          <div style={{ color: '#047857', fontSize: '1.2rem', fontWeight: '900' }}>{nextLabel}</div>
                        </div>
                        <div style={{ width: '2px', height: '32px', background: '#0d9488', opacity: 0.3 }}></div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#047857', fontFamily: 'monospace' }}>{nextTime}</div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ 
                          background: '#dcfce7', padding: '14px', borderRadius: '14px', textAlign: 'center',
                          border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                      >
                        <Sparkles size={22} color="#15803d" />
                        <span style={{ fontSize: '1.1rem', color: '#15803d', fontWeight: '900' }}>วันนี้ทานครบแล้ว!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isDone && (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', 
                      padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        {Array.from({ length: total }).map((_, i) => (
                          <div key={i} style={{ 
                            height: '10px', flex: 1, borderRadius: '6px', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: i < eaten ? '#10b981' : (i === eaten ? 'var(--primary)' : '#e2e8f0'),
                            boxShadow: i === eaten ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'none'
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Section: Button */}
                <AnimatePresence>
                  {!isDone && !effectiveReadOnly && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '10px' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      style={{ position: 'relative' }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEat(med)}
                        style={{ 
                          width: '100%', height: '52px', background: 'var(--primary)', color: 'white', borderRadius: '14px', 
                          border: 'none', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                      >
                        <Check size={26} strokeWidth={3.5} /> ทานแล้ว
                      </motion.button>
                      
                      {animatingId === med.id && (
                        <motion.div
                          initial={{ y: 0, opacity: 1, scale: 1 }}
                          animate={{ y: -70, opacity: 0, scale: 1.3 }}
                          style={{ 
                            position: 'absolute', top: '20%', left: '45%', color: 'var(--primary-dark)',
                            fontSize: '2.4rem', fontWeight: '900', pointerEvents: 'none', zIndex: 10
                          }}
                        >
                          -1
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 300,
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ 
                maxWidth: '680px', 
                width: '100%', 
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.7rem', color: 'var(--primary-dark)', margin: 0, fontWeight: '900' }}>เพิ่มยาใหม่</h3>
                <button 
                  onClick={() => { 
                    setShowAddModal(false); 
                    setName(''); 
                    setTotalDoses(1); 
                    setDoseTimings([{ label: 'หลังอาหารเช้า', time: '08:00' }])
                  }}
                  style={{ background: 'var(--primary-light)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '12px' }}
                >
                  <X size={22} color="var(--primary-dark)" />
                </button>
              </div>
              
              <form onSubmit={handleAdd}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.05rem', fontWeight: 'bold' }}>ชื่อยา</label>
                    <input
                      type="text"
                      placeholder="เช่น ยาแก้แพ้, วิตามิน C"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        width: '100%', height: '52px', borderRadius: '14px', border: '2px solid var(--border)',
                        fontSize: '1.05rem', padding: '0 18px', background: 'white', fontWeight: '500',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '1.05rem', fontWeight: 'bold' }}>ทานวันละกี่ครั้ง?</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', maxWidth: '320px' }}>
                      <button 
                        type="button"
                        onClick={() => setTotalDoses(Math.max(1, totalDoses - 1))}
                        style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid var(--border)', background: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <motion.div 
                        key={totalDoses}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        style={{ 
                          flex: 1, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--primary)', color: 'white', borderRadius: '14px', fontSize: '2rem', fontWeight: '900'
                        }}
                      >
                        {totalDoses}
                      </motion.div>
                      <button 
                        type="button"
                        onClick={() => setTotalDoses(totalDoses + 1)}
                        style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid var(--border)', background: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} style={{ width: '24px', height: '24px' }} />
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-dark)' }}>จัดเป็นรายการที่ต้องทานทุกวัน (Everyday task)</span>
                    </label>
                    <p style={{ margin: '4px 0 0 34px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>หากเลือก รายการนี้จะรีเซ็ตจำนวนยาให้ทานใหม่ทุกวันครับ</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '14px', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>ตั้งเวลาแต่ละรอบ</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      {doseTimings.map((t, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ 
                            background: '#f8fafc', 
                            padding: '16px', 
                            borderRadius: '14px', 
                            border: '2px solid var(--border)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                            <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>
                              {idx + 1}
                            </div>
                            <span style={{ fontSize: '1.05rem', fontWeight: '800' }}>รอบที่ {idx + 1}</span>
                          </div>
                          
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', display: 'block' }}>ช่วงเวลา</label>
                            <select 
                              value={t.label}
                              onChange={(e) => {
                                const newTimings = [...doseTimings];
                                newTimings[idx].label = e.target.value;
                                setDoseTimings(newTimings);
                              }}
                              style={{
                                width: '100%', height: '44px', borderRadius: '10px', border: '2px solid #e2e8f0',
                                fontSize: '0.95rem', padding: '0 14px', background: 'white', fontWeight: '600',
                                outline: 'none'
                              }}
                            >
                              {timingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          
                          <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', display: 'block' }}>เวลา</label>
                            <div style={{ 
                              background: 'white', 
                              borderRadius: '12px', 
                              padding: '10px',
                              display: 'flex',
                              justifyContent: 'center',
                              border: '2px dashed #cbd5e1'
                            }}>
                              <TimePicker 
                                value={t.time}
                                onChange={(val) => {
                                  const newTimings = [...doseTimings];
                                  newTimings[idx].time = val;
                                  setDoseTimings(newTimings);
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      className="btn-large"
                      disabled={saving || !name.trim()}
                      style={{ flex: 2, background: 'var(--primary)', color: 'white', fontWeight: 'bold', height: '56px', fontSize: '1.1rem', borderRadius: '16px', cursor: 'pointer' }}
                    >
                      {saving ? (
                        <><Loader2 size={22} className="animate-spin" />&nbsp;กำลังบันทึก...</>
                      ) : (
                        'เพิ่มยา'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-large"
                      onClick={() => { 
                        setShowAddModal(false); 
                        setName(''); 
                        setTotalDoses(1); 
                        setDoseTimings([{ label: 'หลังอาหารเช้า', time: '08:00' }])
                      }}
                      style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary-dark)', height: '56px', fontSize: '1.1rem', borderRadius: '16px', cursor: 'pointer', border: 'none' }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteId !== null}
        isDanger={true}
        title="ลบรายการยานี้?"
        message="คุณต้องการลบข้อมูลการทานยานี้ใช่หรือไม่?"
        confirmText="ใช่ ลบเลย"
        cancelText="ไม่ลบ"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  )
}
