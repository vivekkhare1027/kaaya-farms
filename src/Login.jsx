import { useState } from 'react'
import { useAuth } from './hooks'

const s = {
  wrap:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
           minHeight:'100vh', background:'#F7F1E8', padding:'24px', fontFamily:"'DM Sans',sans-serif" },
  card:  { background:'#fff', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:380,
           boxShadow:'0 8px 40px rgba(60,30,0,0.12)', border:'1px solid rgba(60,30,0,0.07)' },
  logo:  { width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#CF8A1C,#B87820)',
           display:'flex', alignItems:'center', justifyContent:'center', fontSize:34,
           margin:'0 auto 16px', boxShadow:'0 4px 18px rgba(184,120,32,0.45)' },
  title: { fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:700,
           color:'#1A1008', textAlign:'center', marginBottom:4 },
  sub:   { fontSize:14, color:'#8A7A60', textAlign:'center', marginBottom:32, fontFamily:'serif' },
  label: { fontSize:12, fontWeight:700, letterSpacing:1.4, textTransform:'uppercase',
           color:'#8A7A60', marginBottom:7, display:'block' },
  input: { background:'#F5EFE4', border:'1.5px solid #DDD0BC', borderRadius:12,
           padding:'13px 16px', fontSize:16, fontFamily:"'DM Sans',sans-serif",
           color:'#1A1008', width:'100%', outline:'none',
           marginBottom:16 },
  btn:   { background:'#B87820', color:'#fff', border:'none', borderRadius:14,
           padding:'16px 24px', fontSize:17, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
           cursor:'pointer', width:'100%', boxShadow:'0 4px 14px rgba(184,120,32,0.35)',
           transition:'all .18s' },
  err:   { background:'#FFF5F5', border:'1px solid #F5D0D0', borderRadius:10,
           padding:'12px 16px', fontSize:14, color:'#B04040', marginBottom:16 },
  ok:    { background:'#F0FBF5', border:'1px solid #C6E8D4', borderRadius:10,
           padding:'12px 16px', fontSize:14, color:'#2D8A5E', marginBottom:16 },
  hint:  { fontSize:13, color:'#8A7A60', textAlign:'center', marginTop:16, lineHeight:1.6 }
}

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode,     setMode]     = useState('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [ok,       setOk]       = useState('')

  const handle = async () => {
    setError(''); setOk('')
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true)
    if (mode === 'signin') {
      const { error: err } = await signIn(email, password)
      if (err) setError(err)
    } else {
      const { error: err } = await signUp(email, password)
      if (err) setError(err)
      else setOk('Account created! Check your email to confirm, or sign in directly.')
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>🐄</div>
        <div style={s.title}>Kaaya Farms</div>
        <div style={s.sub}>Lucknow · Est. 2020</div>

        {error && <div style={s.err}>⚠️ {error}</div>}
        {ok    && <div style={s.ok}>✓ {ok}</div>}

        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />

        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />

        <button style={s.btn} onClick={handle} disabled={loading}>
          {loading
            ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
            : (mode === 'signin' ? 'Sign In →' : 'Create Account →')}
        </button>

        <div style={s.hint}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setOk('') }}
            style={{ background:'none', border:'none', color:'#B87820', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
