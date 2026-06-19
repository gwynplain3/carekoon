'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { ChevronLeft, MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: number
  content: string
  created_at: string
  profiles: {
    display_name: string
  }
}

interface Post {
  id: number
  title: string
  content: string
  category: string
  image_url: string | null
  created_at: string
  user_id: string
  profiles: {
    display_name: string
  }
}

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPostAndComments()
  }, [id])

  async function fetchPostAndComments() {
    setLoading(true)
    
    // Fetch post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*, profiles(display_name)')
      .eq('id', id)
      .single()

    if (postError) {
      console.error('Error fetching post:', postError)
      router.push('/forum')
      return
    }

    setPost(postData)

    // Fetch comments
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*, profiles(display_name)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (!commentError) {
      setComments(commentData || [])
    }
    
    setLoading(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || submitting || !user) return

    setSubmitting(true)
    
    // Anti-spam: check last comment time (simple client-side + server policy check)
    const { data: recentComments } = await supabase
      .from('comments')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentComments && recentComments.length > 0) {
      const lastCommentTime = new Date(recentComments[0].created_at).getTime()
      const now = new Date().getTime()
      if (now - lastCommentTime < 5000) { // 5 second cooldown
        alert('กรุณารอสักครู่ก่อนแสดงความเห็นอีกครั้งครับ (เพื่อป้องกันการสแปม)')
        setSubmitting(false)
        return
      }
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: commentText.trim()
      })

    if (!error) {
      setCommentText('')
      fetchPostAndComments()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={56} className="animate-spin" color="var(--primary)" />
      </div>
    )
  }

  if (!post) return null

  const date = new Date(post.created_at).toLocaleDateString('th-TH', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  })

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        {/* Header/Back Button */}
        <div style={{ 
          position: 'sticky', top: 0, background: 'var(--surface)', padding: '20px 0', 
          borderBottom: '2px solid var(--border)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' 
        }}>
          <Link href="/forum">
            <button style={{ background: 'var(--primary-light)', border: 'none', cursor: 'pointer', padding: '12px', borderRadius: '16px' }}>
              <ChevronLeft size={32} color="var(--primary-dark)" />
            </button>
          </Link>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>รายละเอียดโพสต์</h2>
        </div>

        {/* Post Content */}
        <div style={{ padding: '32px 0' }}>
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt={post.title} 
              style={{ width: '100%', borderRadius: '24px', marginBottom: '32px', maxHeight: '500px', objectFit: 'cover' }} 
            />
          )}
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <span style={{ 
              background: 'var(--primary-light)', 
              color: 'var(--primary-dark)', 
              padding: '8px 20px', 
              borderRadius: '24px', 
              fontSize: '1.1rem',
              fontWeight: '700'
            }}>
              {post.category}
            </span>
          </div>

          <h1 style={{ fontSize: '2.6rem', marginBottom: '24px', color: 'var(--primary-dark)' }}>{post.title}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', color: 'var(--text-muted)' }}>
            <User size={24} />
            <span style={{ fontSize: '1.3rem', fontWeight: '600' }}>{post.profiles?.display_name}</span>
            <span style={{ margin: '0 12px' }}>•</span>
            <Clock size={24} />
            <span style={{ fontSize: '1.3rem' }}>{date}</span>
          </div>

          <p style={{ 
            fontSize: '1.6rem', 
            lineHeight: '1.8', 
            color: 'var(--text)', 
            whiteSpace: 'pre-wrap',
            marginBottom: '48px'
          }}>
            {post.content}
          </p>

          {/* Comments Section */}
          <section style={{ borderTop: '2px solid var(--border)', paddingTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <MessageSquare size={32} color="var(--primary)" />
              <h2 style={{ fontSize: '2rem', margin: 0 }}>ความคิดเห็น ({comments.length})</h2>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleComment} style={{ marginBottom: '40px' }}>
              <textarea
                placeholder="เขียนความคิดเห็นของคุณที่นี่..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '140px',
                  padding: '20px',
                  borderRadius: '20px',
                  border: '2px solid var(--border)',
                  fontSize: '1.3rem',
                  marginBottom: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="btn-large"
                style={{ 
                  width: '100%', 
                  background: 'var(--primary)', 
                  color: 'white',
                  fontSize: '1.4rem',
                  height: '72px'
                }}
              >
                {submitting ? 'กำลังส่ง...' : (
                  <>
                    <Send size={28} />
                    ส่งความคิดเห็น
                  </>
                )}
              </button>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.4rem', padding: '40px' }}>
                  ยังไม่มีความเห็น มาเป็นคนแรกกันเถอะครับ ✨
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)',
                        fontSize: '1.1rem', fontWeight: 'bold'
                      }}>
                        {comment.profiles?.display_name?.[0] || 'U'}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>{comment.profiles?.display_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        {new Date(comment.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p style={{ fontSize: '1.3rem', margin: 0, lineHeight: '1.6' }}>{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </div>
    </LayoutTransition>
  )
}
