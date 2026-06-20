'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Camera, Plus, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { compressImage } from '@/lib/avatar'

export default function PhotoUpload({ userId, targetType, onUploadSuccess }: { userId: string, targetType: 'real' | 'virtual', onUploadSuccess?: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const fileName = `family/${userId}/${Date.now()}.jpg`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      const payload: any = {
        photo_url: data.publicUrl,
        caption: caption.trim() || 'รูปจากครอบครัว'
      }

      if (targetType === 'virtual') {
        payload.virtual_elder_id = userId
      } else {
        payload.user_id = userId
      }

      const { error: dbError } = await supabase.from('family_photos').insert(payload)
      if (dbError) throw dbError

      setCaption('')
      setShowForm(false)
      if (onUploadSuccess) onUploadSuccess()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('อัปโหลดรูปภาพไม่สำเร็จครับ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <Camera size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>รูปภาพครอบครัว</h2>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            แชร์รูปใหม่
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>คำบรรยายใต้ภาพ</label>
              <input 
                placeholder="เช่น ไปเที่ยวทะเลด้วยกัน..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px', outline: 'none' }}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, height: '52px', background: 'var(--primary)', color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                  {uploading ? 'กำลังส่ง...' : 'เลือกรูปภาพ'}
                  <input type="file" hidden accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
                <button 
                  onClick={() => setShowForm(false)}
                  style={{ padding: '0 20px', background: 'white', border: '1px solid var(--border)', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>รูปภาพจะไปปรากฏใน "กรอบรูปครอบครัว" ในหน้าจอของผู้สูงอายุทันทีครับ</p>
    </div>
  )
}
