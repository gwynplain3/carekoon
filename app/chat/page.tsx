'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import SideNav from '@/components/layout/SideNav'
import LayoutTransition from '@/components/layout/LayoutTransition'
import { Loader2, MessageCircle, Send } from 'lucide-react'

interface Message {
  id: number
  content: string
  created_at: string
  user_id: string
  profiles: { display_name: string } | null
}

export default function ChatPage() {
  const { user, profile } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(display_name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev
              return [...prev, data as Message]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: true })
      .limit(100)

    if (!error) setMessages((data as Message[]) || [])
    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !user || sending) return

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      content: text,
      user_id: user.id,
    })

    if (!error) setNewMessage('')
    setSending(false)
  }

  return (
    <LayoutTransition>
      <SideNav />
      <div className="main-wrapper" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ padding: '24px 32px', borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ 
                backgroundColor: 'var(--primary)', 
                padding: '12px', 
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}>
              <MessageCircle size={32} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '2.2rem' }}>แชทชุมชน</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', margin: 0, marginLeft: '80px' }}>
            ส่งข้อความทักทายเพื่อนร่วมชุมชนได้ที่นี่
          </p>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Loader2 size={56} className="animate-spin" color="var(--primary)" />
            </div>
          ) : messages.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>ยังไม่มีข้อความ</p>
              <p style={{ fontSize: '1.4rem' }}>ลองส่งคำทักทายเป็นคนแรกกันเลย!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user_id === user?.id
              const name = msg.profiles?.display_name || 'ผู้ใช้งาน'
              const time = new Date(msg.created_at).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {isMine ? (profile?.display_name || 'คุณ') : name} · {time}
                  </span>
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '20px 24px',
                      borderRadius: '20px',
                      fontSize: '1.3rem',
                      background: isMine ? 'var(--primary)' : 'var(--surface)',
                      color: isMine ? 'white' : 'var(--text)',
                      border: isMine ? 'none' : '2px solid var(--border)',
                      boxShadow: isMine ? '0 4px 16px rgba(37,99,235,0.25)' : 'var(--shadow)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: '16px',
            padding: '24px 32px',
            borderTop: '2px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            style={{
              flex: 1,
              height: '72px',
              padding: '0 24px',
              fontSize: '1.3rem',
              borderRadius: '16px',
              border: '2px solid var(--border)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn-large"
            disabled={sending || !newMessage.trim()}
            aria-label="ส่งข้อความ"
            style={{
              width: '80px',
              height: '72px',
              padding: 0,
              background: 'var(--primary)',
              color: 'white',
              flexShrink: 0,
              borderRadius: '16px',
            }}
          >
            {sending ? <Loader2 size={32} className="animate-spin" /> : <Send size={32} />}
          </button>
        </form>

      </div>
    </LayoutTransition>
  )
}
