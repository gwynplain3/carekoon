'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
  font_size?: number | null
  role?: 'caretaker' | 'elder' | 'elder_self' | null
  is_profile_locked?: boolean
  updated_at?: string
}

interface UserContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isVirtual: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => void
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) return null
  return data
}

async function fetchVirtualElderProfile(elderId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('virtual_elders')
    .select('id, display_name, avatar_url, is_profile_locked')
    .eq('id', elderId)
    .single()
  
  if (error || !data) return null
  return {
    id: data.id,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    is_profile_locked: data.is_profile_locked,
    role: 'elder' // Virtual elders act as regular elders
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isVirtual, setIsVirtual] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    // Check virtual first
    const vId = localStorage.getItem('virtual_elder_id')
    if (vId) {
      const vProfile = await fetchVirtualElderProfile(vId)
      if (vProfile) {
        setProfile(vProfile)
        setIsVirtual(true)
        setLoading(false)
        return
      }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setProfile(null)
      setUser(null)
      setIsVirtual(false)
      setLoading(false)
      return
    }
    setUser(session.user)
    const data = await fetchProfile(session.user.id)
    setProfile(data)
    setIsVirtual(false)
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('virtual_elder_id')
    localStorage.removeItem('virtual_elder_name')
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsVirtual(false)
    window.location.href = '/welcome'
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : patch as Profile))
  }, [])

  useEffect(() => {
    refreshProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
           localStorage.removeItem('virtual_elder_id')
           localStorage.removeItem('virtual_elder_name')
           setProfile(null)
           setUser(null)
           setIsVirtual(false)
           return
        }
        if (!localStorage.getItem('virtual_elder_id')) {
          setLoading(true)
          setUser(session?.user ?? null)
          if (session?.user) {
            const data = await fetchProfile(session.user.id)
            setProfile(data)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => authListener.subscription.unsubscribe()
  }, [refreshProfile])

  return (
    <UserContext.Provider value={{ user, profile, loading, isVirtual, refreshProfile, updateProfile, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
