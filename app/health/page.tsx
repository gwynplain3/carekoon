'use client'

import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import HealthPage from '@/components/health/HealthPage'

export default function HealthTab() {
  const { user } = useUser()
  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper">
        {user && <HealthPage userId={user.id} />}
      </div>
    </LayoutTransition>
  )
}
