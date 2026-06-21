'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Book, MessageSquare, Loader2, Calendar, Smile, Meh, Frown, User } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'

const moodIcons: Record<string, any> = {
  'มีความสุข': <Smile size={24} color="#10b981" />,
  'ปกติ': <Meh size={24} color="#fbbf24" />,
  'เศร้า': <Frown size={24} color="#ef4444" />,
}

export default function DiaryBlogWidget({ userId, targetType, readOnly = false }: { userId: string, targetType: 'real' | 'virtual', readOnly?: boolean }) {
  const { user, profile } = useUser()
  const isCaretaker = profile?.role === 'caretaker'
  
  const [tab, setTab] = useState<'diary' | 'blog'>('diary')
  const [diaries, setDiaries] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showAdd, setShowAdd] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('ปกติ')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('ทั่วไป')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [userId, targetType, tab])

  async function fetchData() {
    setLoading(true)
    if (tab === 'diary') {
      let query = supabase.from('diaries').select('*')
      if (targetType === 'virtual') query = query.eq('virtual_elder_id', userId)
      else query = query.eq('user_id', userId)
      
      const { data, error } = await query.order('entry_date', { ascending: false }).limit(10)
      if (!error) setDiaries(data || [])
    } else {
      // Community Social Feed (Public)
      const { data, error } = await supabase.from('community_feed')
        .select('*, comments(count)')
        .order('created_at', { ascending: false })
        .limit(20)
      if (!error) setBlogs(data || [])
    }
    setLoading(false)
  }

  async function handleAddDiary(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || saving) return
    setSaving(true)
    
    const payload: any = { content: content.trim(), mood, entry_date: new Date().toISOString().split('T')[0] }
    if (targetType === 'virtual') payload.virtual_elder_id = userId
    else payload.user_id = userId

    const { error } = await supabase.from('diaries').insert(payload)
    if (!error) {
      setContent('')
      setShowAdd(false)
      fetchData()
    }
    setSaving(false)
  }

  async function handleAddBlog(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim() || saving) return
    setSaving(true)

    const payload: any = { title: title.trim(), content: content.trim(), category }
    if (targetType === 'virtual') payload.virtual_elder_id = userId
    else if (user) payload.user_id = user.id

    const { error } = await supabase.from('posts').insert(payload)
    if (!error) {
      setTitle('')
      setContent('')
      setShowAdd(false)
      fetchData()
    }
    setSaving(false)
  }

  return (
    <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* Tab Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
        <button 
          onClick={() => { setTab('diary'); setShowAdd(false); }}
          style={{ flex: 1, padding: '16px', background: tab === 'diary' ? 'white' : 'transparent', border: 'none', borderBottom: tab === 'diary' ? '3px solid var(--primary)' : 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Book size={20} color={tab === 'diary' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span style={{ color: tab === 'diary' ? 'var(--primary)' : 'var(--text-muted)' }}>{targetType === 'virtual' ? 'บันทึกส่วนตัว' : 'บันทึกของฉัน'}</span>
        </button>
        <button 
          onClick={() => { setTab('blog'); setShowAdd(false); }}
          style={{ flex: 1, padding: '16px', background: tab === 'blog' ? 'white' : 'transparent', border: 'none', borderBottom: tab === 'blog' ? '3px solid var(--primary)' : 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <MessageSquare size={20} color={tab === 'blog' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span style={{ color: tab === 'blog' ? 'var(--primary)' : 'var(--text-muted)' }}>ชุมชน/การพููดคุย</span>
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {!readOnly && !showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px dashed var(--primary)', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 'bold', marginBottom: '16px', cursor: 'pointer' }}
          >
            + {tab === 'diary' ? 'เขียนบันทึกวันนี้' : 'ตั้งกระทู้ใหม่ในชุมชน'}
          </button>
        )}

        {showAdd ? (
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
             <form onSubmit={tab === 'diary' ? handleAddDiary : handleAddBlog}>
                {tab === 'blog' && (
                  <>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="หัวข้อกระทู้" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '1.1rem' }} required />
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                      <option value="ทั่วไป">ทั่วไป</option>
                      <option value="สุขภาพ">สุขภาพ</option>
                      <option value="สูตรอาหาร">สูตรอาหาร</option>
                      <option value="เรื่องเล่า">เรื่องเล่า</option>
                    </select>
                  </>
                )}
                
                {tab === 'diary' && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', justifyContent: 'center' }}>
                     {Object.keys(moodIcons).map(m => (
                       <button key={m} type="button" onClick={() => setMood(m)} style={{ padding: '20px', borderRadius: '12px', border: mood === m ? '2px solid var(--primary)' : '1px solid var(--border)', background: mood === m ? 'var(--primary-light)' : 'white', cursor: 'pointer' }}>
                         {moodIcons[m]}
                       </button>
                     ))}
                  </div>
                )}

                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder={tab === 'diary' ? "วันนี้เป็นอย่างไรบ้างครับ..." : "เนื้อหาที่คุณต้องการพูดคุย..."} 
                  style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '1.1rem', resize: 'none' }} 
                  required 
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-large" style={{ flex: 1, background: 'white', color: 'var(--text-muted)', border: '1px solid var(--border)', height: '48px' }}>ยกเลิก</button>
                  <button type="submit" disabled={saving} className="btn-large" style={{ flex: 2, background: 'var(--primary)', color: 'white', height: '48px' }}>
                    {saving ? <Loader2 className="animate-spin" /> : 'บันทึกเรียบร้อย'}
                  </button>
                </div>
             </form>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" color="var(--primary)" />
          </div>
        ) : (
          <div>
            {tab === 'diary' ? (
              diaries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px' }}>
                  <Book size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>ยังไม่มีบันทึกความทรงจำครับส่วนตัว</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {diaries.map(diary => (
                    <div key={diary.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} /> {new Date(diary.entry_date).toLocaleDateString('th-TH')}
                        </div>
                        {moodIcons[diary.mood]}
                      </div>
                      <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5', color: 'var(--text)' }}>{diary.content}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              blogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px' }}>
                  <MessageSquare size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>ยังไม่มีการตั้งกระทู้พูดคุยครับ</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {blogs.map(blog => (
                    <div key={blog.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                         <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', overflow: 'hidden' }}>
                            {blog.author_avatar ? <img src={blog.author_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="var(--primary)" style={{ margin: '10px' }} />}
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{blog.author_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(blog.created_at).toLocaleDateString('th-TH')}</div>
                         </div>
                         <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '8px', color: 'var(--primary-dark)', fontWeight: 'bold' }}>{blog.category}</span>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--primary-dark)', fontWeight: '800' }}>{blog.title}</h4>
                      <p style={{ margin: '0', fontSize: '1.1rem', color: 'var(--text)' }}>{blog.content}</p>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '12px' }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--primary)' }}><MessageSquare size={16} /> ความเห็น ({blog.comments?.[0]?.count || 0})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
