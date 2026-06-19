'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Activity, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Log { id: number; log_date: string; bp_sys: number; bp_dia: number; blood_sugar: number; pulse: number }

export default function HealthPage({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [showApptForm, setShowApptForm] = useState(false)
  const [form, setForm] = useState({ bp_sys: '', bp_dia: '', blood_sugar: '', pulse: '' })
  const [apptForm, setApptForm] = useState({ doctor_name: '', location: '', appt_date: '', appt_time: '', note: '' })

  useEffect(() => {
    async function load() {
      const [{ data: l }, { data: a }] = await Promise.all([
        supabase.from('health_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(7),
        supabase.from('appointments').select('*').eq('user_id', userId).gte('appt_date', new Date().toISOString().split('T')[0]).order('appt_date').limit(5)
      ])
      setLogs(l ?? [])
      setAppointments(a ?? [])
    }
    load()
  }, [userId])

  async function saveLog(e: React.FormEvent) {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('health_logs').insert({
      user_id: userId,
      log_date: today,
      bp_sys: Number(form.bp_sys) || null,
      bp_dia: Number(form.bp_dia) || null,
      blood_sugar: Number(form.blood_sugar) || null,
      pulse: Number(form.pulse) || null,
    }).select('*').single()
    if (data) setLogs(p => [data, ...p])
    setForm({ bp_sys: '', bp_dia: '', blood_sugar: '', pulse: '' })
    setShowLogForm(false)
  }

  async function saveAppt(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await supabase.from('appointments').insert({ user_id: userId, ...apptForm }).select('*').single()
    if (data) setAppointments(p => [...p, data].sort((a, b) => a.appt_date.localeCompare(b.appt_date)))
    setApptForm({ doctor_name: '', location: '', appt_date: '', appt_time: '', note: '' })
    setShowApptForm(false)
  }

  async function deleteAppt(id: number) {
    await supabase.from('appointments').delete().eq('id', id)
    setAppointments(p => p.filter(a => a.id !== id))
  }

  const latest = logs[0]

  return (
    <main style={{ padding: '20px', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#ef4444', padding: '12px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
          <Activity size={32} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: '#1e293b' }}>สุขภาพของฉัน</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>ติดตามสุขภาพทุกวัน</p>
        </div>
      </header>

      {/* APPOINTMENTS */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>📅 นัดหมอ</h2>
          <button onClick={() => setShowApptForm(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--primary)', color: 'white', border: 'none',
            padding: '12px 20px', borderRadius: '16px', fontSize: '1.2rem',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            <Plus size={22} /> เพิ่มนัด
          </button>
        </div>

        {showApptForm && (
          <form onSubmit={saveAppt} style={{
            background: '#f0fdf4', border: '3px solid var(--primary)', borderRadius: '24px',
            padding: '28px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            {[
              { key: 'doctor_name', label: 'ชื่อหมอ / โรงพยาบาล', placeholder: 'เช่น นพ. สมชาย', required: true },
              { key: 'location', label: 'สถานที่', placeholder: 'เช่น รพ. ราชวิถี', required: false },
              { key: 'note', label: 'หมายเหตุ', placeholder: 'เช่น พบหมอเรื่องความดัน', required: false },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '1.2rem', marginBottom: '8px' }}>{label}</label>
                <input
                  required={required}
                  value={(apptForm as any)[key]}
                  onChange={e => setApptForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', height: '56px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '1.2rem', padding: '0 16px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '1.2rem', marginBottom: '8px' }}>วันที่</label>
                <input required type="date" value={apptForm.appt_date} onChange={e => setApptForm(p => ({ ...p, appt_date: e.target.value }))}
                  style={{ width: '100%', height: '56px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '1.2rem', padding: '0 16px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '1.2rem', marginBottom: '8px' }}>เวลา</label>
                <input type="time" value={apptForm.appt_time} onChange={e => setApptForm(p => ({ ...p, appt_time: e.target.value }))}
                  style={{ width: '100%', height: '56px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '1.2rem', padding: '0 16px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" style={{
              height: '64px', borderRadius: '18px', border: 'none', background: 'var(--primary)',
              color: 'white', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer'
            }}>บันทึกนัด</button>
          </form>
        )}

        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.3rem', margin: 0 }}>ยังไม่มีนัดหมอที่ใกล้จะมาถึง</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map(a => {
              const daysLeft = Math.ceil((new Date(a.appt_date).getTime() - Date.now()) / 86400000)
              const urgent = daysLeft <= 3
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px 24px', borderRadius: '20px', background: 'white',
                  border: urgent ? '3px solid #ef4444' : '2px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    background: urgent ? '#fee2e2' : 'var(--primary-light)', borderRadius: '14px',
                    padding: '12px 16px', textAlign: 'center', minWidth: '60px'
                  }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: urgent ? '#dc2626' : 'var(--primary-dark)' }}>
                      {daysLeft <= 0 ? 'วันนี้' : `${daysLeft}วัน`}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>{a.doctor_name}</div>
                    {a.location && <div style={{ fontSize: '1.1rem', color: '#64748b' }}>{a.location}</div>}
                    <div style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
                      {new Date(a.appt_date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {a.appt_time && ` · ${a.appt_time.slice(0, 5)}`}
                    </div>
                  </div>
                  <button onClick={() => deleteAppt(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e1' }}>
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* HEALTH LOG */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>🩺 บันทึกสุขภาพ</h2>
          <button onClick={() => setShowLogForm(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ef4444', color: 'white', border: 'none',
            padding: '12px 20px', borderRadius: '16px', fontSize: '1.2rem',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            <Plus size={22} /> บันทึกวันนี้
          </button>
        </div>

        {showLogForm && (
          <form onSubmit={saveLog} style={{
            background: '#fff5f5', border: '3px solid #ef4444', borderRadius: '24px',
            padding: '28px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { key: 'bp_sys', label: '💉 ความดันตัวบน', placeholder: '120' },
                { key: 'bp_dia', label: '💉 ความดันตัวล่าง', placeholder: '80' },
                { key: 'blood_sugar', label: '🩸 น้ำตาลในเลือด', placeholder: '95' },
                { key: 'pulse', label: '❤️ ชีพจร', placeholder: '72' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '1.1rem', marginBottom: '8px' }}>{label}</label>
                  <input
                    type="number"
                    value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', height: '56px', borderRadius: '14px', border: '2px solid #fecaca', fontSize: '1.3rem', padding: '0 16px', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" style={{
              height: '64px', borderRadius: '18px', border: 'none', background: '#ef4444',
              color: 'white', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer'
            }}>บันทึก</button>
          </form>
        )}

        {/* Latest reading summary */}
        {latest && (
          <div style={{
            background: 'white', borderRadius: '24px', padding: '24px',
            border: '2px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '1.1rem', color: '#64748b', fontWeight: 'bold' }}>ล่าสุด: {new Date(latest.log_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { label: 'ความดัน', value: latest.bp_sys && latest.bp_dia ? `${latest.bp_sys}/${latest.bp_dia}` : '-', unit: 'mmHg', color: '#ef4444' },
                { label: 'น้ำตาล', value: latest.blood_sugar ?? '-', unit: 'mg/dL', color: '#f59e0b' },
                { label: 'ชีพจร', value: latest.pulse ?? '-', unit: 'bpm', color: '#ec4899' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color }}>{value}</div>
                  <div style={{ fontSize: '1rem', color: '#94a3b8' }}>{unit}</div>
                  <div style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 'bold' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.3rem', margin: 0 }}>ยังไม่มีข้อมูลสุขภาพ กดบันทึกได้เลยครับ</p>
          </div>
        )}
      </section>
    </main>
  )
}
