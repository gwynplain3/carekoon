'use client'

import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import HealthPage from '@/components/health/HealthPage'

export default function HealthTab() {
  const { user, profile, isVirtual, loading } = useUser()
  const targetId = isVirtual ? profile?.id : user?.id
  const targetType = isVirtual ? 'virtual' : 'real'

  if (loading || !targetId) return null

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        <HealthPage userId={targetId} targetType={targetType} />
      </div>
    </LayoutTransition>
  )
}
