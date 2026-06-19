'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Book, Calendar, Smile, Meh, Frown, Loader2, User, ChevronRight, PenLine, Sparkles, Heart, Quote } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { motion, AnimatePresence } from 'framer-motion'

const moodIcons: Record<string, any> = {
  'มีความสุข': { icon: <Smile size={32} />, color: '#0ea5e9', bg: '#f0f9ff', text: 'มีความสุขมาก' },
  'ปกติ': { icon: <Meh size={32} />, color: '#64748b', bg: '#f1f5f9', text: 'รู้สึกปกติ' },
  'เศร้า': { icon: <Frown size={32} />, color: '#f43f5e', bg: '#fff1f2', text: 'วันนี้เหนื่อยหน่อย' },
}

export default function DiaryPage() {
  const { user, profile, isVirtual, loading: authLoading } = useUser()
  const isCaretaker = profile?.role === 'caretaker'
  
  const [diaries, setDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [targetType, setTargetType] = useState<'real' | 'virtual'>('real')
  const [targetName, setTargetName] = useState('')
  const [managedElders, setManagedElders] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading) {
      if (isCaretaker) fetchManagedElders()
      else if (profile) {
        setTargetId(profile.id); setTargetType(isVirtual ? 'virtual' : 'real'); setTargetName(profile.display_name || 'ฉัน')
      }
    }
  }, [authLoading, profile])

  useEffect(() => { if (targetId) fetchData() }, [targetId, targetType])

  async function fetchManagedElders() {
    if (!user) return
    const { data: real } = await supabase.from('caretaker_elder_links').select('elder_id, profiles:elder_id(display_name)').eq('caretaker_id', user.id)
    const { data: virtual } = await supabase.from('virtual_elders').select('id, display_name').eq('caretaker_id', user.id)
    const combined = [
      ...(real || []).map(r => ({ id: r.elder_id, name: (r.profiles as any)?.display_name, type: 'real' })),
      ...(virtual || []).map(v => ({ id: v.id, name: v.display_name, type: 'virtual' }))
    ]
    setManagedElders(combined)
    if (combined.length > 0 && !targetId) {
      setTargetId(combined[0].id); setTargetType(combined[0].type as any); setTargetName(combined[0].name)
    }
  }

  async function fetchData() {
    setLoading(true)
    let query = supabase.from('diaries').select('*')
    if (targetType === 'virtual') query = query.eq('virtual_elder_id', targetId)
    else query = query.eq('user_id', targetId)
    const { data, error } = await query
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setDiaries(data || [])
    setLoading(false)
  }

  const [showAdd, setShowAdd] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('ปกติ')
  const [saving, setSaving] = useState(false)

  async function handleAddDiary(e: React.FormEvent) {
    e.preventDefault(); if (!content.trim() || saving || !targetId) return; setSaving(true)
    const payload: any = { content: content.trim(), mood, entry_date: new Date().toISOString().split('T')[0] }
    if (targetType === 'virtual') payload.virtual_elder_id = targetId
    else payload.user_id = targetId
    const { error } = await supabase.from('diaries').insert(payload)
    if (!error) { setContent(''); setShowAdd(false); fetchData() }
    setSaving(false)
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper" style={{ minHeight: '100vh', background: 'white' }}>
        <header style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
               <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '16px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.2)' }}><Book size={36} color="white" /></div>
               <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '900', color: 'var(--text)' }}>บันทึกประจำวัน</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.4rem' }}>
              {isCaretaker ? `กำลังดูสมุดบันทึกของ ${targetName}` : 'พื้นที่จดจำเรื่องราวดีๆ ในแต่ละวันครับ 🍃'}
            </p>
          </div>
          
          {isCaretaker && managedElders.length > 1 && (
            <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <select value={targetId || ''} onChange={(e) => { const sel = managedElders.find(m => m.id === e.target.value); if (sel) { setTargetId(sel.id); setTargetType(sel.type); setTargetName(sel.name) }}} style={{ padding: '4px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
                {managedElders.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </header>

        <div style={{ maxWidth: '1200px' }}>
          <AnimatePresence mode="wait">
            {showAdd ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="card" style={{ padding: '60px', borderRadius: '40px', border: '2px solid var(--primary-light)', background: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.08)' }}>
                <h2 style={{ marginBottom: '40px', textAlign: 'center', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}><PenLine size={32} color="var(--primary)" /> วันนี้ของคุณเป็นอย่างไรบ้าง?</h2>
                <form onSubmit={handleAddDiary}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                     {Object.keys(moodIcons).map(m => (
                       <button key={m} type="button" onClick={() => setMood(m)} style={{ padding: '32px 20px', borderRadius: '32px', border: mood === m ? `4px solid ${moodIcons[m].color}` : '2px solid transparent', background: mood === m ? moodIcons[m].bg : '#f8fafc', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                         <div style={{ transform: mood === m ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.3s', color: moodIcons[m].color }}>{moodIcons[m].icon}</div>
                         <div style={{ fontSize: '1.2rem', fontWeight: '800', color: mood === m ? moodIcons[m].color : 'var(--text-muted)' }}>{moodIcons[m].text}</div>
                       </button>
                     ))}
                  </div>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="เล่าเรื่องราวที่น่าประทับใจในวันนี้ให้ฟังหน่อยครับ..." style={{ width: '100%', height: '300px', padding: '32px', borderRadius: '32px', border: '2px solid #e2e8f0', marginBottom: '40px', fontSize: '1.5rem', lineHeight: '1.6', outline: 'none', background: '#fafafa' }} required />
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <button type="button" onClick={() => setShowAdd(false)} className="btn-large" style={{ flex: 1, background: '#f1f5f9', color: 'var(--text-muted)' }}>ย้อนกลับ</button>
                    <button type="submit" disabled={saving} className="btn-large" style={{ flex: 2, background: 'var(--primary)', color: 'white', boxShadow: '0 15px 35px rgba(2, 132, 199, 0.3)' }}>
                      {saving ? <Loader2 className="animate-spin" /> : <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Sparkles /> บันทึกความทรงจำ</span>}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                <motion.button whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '40px', borderRadius: '40px', border: '4px dashed var(--primary-light)', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: '900', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', transition: 'all 0.3s' }}>
                  <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '15px' }}><PenLine size={32} color="white" /></div>
                  เริ่มเขียนบันทึกความทรงจำใหม่
                </motion.button>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" color="var(--primary)" size={64} /></div>
                ) : diaries.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '100px', borderRadius: '48px' }}>
                     <div style={{ background: 'var(--primary-light)', width: '120px', height: '120px', borderRadius: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}><Book size={60} color="var(--primary)" style={{ opacity: 0.6 }} /></div>
                     <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>ยังไม่มีรายการบันทึกครับ</h3>
                     <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem' }}>เริ่มต้นเขียนบันทึกเล่มนี้ด้วยเรื่องราวแรกของคุณ</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '40px', paddingLeft: '32px' }}>
                     <div style={{ position: 'absolute', left: '0', top: '20px', bottom: '20px', width: '6px', background: 'linear-gradient(to bottom, var(--primary) 0%, #e2e8f0 100%)', borderRadius: '10px' }} />
                     
                     {diaries.map((diary, idx) => {
                       const moodData = moodIcons[diary.mood] || moodIcons['ปกติ']
                       const date = new Date(diary.entry_date)
                       return (
                        <motion.div key={diary.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="card" style={{ padding: '40px', borderRadius: '48px', position: 'relative', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '32px', background: '#fff', overflow: 'hidden' }}>
                           <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', background: moodData.color }} />
                           <div style={{ position: 'absolute', left: '-40px', top: '40px', width: '24px', height: '24px', borderRadius: '50%', background: moodData.color, border: '6px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10 }} />
                           
                           <div style={{ flex: 1 }}>
                             <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'flex-start', gap: '20px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                 <div style={{ textAlign: 'center', background: '#f8fafc', padding: '12px 20px', borderRadius: '24px', minWidth: '100px' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>{date.getDate()}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{date.toLocaleDateString('th-TH', { month: 'short' })}</div>
                                 </div>
                                 <div>
                                   <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-muted)' }}>{date.toLocaleDateString('th-TH', { weekday: 'long' })}</div>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '1rem' }}><Calendar size={16} /> พ.ศ. {date.getFullYear() + 543}</div>
                                 </div>
                               </div>
                               <div style={{ background: moodData.bg, padding: '12px 24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: moodData.color, border: `1px solid ${moodData.color}20` }}>
                                  {moodData.icon}
                                  <span style={{ fontSize: '1.2rem', fontWeight: '900' }}>{diary.mood}</span>
                               </div>
                             </div>
                             
                             <div style={{ position: 'relative' }}>
                               <Quote size={40} style={{ position: 'absolute', top: '-10px', left: '-15px', opacity: 0.05, color: 'var(--primary)' }} />
                               <p style={{ margin: 0, fontSize: '1.6rem', lineHeight: '1.8', color: 'var(--text)', whiteSpace: 'pre-wrap', fontWeight: '500', position: 'relative', zIndex: 1 }}>{diary.content}</p>
                             </div>
                           </div>
                        </motion.div>
                       )
                     })}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutTransition>
  )
}
