'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { Send, ArrowLeft, Tag, Sparkles } from 'lucide-react'
import Link from 'next/link'
import LayoutTransition from '@/components/layout/LayoutTransition'
import SideNav from '@/components/layout/SideNav'

const CATEGORIES = [
  { label: 'เรื่องเล่า', emoji: '📖' },
  { label: 'สูตรอาหาร', emoji: '🍳' },
  { label: 'สุขภาพ', emoji: '💪' },
]

const PROMPTS = [
  'วันนี้คุณทำอะไรที่ทำให้ตัวเองรู้สึกดีบ้าง?',
  'มีอาหารหรือสมุนไพรใดที่คุณอยากแนะนำ?',
  'ประสบการณ์ดูแลสุขภาพที่อยากแบ่งปัน',
  'เรื่องราวที่ทำให้คุณยิ้มได้วันนี้',
]

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('เรื่องเล่า')
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    setLoading(true)

    // Anti-spam: check last post time
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentPosts && recentPosts.length > 0) {
      const lastPostTime = new Date(recentPosts[0].created_at).getTime()
      if (Date.now() - lastPostTime < 30000) {
        alert('กรุณารอสักครู่ (30 วินาที) ก่อนลงโพสต์ใหม่ครับ เพื่อป้องกันสแปม')
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.from('posts').insert({ title, content, category, user_id: user?.id })
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
      setLoading(false)
    } else {
      router.push('/forum')
      router.refresh()
    }
  }

  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !loading

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <Link href="/forum">
            <button style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '20px',
              background: 'var(--primary-light)', color: 'var(--primary-dark)', textDecoration: 'none',
              border: 'none', cursor: 'pointer'
            }}>
              <ArrowLeft size={28} />
            </button>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary-dark)' }}>เขียนเรื่องราว</h1>
            <p style={{ margin: 0, fontSize: '1.3rem', color: '#64748b' }}>แบ่งปันให้เพื่อนๆ ได้อ่านครับ</p>
          </div>
        </header>

        {/* Writing Inspiration */}
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe, #ffffff)',
          border: '2px solid #bfdbfe',
          borderRadius: '24px',
          padding: '24px 32px',
          marginBottom: '36px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <Sparkles size={26} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '1.4rem', color: '#1e40af', fontStyle: 'italic', lineHeight: '1.7' }}>
            {randomPrompt}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              หัวข้อเรื่อง
            </label>
            <input
              type="text"
              placeholder="เช่น วันนี้ฉันลองเมนูใหม่..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%', height: '72px', borderRadius: '20px',
                border: '2px solid var(--border)', fontSize: '1.4rem',
                padding: '0 24px', fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              <Tag size={24} /> หมวดหมู่
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {CATEGORIES.map(({ label, emoji }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCategory(label)}
                  style={{
                    flex: 1, height: '64px', borderRadius: '20px', cursor: 'pointer',
                    border: category === label ? '3px solid var(--primary)' : '2px solid var(--border)',
                    backgroundColor: category === label ? 'var(--primary)' : 'white',
                    color: category === label ? 'white' : '#64748b',
                    fontSize: '1.2rem', fontWeight: '700',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>เนื้อหา</label>
              <span style={{ fontSize: '1.1rem', color: content.length > 20 ? 'var(--primary)' : '#94a3b8', fontWeight: '600' }}>
                {content.length} ตัวอักษร
              </span>
            </div>
            <textarea
              placeholder="เขียนเรื่องราวของคุณที่นี่... ไม่ต้องกังวลเรื่องความสมบูรณ์แบบครับ ✍️"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              style={{
                width: '100%', padding: '24px', fontSize: '1.4rem',
                borderRadius: '20px', border: '2px solid var(--border)',
                fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                lineHeight: '1.8', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', height: '80px', borderRadius: '24px', border: 'none',
              background: canSubmit ? 'var(--primary)' : 'var(--border)',
              color: canSubmit ? 'white' : '#94a3b8',
              fontSize: '1.6rem', fontWeight: '900', cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
              transition: 'all 0.2s',
              boxShadow: canSubmit ? '0 8px 24px rgba(37,99,235,0.35)' : 'none'
            }}
          >
            {loading ? 'กำลังเผยแพร่...' : <><Send size={30} /> เผยแพร่เรื่องราว</>}
          </button>
        </form>
      </div>
    </LayoutTransition>
  )
}
