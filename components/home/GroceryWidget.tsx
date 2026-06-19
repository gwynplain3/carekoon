'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ShoppingCart, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'

interface Item { id: number; item: string; is_checked: boolean }

export default function GroceryWidget({ userId, targetType = 'real', readOnly = false }: { userId: string, targetType?: 'real' | 'virtual', readOnly?: boolean }) {
  const { profile } = useUser()
  const effectiveReadOnly = readOnly

  const [items, setItems] = useState<Item[]>([])
  const [newItem, setNewItem] = useState('')
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    let query = supabase.from('grocery_items').select('id, item, is_checked')
    if (targetType === 'virtual') {
      query = query.eq('virtual_elder_id', userId)
    } else {
      query = query.eq('user_id', userId)
    }
    query.order('created_at').then(({ data }) => setItems(data ?? []))
  }, [userId, targetType])

  async function add() {
    const text = newItem.trim()
    if (!text) return
    const payload: any = { item: text }
    if (targetType === 'virtual') {
      payload.virtual_elder_id = userId
    } else {
      payload.user_id = userId
    }
    const { data } = await supabase
      .from('grocery_items')
      .insert(payload)
      .select('id, item, is_checked')
      .single()
    if (data) setItems(p => [...p, data])
    setNewItem('')
    setShowInput(false)
  }

  async function toggle(item: Item) {
    await supabase.from('grocery_items').update({ is_checked: !item.is_checked }).eq('id', item.id)
    setItems(p => p.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
  }

  async function remove(id: number) {
    await supabase.from('grocery_items').delete().eq('id', id)
    setItems(p => p.filter(i => i.id !== id))
  }

  async function resetChecked() {
    const ids = items.filter(i => i.is_checked).map(i => i.id)
    if (!ids.length) return
    await supabase.from('grocery_items').update({ is_checked: false }).in('id', ids)
    setItems(p => p.map(i => ({ ...i, is_checked: false })))
  }

  const checked = items.filter(i => i.is_checked).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#F59E0B', padding: '10px', borderRadius: '12px' }}>
            <ShoppingCart size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>รายการซื้อของ</h2>
        </div>
        {!effectiveReadOnly && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {checked > 0 && (
              <button onClick={resetChecked} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                <RotateCcw size={20} color="var(--text-muted)" />
              </button>
            )}
            <button onClick={() => setShowInput(p => !p)} style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        {showInput && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              autoFocus
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="ระบุสิ่งที่ต้องซื้อ..."
              style={{ flex: 1, height: '48px', borderRadius: '12px', border: '2px solid #F59E0B', fontSize: '1rem', padding: '0 16px', outline: 'none' }}
            />
            <button onClick={add} style={{ height: '48px', padding: '0 20px', borderRadius: '12px', border: 'none', background: '#F59E0B', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              ตกลง
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '20px 0' }}>ไม่มีรายการซื้อของครับ</p>
          ) : (
            items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: item.is_checked ? '#fefce8' : '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <button onClick={() => !effectiveReadOnly && toggle(item)} style={{ background: 'none', border: 'none', cursor: effectiveReadOnly ? 'default' : 'pointer', padding: 0 }}>
                  <CheckCircle2 size={24} color={item.is_checked ? '#F59E0B' : '#cbd5e1'} />
                </button>
                <span style={{ flex: 1, fontSize: '1rem', textDecoration: item.is_checked ? 'line-through' : 'none', color: item.is_checked ? 'var(--text-muted)' : 'var(--text)' }}>
                  {item.item}
                </span>
                {!effectiveReadOnly && (
                  <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e1' }}>
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
