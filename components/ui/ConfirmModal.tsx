'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Check } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  isDanger = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              backgroundColor: isDanger ? '#fee2e2' : 'var(--primary-light)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertCircle size={48} color={isDanger ? '#ef4444' : 'var(--primary)'} />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
            <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{message}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={onConfirm}
              className="btn-large"
              style={{
                backgroundColor: isDanger ? '#ef4444' : 'var(--primary)',
                color: 'white',
                border: 'none',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '1.4rem'
              }}
            >
              <Check size={28} />
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="btn-large"
              style={{
                backgroundColor: 'white',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '1.4rem'
              }}
            >
              <X size={28} />
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
