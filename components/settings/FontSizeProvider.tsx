'use client'

import { useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { applyFontSize, resolveFontSize } from '@/lib/fontSize'

export default function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUser()

  useEffect(() => {
    if (!profile?.id) return
    // Respect-caretaker: skip overriding if in caretaker mode
    if (document.body.classList.contains('caretaker-mode')) {
      document.documentElement.style.removeProperty('--base-font-size')
      return
    }
    const size = resolveFontSize(profile.font_size, profile.id)
    applyFontSize(size, profile.id)
  }, [profile?.id, profile?.font_size, profile?.role])

  return <>{children}</>
}
