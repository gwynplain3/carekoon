'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import LayoutTransition from '@/components/layout/LayoutTransition'
import SideNav from '@/components/layout/SideNav'
import { ArrowLeft, Save, Smile, Meh, Frown, Calendar } from 'lucide-react'
import Link from 'next/link'

const moods = [
  { label: 'มีความสุข', icon: <Smile size={40} />, color: '#10b981' },
  { label: 'ปกติ', icon: <Meh size={40} />, color: '#fbbf24' },
  { label: 'เศร้า', icon: <Frown size={40} />, color: '#ef4444' },
]

export default function NewDiaryPage() {
  const { user } = useUser()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('ปกติ')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading || !user) return

    setLoading(true)
    const { error } = await supabase
      .from('diaries')
      .insert({
        user_id: user.id,
        content: content.trim(),
        mood: mood,
        entry_date: date
      })

    if (!error) {
      router.push('/diary')
      router.refresh()
    } else {
      alert('บันทึกไม่สำเร็จ: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/diary">
            <button style={{ background: 'var(--primary-light)', border: 'none', cursor: 'pointer', padding: '14px', borderRadius: '20px' }}>
              <ArrowLeft size={36} color="var(--primary-dark)" />
            </button>
          </Link>
          <h1 style={{ margin: 0, fontSize: '2.4rem' }}>เขียนบันทึกใหม่</h1>
        </header>

        <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
          {/* Date Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: '600', marginBottom: '12px' }}>
              <Calendar size={28} />
              วันที่บันทึก
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%', padding: '20px', fontSize: '1.4rem', borderRadius: '20px', border: '2px solid var(--border)',
                fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>

          {/* Mood Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '1.4rem', fontWeight: '600', marginBottom: '16px' }}>
              ความรู้สึกวันนี้
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(m.label)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 12px',
                    borderRadius: '24px', border: mood === m.label ? `4px solid ${m.color}` : '2px solid var(--border)',
                    backgroundColor: mood === m.label ? `${m.color}20` : 'white', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ color: m.color }}>{m.icon}</div>
                  <span style={{ fontSize: '1.3rem', fontWeight: '600', color: mood === m.label ? m.color : 'var(--text)' }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '1.4rem', fontWeight: '600', marginBottom: '12px' }}>
              เล่าเรื่องราววันนี้...
            </label>
            <textarea
              placeholder="วันนี้ทำอะไรมาบ้างครับ? มีเรื่องอะไรน่าจดจำไหม?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{
                width: '100%', minHeight: '400px', padding: '24px', fontSize: '1.5rem', borderRadius: '24px',
                border: '2px solid var(--border)', fontFamily: 'inherit', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          <button 
            className="btn-large" 
            type="submit" 
            disabled={loading || !content.trim()}
            style={{ 
              width: '100%', background: 'var(--primary)', color: 'white',
              height: '80px', fontSize: '1.6rem'
            }}
          >
            {loading ? 'กำลังบันทึก...' : (
              <>
                <Save size={32} />
                บันทึกความทรงจำ
              </>
            )}
          </button>
        </form>
      </div>
    </LayoutTransition>
  )
}
