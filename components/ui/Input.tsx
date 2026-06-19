'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ReactNode
}

export default function Input({ label, icon, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        fontSize: '1.2rem', 
        fontWeight: '600',
        color: 'var(--primary-dark)'
      }}>
        {icon}
        {label}
      </label>
      <input
        {...props}
        style={{
          height: '64px',
          padding: '0 20px',
          fontSize: '1.4rem',
          borderRadius: '12px',
          border: '2px solid var(--border)',
          backgroundColor: 'white',
          outline: 'none',
          ...props.style
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
