'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MessageSquare, Loader2, User, Plus, Calendar, Heart, Share2, MoreHorizontal, Send, Sparkles, ChevronLeft, MessageCircle } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { motion, AnimatePresence } from 'framer-motion'
import Popup from '@/components/ui/Popup'

const categoryStyles: Record<string, any> = {
  'ทั่วไป': { bg: '#eff6ff', text: '#2563eb', border: '#dbeafe' },
  'สุขภาพ': { bg: '#f0fdf4', text: '#16a34a', border: '#dcfce7' },
  'สูตรอาหาร': { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
  'เรื่องเล่า': { bg: '#fdf2f8', text: '#db2777', border: '#fce7f3' },
  'ธรรมะ': { bg: '#f5f3ff', text: '#7c3aed', border: '#ede9fe' },
}

export default function ForumPage() {
  const { user, profile, isVirtual } = useUser()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  
  // Comments state
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commenting, setCommenting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (selectedPost) fetchComments(selectedPost.id)
  }, [selectedPost])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('community_feed')
      .select('*, comments(count)')
      .order('created_at', { ascending: false })
    
    if (!error) setPosts(data || [])
    setLoading(false)
  }

  async function fetchComments(postId: number) {
    setLoadingComments(true)
    const { data, error } = await supabase
      .from('comment_feed')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (!error) setComments(data || [])
    setLoadingComments(false)
  }

  // Post form state
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('ทั่วไป')
  const [saving, setSaving] = useState(false)

  async function handleAddPost(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim() || saving) return
    setSaving(true)

    const payload: any = { title: title.trim(), content: content.trim(), category }
    if (isVirtual && profile) payload.virtual_elder_id = profile.id
    else if (user) payload.user_id = user.id

    const { error } = await supabase.from('posts').insert(payload)
    if (!error) {
      setTitle('')
      setContent('')
      setShowAdd(false)
      fetchPosts()
    }
    setSaving(false)
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || commenting || !selectedPost || !profile) return
    setCommenting(true)

    // Anti-spam: check last comment time
    const query = supabase
      .from('comments')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (isVirtual) query.eq('virtual_elder_id', profile.id)
    else query.eq('user_id', user?.id)

    const { data: recentComments } = await query

    if (recentComments && recentComments.length > 0) {
      const lastCommentTime = new Date(recentComments[0].created_at).getTime()
      const now = new Date().getTime()
      if (now - lastCommentTime < 5000) { // 5 second cooldown
        alert('กรุณารอสักครู่ก่อนแสดงความเห็นอีกครั้งครับ')
        setCommenting(false)
        return
      }
    }

    const payload: any = { 
      post_id: selectedPost.id, 
      content: newComment.trim() 
    }
    if (isVirtual) payload.virtual_elder_id = profile.id
    else payload.user_id = user?.id

    const { error } = await supabase.from('comments').insert(payload)
    if (!error) {
      setNewComment('')
      fetchComments(selectedPost.id)
      fetchPosts() // Update count in list
    }
    setCommenting(false)
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px' }}>
        
        {!selectedPost ? (
          <>
            <header className="forum-header">
              <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)' }}><MessageSquare size={32} color="white" /></div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>ชุมชนคนกันเอง</h1>
                 </div>
                 <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.3rem', fontWeight: '500' }}>แชร์เรื่องราวดีๆ และพูดคุยกับเพื่อนๆ ทุกคนครับ 👋</p>
              </div>
              
              {!showAdd && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAdd(true)}
                  className="btn-large"
                  style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)' }}
                >
                   <Plus size={24} /> เริ่มพูดคุย
                </motion.button>
              )}
            </header>

            <div style={{ width: '100%' }}>
              <AnimatePresence>
                {showAdd && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ marginBottom: '40px', padding: '40px', borderRadius: '32px', border: '2px solid var(--primary-light)', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                       <h2 style={{ margin: 0, fontSize: '1.8rem' }}>เปิดประเด็นพูดคุย</h2>
                       <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Plus size={32} style={{ transform: 'rotate(45deg)' }} /></button>
                    </div>
                    <form onSubmit={handleAddPost}>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="หัวข้อที่คุณต้องการพูดถึง (เช่น เคล็ดลับสุขภาพวันนี้)" style={{ width: '100%', padding: '18px 24px', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '20px', fontSize: '1.3rem', fontWeight: 'bold', outline: 'none' }} required />
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '12px' }}>
                         {Object.keys(categoryStyles).map(cat => (
                           <button key={cat} type="button" onClick={() => setCategory(cat)} style={{ flexShrink: 0, padding: '12px 24px', borderRadius: '14px', border: category === cat ? `2px solid ${categoryStyles[cat].text}` : '2px solid transparent', background: category === cat ? categoryStyles[cat].bg : 'white', color: category === cat ? categoryStyles[cat].text : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>{cat}</button>
                         ))}
                      </div>
                      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="เขียนเนื้อหาที่คุณต้องการพูดคุยที่นี่ครับ..." style={{ width: '100%', height: '200px', padding: '24px', borderRadius: '20px', border: '2px solid #e2e8f0', marginBottom: '32px', fontSize: '1.2rem', lineHeight: '1.6', resize: 'none', outline: 'none' }} required />
                      <button type="submit" disabled={saving} className="btn-large" style={{ width: '100%', background: 'var(--primary)', color: 'white', height: '64px', borderRadius: '20px', fontSize: '1.3rem', boxShadow: '0 12px 30px rgba(37, 99, 235, 0.25)' }}>
                        {saving ? <Loader2 className="animate-spin" /> : 'ลงประกาศเรื่องราวของคุณ'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '120px' }}><Loader2 className="animate-spin" color="var(--primary)" size={64} /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', gap: '32px' }}>
                   {posts.map((post, idx) => {
                     const catStyle = categoryStyles[post.category] || categoryStyles['ทั่วไป']
                     return (
                      <motion.div 
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedPost(post)}
                        className="card social-post" 
                        style={{ padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.8)', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                           <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'var(--primary-light)', overflow: 'hidden' }}>
                              {post.author_avatar ? <img src={post.author_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} color="var(--primary)" style={{ margin: '13px' }} />}
                           </div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{post.author_name}</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString('th-TH')}</div>
                           </div>
                           <span style={{ fontSize: '0.8rem', background: catStyle.bg, padding: '6px 12px', borderRadius: '10px', color: catStyle.text, fontWeight: '800' }}>{post.category}</span>
                        </div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.6rem', color: 'var(--primary-dark)', fontWeight: '900' }}>{post.title}</h2>
                        <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                        
                        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', color: 'var(--primary)', fontWeight: 'bold' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={20} /> ความคิดเห็น ({post.comments?.[0]?.count || 0})</div>
                        </div>
                      </motion.div>
                     )
                   })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Detailed View */
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setSelectedPost(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', marginBottom: '24px' }}>
              <ChevronLeft size={24} /> ย้อนกลับไปหน้าชุมชน
            </button>
            
            <div className="card" style={{ padding: '40px', borderRadius: '40px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
                 <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'var(--primary-light)', overflow: 'hidden' }}>
                    {selectedPost.author_avatar ? <img src={selectedPost.author_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={30} color="var(--primary)" style={{ margin: '20px' }} />}
                 </div>
                 <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedPost.author_name}</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>โพสต์เมื่อ {new Date(selectedPost.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
                 <div style={{ marginLeft: 'auto' }}>
                    <span style={{ fontSize: '1rem', background: categoryStyles[selectedPost.category]?.bg, padding: '8px 20px', borderRadius: '15px', color: categoryStyles[selectedPost.category]?.text, fontWeight: '800' }}>{selectedPost.category}</span>
                 </div>
              </div>
              
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '24px' }}>{selectedPost.title}</h1>
              <p style={{ fontSize: '1.6rem', lineHeight: '1.8', color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '40px' }}>{selectedPost.content}</p>
              
              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '32px' }}>
                 <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><MessageCircle /> ความคิดเห็น ({comments.length})</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                     {loadingComments ? (
                       <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
                     ) : comments.length === 0 ? (
                       <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '20px' }}>ยังไม่มีความคิดเห็นครับ</p>
                     ) : comments.map(c => (
                       <div key={c.id} style={{ display: 'flex', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '24px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', flexShrink: 0, overflow: 'hidden' }}>
                             {c.author_avatar ? <img src={c.author_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="var(--primary)" style={{ margin: '10px' }} />}
                          </div>
                          <div>
                             <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-dark)' }}>{c.author_name}</div>
                             <p style={{ margin: '4px 0', fontSize: '1.3rem', color: 'var(--text)', lineHeight: '1.5' }}>{c.content}</p>
                             <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                       </div>
                     ))}
                 </div>

                 {/* Comment Form */}
                 <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={24} color="white" /></div>
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="เขียนความคิดเห็นของคุณ..." style={{ flex: 1, padding: '0 24px', borderRadius: '20px', border: '2px solid #e2e8f0', fontSize: '1.2rem', outline: 'none' }} required />
                    <button type="submit" disabled={commenting} style={{ background: 'var(--primary)', color: 'white', width: '60px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                       {commenting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    </button>
                 </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <style jsx global>{`
        .social-post:hover { transform: translateY(-4px); transition: all 0.2s; }
      `}</style>
    </LayoutTransition>
  )
}
