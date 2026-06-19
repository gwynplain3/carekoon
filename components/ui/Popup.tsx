'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

interface PopupProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
  buttonLabel?: string
}

export default function Popup({ type, message, onClose, buttonLabel = 'ตกลง' }: PopupProps) {
  const isSuccess = type === 'success'

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 300,
      }}
    >
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '32px' }}>
        {isSuccess ? (
          <CheckCircle2 size={56} color="var(--primary)" style={{ marginBottom: '16px' }} />
        ) : (
          <XCircle size={56} color="var(--danger)" style={{ marginBottom: '16px' }} />
        )}
        <p style={{
          fontSize: '1.3rem',
          fontWeight: '600',
          marginBottom: '28px',
          color: isSuccess ? 'var(--primary-dark)' : 'var(--danger)',
          lineHeight: 1.6,
        }}>
          {message}
        </p>
        <button
          className="btn-large"
          onClick={onClose}
          style={{
            width: '100%',
            height: '64px',
            fontSize: '1.3rem',
            background: isSuccess ? 'var(--primary)' : 'var(--danger)',
            color: 'white',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
