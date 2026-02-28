import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export const FARM_ID = import.meta.env.VITE_FARM_ID || 'YOUR-FARM-UUID-HERE'

function log(fn, err) {
  console.error(`[Kaaya Farms] ${fn}:`, err?.message || err)
}

export function useCattle() {
  const [cattle, setCattle] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cattle')
      .select('*')
      .eq('farm_id', FARM_ID)
      .eq('status', 'active')
      .order('name')
    if (error) log('useCattle.fetch', error)
    else setCattle(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('cattle-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cattle',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addCattle = async (fields) => {
    const { error } = await supabase
      .from('cattle')
      .insert([{ ...fields, farm_id: FARM_ID }])
    if (error) { log('addCattle', error); return false }
    return true
  }

  return { cattle, loading, addCattle, refetch: fetch }
}

export function useMilkLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('milk_yield_logs')
      .select(`*, cattle ( name, breed )`)
      .eq('farm_id', FARM_ID)
      .order('yield_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) log('useMilkLogs.fetch', error)
    else setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('milk-changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'milk_yield_logs',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addLog = async ({ cattle_id, session, qty_liters, logged_by, yield_date }) => {
    const { error } = await supabase
      .from('milk_yield_logs')
      .insert([{ farm_id: FARM_ID, cattle_id, session, qty_liters, logged_by, yield_date }])
    if (error) { log('addMilkLog', error); return false }
    return true
  }

  return { logs, loading, addLog, refetch: fetch }
}

export function useHealthLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cattle_health_logs')
      .select('*, cattle ( name )')
      .eq('farm_id', FARM_ID)
      .order('log_date', { ascending: false })
      .limit(30)
    if (error) log('useHealthLogs.fetch', error)
    else setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('health-changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'cattle_health_logs',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addLog = async (fields) => {
    const { error } = await supabase
      .from('cattle_health_logs')
      .insert([{ ...fields, farm_id: FARM_ID }])
    if (error) { log('addHealthLog', error); return false }
    return true
  }

  return { logs, loading, addLog }
}

export function useFeed() {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feed_inventory')
      .select('*')
      .eq('farm_id', FARM_ID)
      .order('item_name')
    if (error) log('useFeed.fetch', error)
    else setFeed(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('feed-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'feed_inventory',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addItem = async ({ item_name, unit, stock, reorder_at }) => {
    const { error } = await supabase
      .from('feed_inventory')
      .insert([{ farm_id: FARM_ID, item_name, unit, stock, reorder_at }])
    if (error) { log('addFeedItem', error); return false }
    return true
  }

  const updateStock = async (id, newStock) => {
    const { error } = await supabase
      .from('feed_inventory')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { log('updateStock', error); return false }
    return true
  }

  return { feed, loading, addItem, updateStock }
}

export function useLedger() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('farm_id', FARM_ID)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) log('useLedger.fetch', error)
    else setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('ledger-changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ledger_entries',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addEntry = async (fields) => {
    const { error } = await supabase
      .from('ledger_entries')
      .insert([{ ...fields, farm_id: FARM_ID }])
    if (error) { log('addLedgerEntry', error); return false }
    return true
  }

  const uploadReceipt = async (file) => {
    const ext  = file.name.split('.').pop()
    const path = `receipts/${FARM_ID}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('farm-media')
      .upload(path, file)
    if (error) { log('uploadReceipt', error); return null }
    const { data } = supabase.storage.from('farm-media').getPublicUrl(path)
    return data.publicUrl
  }

  return { entries, loading, addEntry, uploadReceipt }
}

export function useTodos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('farm_id', FARM_ID)
      .order('priority', { ascending: true })
      .order('due_date',  { ascending: true })
    if (error) log('useTodos.fetch', error)
    else setTodos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('todos-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'todos',
        filter: `farm_id=eq.${FARM_ID}`
      }, fetch)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  const addTodo = async (fields) => {
    const { error } = await supabase
      .from('todos')
      .insert([{ ...fields, farm_id: FARM_ID, status: 'pending' }])
    if (error) { log('addTodo', error); return false }
    return true
  }

  const toggleTodo = async (id, currentStatus) => {
    const isDone = currentStatus === 'done'
    const { error } = await supabase
      .from('todos')
      .update({
        status: isDone ? 'pending' : 'done',
        completed_at: isDone ? null : new Date().toISOString()
      })
      .eq('id', id)
    if (error) { log('toggleTodo', error); return false }
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, status: isDone ? 'pending' : 'done' } : t
    ))
    return true
  }

  const deleteTodo = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) { log('deleteTodo', error); return false }
    setTodos(prev => prev.filter(t => t.id !== id))
    return true
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo }
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { log('signIn', error); return { error: error.message } }
    return { error: null }
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { log('signUp', error); return { error: error.message } }
    return { error: null }
  }

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signIn, signUp, signOut }
}