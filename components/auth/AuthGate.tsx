'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { isPublicPath } from '@/lib/auth/routes'
import { useUser } from '@/lib/hooks/useUser'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const { user, profile, loading: userLoading, isVirtual } = useUser()
  const isPublic = isPublicPath(pathname)

  useEffect(() => {
    if (!userLoading && profile?.role === 'caretaker') {
      document.body.classList.add('caretaker-mode')
    } else {
      document.body.classList.remove('caretaker-mode')
    }
  }, [userLoading, profile])

  useEffect(() => {
    if (userLoading) return

    // Logic: Authenticated means EITHER Supabase Session OR Virtual Login ID
    const isAuthenticated = !!user || isVirtual

    // 1. If NOT authenticated and NOT on a public page
    if (!isAuthenticated && !isPublic) {
      router.replace('/welcome')
      return
    }

    // 2. If authenticated and not on a public/welcome/role page, check for role
    // Virtual elders already have a fixed 'elder' role assigned in UserProvider
    if (isAuthenticated && !isPublic && !pathname.startsWith('/setup-role') && pathname !== '/settings' && pathname !== '/welcome') {
      // Only redirect if loading is completely finished and we are 100% sure a role is missing
      if (!userLoading && user && (profile === null || (profile && !profile.role))) {
        router.replace('/setup-role')
      }
    }
  }, [userLoading, user, isVirtual, isPublic, pathname, profile, router])

  if (userLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={48} className="animate-spin" color="var(--primary)" />
        <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  // If we're authenticated or on a public page, show the content
  return <>{children}</>
}
