'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { Home, MessageSquare, Book, HeartPulse, Settings, Users, Megaphone, Calendar } from 'lucide-react'

export default function SideNav() {
  const pathname = usePathname()
  const { profile, isVirtual } = useUser()
  const isCaretaker = profile?.role === 'caretaker'

  const navItems = isCaretaker ? [
    { label: 'จัดการผู้สูงอายุ', href: '/manage', icon: Users },
    { label: 'นัดหมายแพทย์', href: '/manage/appointments', icon: Calendar },
    { label: 'สมุดบันทึก', href: '/diary', icon: Book },
    { label: 'ชุมชนคนกันเอง', href: '/forum', icon: MessageSquare },
    { label: 'ประกาศ', href: '/broadcast', icon: Megaphone },
    { label: 'ตั้งค่าระบบ', href: '/settings', icon: Settings },
  ] : [
    { label: 'หน้าแรก', href: '/', icon: Home },
    { label: 'สมุดบันทึก', href: '/diary', icon: Book },
    { label: 'ชุมชนคนกันเอง', href: '/forum', icon: MessageSquare },
    { label: 'สุขภาพ & นัดหมาย', href: '/health', icon: HeartPulse },
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ]

  return (
    <nav className="side-nav">
      <div className="side-nav-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
            padding: '12px', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)' 
          }}>
            <HeartPulse size={32} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="side-nav-title" style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>Care คุณ</h1>
        </div>
        <p className="side-nav-subtitle" style={{ fontSize: '1.05rem', fontWeight: '500', opacity: 0.7, marginTop: '4px' }}>
          {isCaretaker ? 'Caretaker Dashboard' : isVirtual ? 'Elder Health Portal' : 'Health Workspace'}
        </p>
      </div>
      
      <div className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
