'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Loader2, MessageSquare } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface PostCardProps {
  id: number
  userId: string
  displayName: string
  title: string
  content: string
  category: string
  createdAt: string
  imageUrl?: string
  commentCount?: number
  onDelete?: () => void
}

export default function PostCard({ 
  id, 
  userId, 
  displayName, 
  title, 
  content, 
  category, 
  createdAt, 
  imageUrl,
  commentCount = 0,
  onDelete 
}: PostCardProps) {
  const { user } = useUser()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAuthor = user?.id === userId
  const date = new Date(createdAt).toLocaleDateString('th-TH', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  })

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      if (onDelete) onDelete()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('ไม่สามารถลบโพสต์ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <motion.div 
        whileHover={{ y: -4 }}
        className="card" 
        style={{ marginBottom: '24px', padding: '0', overflow: 'hidden', position: 'relative' }}
      >
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={title} 
            style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
          />
        )}
        
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ 
              background: 'var(--primary-light)', 
              color: 'var(--primary-dark)', 
              padding: '6px 16px', 
              borderRadius: '24px', 
              fontSize: '1rem',
              fontWeight: '700'
            }}>
              {category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{date}</span>
              {isAuthor && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowConfirm(true)
                  }}
                  disabled={isDeleting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2'
                  }}
                  title="ลบโพสต์"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={24} /> : <Trash2 size={24} />}
                </button>
              )}
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--primary-dark)', lineHeight: '1.2' }}>{title}</h3>
          <p style={{ 
            fontSize: '1.3rem', 
            color: 'var(--text)', 
            display: '-webkit-box', 
            WebkitLineClamp: 4, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            {content}
          </p>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                {displayName?.[0] || 'U'}
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>{displayName}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: '600', fontSize: '1.1rem', background: 'var(--primary-light)', padding: '6px 14px', borderRadius: '16px' }}>
              <MessageSquare size={20} />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showConfirm}
        isDanger={true}
        title="ลบโพสต์นี้?"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้ครับ"
        confirmText="ยืนยันการลบ"
        cancelText="ไม่ลบแล้ว"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}

