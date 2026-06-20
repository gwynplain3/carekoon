'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Plus, Trash2, Loader2, ListTodo, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/lib/hooks/useUser'

interface Todo {
  id: number
  task: string
  is_done: boolean
  is_recurring: boolean
  last_updated_at?: string
}

export default function TodoWidget({ userId, targetType, readOnly = false }: { userId: string, targetType: 'real' | 'virtual', readOnly?: boolean }) {
  const { profile } = useUser()
  const effectiveReadOnly = readOnly

  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetchTodos()
  }, [userId, targetType])

  async function fetchTodos() {
    setLoading(true)
    let query = supabase.from('todos').select('*')
    if (targetType === 'virtual') query = query.eq('virtual_elder_id', userId)
    else query = query.eq('user_id', userId)
    
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) {
      setLoading(false)
      return
    }

    // Reset recurring tasks if it's a new day
    const today = new Date().toLocaleDateString('en-CA')
    const processed = await Promise.all((data || []).map(async (todo) => {
      const lastGate = todo.last_updated_at ? new Date(todo.last_updated_at).toLocaleDateString('en-CA') : null
      
      if (todo.is_recurring && lastGate !== today && todo.is_done) {
        const { data: updated } = await supabase
          .from('todos')
          .update({ is_done: false, last_updated_at: new Date().toISOString() })
          .eq('id', todo.id)
          .select()
          .single()
        return updated || todo
      }
      return todo
    }))

    setTodos(processed)
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim() || saving) return
    setSaving(true)
    const payload: any = { 
      task: newTask.trim(), 
      is_recurring: isRecurring,
      last_updated_at: new Date().toISOString()
    }
    if (targetType === 'virtual') payload.virtual_elder_id = userId
    else payload.user_id = userId
    
    const { data, error } = await supabase.from('todos').insert(payload).select().single()
    if (!error && data) {
      setTodos(p => [...p, data])
      setNewTask('')
      setIsRecurring(false)
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function toggleTodo(todo: Todo) {
    const { error } = await supabase.from('todos').update({ 
      is_done: !todo.is_done,
      last_updated_at: new Date().toISOString()
    }).eq('id', todo.id)
    if (!error) setTodos(p => p.map(t => t.id === todo.id ? { ...t, is_done: !t.is_done } : t))
  }

  async function deleteTodo(id: number) {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (!error) setTodos(p => p.filter(t => t.id !== id))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
            <ListTodo size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>สิ่งที่ต้องทำ</h2>
        </div>
        {!effectiveReadOnly && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            style={{ background: 'var(--primary-light)', border: 'none', borderRadius: '12px', padding: '8px', color: 'var(--primary-dark)', cursor: 'pointer' }}
          >
            {showAdd ? <X size={20} /> : <Plus size={20} />}
          </button>
        )}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
        <AnimatePresence>
          {showAdd && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAdd}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    autoFocus
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="ระบุสิ่งที่ต้องทำ..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '1rem' }}
                  />
                  <button disabled={saving || !newTask.trim()} className="btn-large" style={{ background: 'var(--primary)', color: 'white', padding: '0 20px', height: '48px', fontSize: '1rem' }}>
                    {saving ? <Loader2 size={18} className="animate-spin" /> : 'เพิ่ม'}
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                   <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                   <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ทำทุกวัน (Everyday task)</span>
                </label>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 className="animate-spin" color="var(--primary)" />
            </div>
          ) : todos.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '20px 0' }}>ไม่มีรายการที่ต้องทำครับ</p>
          ) : (
            todos.map(todo => (
              <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: todo.is_recurring ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: todo.is_recurring ? '1px solid var(--primary-light)' : '1px solid #f1f5f9' }}>
                <button onClick={() => toggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <CheckCircle2 size={24} color={todo.is_done ? 'var(--primary)' : 'var(--border)'} />
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1rem', textDecoration: todo.is_done ? 'line-through' : 'none', color: todo.is_done ? 'var(--text-muted)' : 'var(--text)' }}>
                    {todo.task}
                  </span>
                  {todo.is_recurring && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>ทวนซ้ำทุกวัน</span>
                  )}
                </div>
                {!effectiveReadOnly && (
                  <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
