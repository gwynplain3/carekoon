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
    <div className="card" style={{ padding: '32px', borderRadius: '32px', background: 'white', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '12px', borderRadius: '16px', color: 'white' }}>
            <Camera size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>กรอบรูปครอบครัว</h2>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s' }}
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
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', marginBottom: '20px', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text)' }}>คำบรรยายใต้ภาพ</label>
                <input 
                  placeholder="เช่น ไปเที่ยวทะเลด้วยกัน..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '1.1rem', outline: 'none', background: 'white' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ flex: 1, height: '60px', background: 'var(--primary)', color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)' }}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={24} />}
                  {uploading ? 'กำลังส่ง...' : 'เลือกรูปภาพ'}
                  <input type="file" hidden accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
                <button 
                  onClick={() => setShowForm(false)}
                  style={{ padding: '0 24px', background: 'white', border: '1px solid var(--border)', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0f9ff', borderRadius: '16px', border: '1px solid #bae6fd' }}>
        <ImageIcon size={20} color="var(--primary)" />
        <p style={{ color: 'var(--primary-dark)', fontSize: '1rem', margin: 0, fontWeight: '500' }}>รูปภาพจะไปปรากฏใน "กรอบรูปครอบครัว" ของผู้สูงอายุทันทีครับ</p>
      </div>
    </div>
  )
}
