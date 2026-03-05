import { useState, useRef, useEffect } from 'react'
import Login from './Login'
import Projects from './components/Projects'
import Reports from './components/Reports'
import {
  useAuth, useCattle, useMilkLogs, useHealthLogs,
  useFeed, useLedger, useTodos, useAllProjectExpenses
} from './hooks'

const TODAY = new Date().toISOString().split('T')[0]
const fmt   = n => `₹${Number(n).toLocaleString('en-IN')}`
const LEDGER_INIT = {type:'expense',category:'dairy_feed',amount:'',description:'',payment_mode:'cash',entry_date:TODAY,logged_by:'Papa',receipt_url:''}
const TASK_INIT   = {title:'',due_date:'',priority:'medium',assigned_to:'Papa',created_by:'You'}

const CAT = {
  dairy_feed:   { icon:'🥛', label:'Dairy & Feed',   hi:'दूध/चारा',   color:'#2d8a5e' },
  construction: { icon:'🏗️', label:'Construction',   hi:'निर्माण',    color:'#8B6914' },
  transport:    { icon:'🚛', label:'Transport',       hi:'परिवहन',     color:'#2e6fa8' },
  labour:       { icon:'👷', label:'Labour',          hi:'मजदूरी',     color:'#b5721a' },
  medicine:     { icon:'💊', label:'Medicine & Vet',  hi:'दवाई',       color:'#b04040' },
  utilities:    { icon:'⚡', label:'Utilities',       hi:'बिजली/पानी', color:'#6b5ba8' },
  grocery:      { icon:'🛒', label:'Grocery',         hi:'किराना',     color:'#a04878' },
  equipment:    { icon:'🔧', label:'Equipment',       hi:'उपकरण',      color:'#5a7050' },
  milk_sale:    { icon:'🥛', label:'Milk Sale',       hi:'दूध बिक्री', color:'#2d8a5e' },
  other:        { icon:'📌', label:'Other',           hi:'अन्य',       color:'#7a7870' },
}
const HEVT = {
  vaccination:{ icon:'💉', label:'Vaccination' },
  illness:    { icon:'🤒', label:'Illness'     },
  deworming:  { icon:'🧪', label:'Deworming'   },
  injury:     { icon:'🩹', label:'Injury'      },
  checkup:    { icon:'🩺', label:'Checkup'     },
  calving:    { icon:'🐄', label:'Calving'     },
}

function Sheet({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(15,10,5,0.55)',backdropFilter:'blur(6px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#FEFAF4',borderRadius:'28px 28px 0 0',padding:'0 22px 44px',width:'100%',maxWidth:460,maxHeight:'92vh',overflowY:'auto',border:'1px solid rgba(180,140,80,0.2)',boxShadow:'0 -8px 40px rgba(60,30,0,0.18)',animation:'sheetUp .32s cubic-bezier(.34,1.3,.64,1)'}}>
        <div style={{width:40,height:4,background:'#D9CDB8',borderRadius:2,margin:'12px auto 24px'}} />
        {children}
      </div>
    </div>
  )
}

function STitle({ en, hi }) {
  return (
    <div style={{marginBottom:22}}>
      <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:'#1A1008',lineHeight:1.1}}>{en}</div>
      <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:4}}>{hi}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60',marginBottom:7}}>{label}</div>
      {children}
    </div>
  )
}

const iStyle = {background:'#F5EFE4',border:'1.5px solid #DDD0BC',borderRadius:12,padding:'13px 16px',fontSize:16,fontFamily:"'DM Sans',sans-serif",color:'#1A1008',width:'100%',outline:'none',transition:'border-color .18s'}

function Inp(props) {
  const [f,setF]=useState(false)
  return <input {...props} style={{...iStyle,...props.style,borderColor:f?'#B87820':'#DDD0BC',boxShadow:f?'0 0 0 3px rgba(184,120,32,0.12)':'none'}} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />
}
function Sel({ children,...props }) {
  const [f,setF]=useState(false)
  return <select {...props} style={{...iStyle,...props.style,borderColor:f?'#B87820':'#DDD0BC',boxShadow:f?'0 0 0 3px rgba(184,120,32,0.12)':'none'}} onFocus={()=>setF(true)} onBlur={()=>setF(false)}>{children}</select>
}
function Txta(props) {
  const [f,setF]=useState(false)
  return <textarea {...props} style={{...iStyle,resize:'none',...props.style,borderColor:f?'#B87820':'#DDD0BC',boxShadow:f?'0 0 0 3px rgba(184,120,32,0.12)':'none'}} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />
}

function BtnGold({ children,full,small,disabled,onClick,style={} }) {
  const [h,setH]=useState(false)
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:disabled?'#D9CDB8':h?'#CF8A1C':'#B87820',color:'#fff',border:'none',borderRadius:14,padding:small?'10px 18px':'15px 24px',fontSize:small?14:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:disabled?'not-allowed':'pointer',width:full?'100%':'auto',boxShadow:disabled?'none':h?'0 6px 24px rgba(184,120,32,0.45)':'0 3px 14px rgba(184,120,32,0.3)',transform:h&&!disabled?'translateY(-1px)':'none',transition:'all .18s',letterSpacing:.3,display:'flex',alignItems:'center',justifyContent:'center',gap:7,...style}}>
      {children}
    </button>
  )
}
function BtnOutline({ children,onClick,full,style={} }) {
  const [h,setH]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:'transparent',color:h?'#B87820':'#6A5840',border:`1.5px solid ${h?'#B87820':'#DDD0BC'}`,borderRadius:14,padding:'13px 20px',fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:'pointer',width:full?'100%':'auto',transition:'all .18s',...style}}>
      {children}
    </button>
  )
}
function TBtn({ label,active,onClick,activeColor='#B87820',activeBg }) {
  return (
    <button onClick={onClick} style={{flex:1,padding:'13px 10px',borderRadius:12,border:`2px solid ${active?activeColor:'#DDD0BC'}`,background:active?(activeBg||'rgba(184,120,32,0.1)'):'transparent',color:active?activeColor:'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:'pointer',transition:'all .18s'}}>
      {label}
    </button>
  )
}

function Card({ children,style={} }) {
  return <div style={{background:'#fff',borderRadius:20,padding:18,border:'1px solid rgba(60,30,0,0.07)',boxShadow:'0 2px 16px rgba(60,30,0,0.06), 0 1px 4px rgba(60,30,0,0.06)',...style}}>{children}</div>
}
function Row({ children,last=false }) {
  return <div style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:last?'none':'1px solid #F0E8DA'}}>{children}</div>
}
function IBox({ children,bg='#F0EAD8' }) {
  return <div style={{width:46,height:46,borderRadius:14,flexShrink:0,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{children}</div>
}
function Badge({ children,color='#5a7050',bg='#eef2e8' }) {
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,color,background:bg}}>{children}</span>
}

function SubTabs({ tabs,active,setActive }) {
  return (
    <div style={{display:'flex',gap:4,background:'#EDE6D8',borderRadius:16,padding:5,margin:'16px 20px 0',border:'1px solid #DDD0BC'}}>
      {tabs.map(t=>(
        <button key={t.k} onClick={()=>setActive(t.k)} style={{flex:1,padding:'11px 6px',border:'none',borderRadius:11,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:'pointer',transition:'all .2s',background:active===t.k?'#fff':'transparent',color:active===t.k?'#1A1008':'#8A7A60',boxShadow:active===t.k?'0 2px 10px rgba(60,30,0,0.1)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>{t.icon} {t.l}</button>
      ))}
    </div>
  )
}

// ── Responsive hook ─────────────────────────────────────────
function useWindowSize() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : false
  )
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

// ── Desktop Sidebar ──────────────────────────────────────────
function Sidebar({ tab, setTab, onSignOut }) {
  const items = [
    { k:'home',     icon:'🏡', label:'Home',     hi:'होम'        },
    { k:'dairy',    icon:'🐄', label:'Dairy',    hi:'डेयरी'      },
    { k:'ledger',   icon:'📒', label:'Ledger',   hi:'बही-खाता'   },
    { k:'projects', icon:'🏗️', label:'Projects', hi:'परियोजनाएँ' },
    { k:'reports',  icon:'📊', label:'Reports',  hi:'रिपोर्ट'    },
    { k:'tasks',    icon:'✅', label:'Tasks',    hi:'काम'        },
  ]
  return (
    <div style={{width:260,flexShrink:0,background:'linear-gradient(180deg,#173322 0%,#1E4530 60%,#244D35 100%)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,overflow:'hidden'}}>
      {/* Logo / brand */}
      <div style={{padding:'28px 24px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:46,height:46,borderRadius:14,background:'linear-gradient(135deg,#CF8A1C,#B87820)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 14px rgba(184,120,32,0.5)',flexShrink:0}}>🐄</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,fontWeight:700,color:'#FFF8EE',lineHeight:1.1}}>Kaaya Farms</div>
            <div style={{fontSize:10,color:'rgba(255,248,238,0.4)',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>Lucknow · Est. 2020</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:14,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'6px 12px',width:'fit-content'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#5FD4A0',boxShadow:'0 0 0 3px rgba(95,212,160,0.25)',animation:'pulse 2.5s infinite'}} />
          <span style={{fontSize:10,color:'rgba(255,248,238,0.5)',letterSpacing:1,fontWeight:600}}>LIVE</span>
        </div>
      </div>
      {/* Navigation items */}
      <div style={{flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:4,overflowY:'auto'}}>
        {items.map(it => {
          const active = tab === it.k
          return (
            <button key={it.k} onClick={() => setTab(it.k)}
              style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderRadius:14,border:'none',background:active?'rgba(255,255,255,0.12)':'transparent',cursor:'pointer',transition:'all .18s',textAlign:'left',width:'100%',boxShadow:active?'0 2px 12px rgba(0,0,0,0.2)':'none',outline:'none'}}>
              <div style={{width:36,height:36,borderRadius:10,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',background:active?'rgba(184,120,32,0.25)':'rgba(255,255,255,0.06)',flexShrink:0,transition:'background .18s'}}>{it.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:active?'#FFF8EE':'rgba(255,248,238,0.6)',fontFamily:"'DM Sans',sans-serif",letterSpacing:.2}}>{it.label}</div>
                <div style={{fontSize:11,fontFamily:'serif',color:'rgba(255,248,238,0.3)',marginTop:1}}>{it.hi}</div>
              </div>
              {active && <div style={{width:4,height:24,borderRadius:2,background:'#CF8A1C',flexShrink:0}} />}
            </button>
          )
        })}
      </div>
      {/* Sign out */}
      <div style={{padding:'16px 12px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={onSignOut}
          style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',cursor:'pointer',width:'100%',transition:'all .18s',color:'rgba(255,248,238,0.5)',fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600}}>
          <span style={{fontSize:16}}>🚪</span> Sign out
        </button>
      </div>
    </div>
  )
}

function Header({ onSignOut }) {
  return (
    <div style={{background:'linear-gradient(160deg,#173322 0%,#1E4530 60%,#244D35 100%)',padding:'20px 20px 32px',position:'relative',overflow:'hidden',flexShrink:0}}>
      <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,background:'radial-gradient(circle,rgba(184,120,32,0.22) 0%,transparent 70%)',borderRadius:'50%'}} />
      <div style={{position:'absolute',bottom:-1,left:0,right:0,height:20,background:'#F7F1E8',borderRadius:'20px 20px 0 0'}} />
      <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:50,height:50,borderRadius:16,flexShrink:0,background:'linear-gradient(135deg,#CF8A1C,#B87820)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 4px 18px rgba(184,120,32,0.5)'}}>🐄</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:23,fontWeight:700,color:'#FFF8EE',letterSpacing:.2,lineHeight:1.1}}>Kaaya Farms</div>
            <div style={{fontSize:11,color:'rgba(255,248,238,0.45)',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>Lucknow · Est. 2020</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,padding:'6px 13px'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#5FD4A0',boxShadow:'0 0 0 3px rgba(95,212,160,0.25)',animation:'pulse 2.5s infinite'}} />
            <span style={{fontSize:11,color:'rgba(255,248,238,0.5)',letterSpacing:1,fontWeight:600}}>LIVE</span>
          </div>
          <button onClick={onSignOut} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,padding:'6px 12px',color:'rgba(255,248,238,0.5)',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
        </div>
      </div>
    </div>
  )
}

function Nav({ tab,setTab }) {
  const items=[{k:'home',icon:'🏡',label:'Home'},{k:'dairy',icon:'🥛',label:'Dairy'},{k:'ledger',icon:'📒',label:'Ledger'},{k:'projects',icon:'🏗️',label:'Projects'},{k:'tasks',icon:'✅',label:'Tasks'},{k:'reports',icon:'📊',label:'Reports'}]
  return (
    <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',WebkitOverflowScrolling:'touch',background:'rgba(254,250,244,0.97)',backdropFilter:'blur(16px)',borderTop:'1px solid #EBE2D2',padding:'6px 8px calc(10px + env(safe-area-inset-bottom, 0px))',flexShrink:0}}>
      {items.map(it=>(
        <button key={it.k} onClick={()=>setTab(it.k)} style={{minWidth:64,flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 4px',border:'none',background:'transparent',cursor:'pointer',borderRadius:12,transition:'all .18s',color:tab===it.k?'#1E4530':'#B0A090',fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,letterSpacing:.4,textTransform:'uppercase'}}>
          <div style={{width:38,height:38,borderRadius:12,fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',background:tab===it.k?'rgba(30,69,48,0.1)':'transparent',transition:'background .18s'}}>{it.icon}</div>
          {it.label}
        </button>
      ))}
    </div>
  )
}

function Home({ nav }) {
  const { logs:milkLogs } = useMilkLogs()
  const { entries }       = useLedger()
  const { todos }         = useTodos()
  const { feed }          = useFeed()
  const { expenses:projExp } = useAllProjectExpenses()
  const todayMilk = milkLogs.filter(l=>l.yield_date===TODAY).reduce((s,l)=>s+(l.qty_liters||0),0)
  const inc  = entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0)
  const ledgerExp = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0)
  const projectExp = projExp.reduce((s,e)=>s+(e.amount||0),0)
  const exp  = ledgerExp + projectExp
  const pend = todos.filter(t=>t.status==='pending').length
  const low  = feed.filter(f=>f.stock<=f.reorder_at)
  return (
    <div style={{overflowY:'auto',padding:'18px 20px 24px',display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:'linear-gradient(150deg,#1A3D28 0%,#245A36 100%)',borderRadius:24,padding:'22px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-30,right:-20,width:160,height:160,background:'radial-gradient(circle,rgba(184,120,32,0.2) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{fontSize:11,color:'rgba(255,248,238,0.4)',fontWeight:700,letterSpacing:2,textTransform:'uppercase',marginBottom:16}}>Today · आज का सारांश</div>
        <div style={{display:'flex',gap:8,position:'relative'}}>
          {[{val:todayMilk.toFixed(1),lbl:'Litres',hi:'दूध',color:'#7DE0B0'},{val:feed.length,lbl:'Feed Items',hi:'चारा',color:'#FFF8EE'},{val:pend,lbl:'Tasks',hi:'काम',color:pend>0?'#F0C46A':'#7DE0B0'}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:'center',background:'rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 8px',border:'1px solid rgba(255,255,255,0.09)'}}>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:32,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,color:'rgba(255,248,238,0.45)',marginTop:5,letterSpacing:1}}>{s.lbl.toUpperCase()}</div>
              <div style={{fontFamily:'serif',fontSize:10,color:'rgba(255,248,238,0.3)',marginTop:2}}>{s.hi}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginTop:12,position:'relative'}}>
          <div style={{flex:1,background:'rgba(95,212,160,0.1)',borderRadius:12,padding:'10px 12px',border:'1px solid rgba(95,212,160,0.15)'}}>
            <div style={{fontSize:11,color:'#7DE0B0',fontWeight:700,letterSpacing:.8}}>↑ INCOME</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:21,fontWeight:700,color:'#FFF8EE',marginTop:3}}>{fmt(inc)}</div>
          </div>
          <div style={{flex:1,background:'rgba(220,100,100,0.1)',borderRadius:12,padding:'10px 12px',border:'1px solid rgba(220,100,100,0.15)'}}>
            <div style={{fontSize:11,color:'#E09090',fontWeight:700,letterSpacing:.8}}>↓ EXPENSE</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:21,fontWeight:700,color:'#FFF8EE',marginTop:3}}>{fmt(exp)}</div>
          </div>
        </div>
        {projectExp>0&&<div style={{display:'flex',gap:12,marginTop:6,padding:'0 4px',position:'relative'}}>
          <div style={{fontSize:10,color:'rgba(255,248,238,0.35)'}}>📒 Ledger: {fmt(ledgerExp)}</div>
          <div style={{fontSize:10,color:'rgba(255,248,238,0.35)'}}>🏗️ Projects: {fmt(projectExp)}</div>
        </div>}
        <div style={{textAlign:'center',marginTop:10,padding:'8px 0',borderTop:'1px solid rgba(255,255,255,0.08)',position:'relative'}}>
          <div style={{fontSize:10,color:'rgba(255,248,238,0.4)',fontWeight:700,letterSpacing:1}}>NET BALANCE</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:700,color:inc-exp>=0?'#7DE0B0':'#E09090',marginTop:2}}>{fmt(inc-exp)}</div>
        </div>
      </div>
      {low.length>0&&(
        <Card style={{background:'#FFF8F5',borderColor:'rgba(176,64,64,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>⚠️</span>
            <span style={{fontWeight:700,fontSize:15,color:'#A03030'}}>Low Stock</span>
            <span style={{fontFamily:'serif',fontSize:12,color:'#A03030',opacity:.7}}>स्टॉक कम है</span>
          </div>
          {low.map(f=>(
            <div key={f.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',fontSize:14,borderTop:'1px solid rgba(176,64,64,0.08)'}}>
              <span style={{color:'#3A2010'}}>{f.item_name}</span>
              <span style={{fontWeight:700,color:'#B04040'}}>{f.stock} {f.unit}</span>
            </div>
          ))}
        </Card>
      )}
      <div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:'#8A7A60',marginBottom:12}}>Quick Actions · शीघ्र कार्य</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{icon:'🥛',label:'Log Milk',hi:'दूध दर्ज करें',tab:'dairy',bg:'#EEF8F2'},{icon:'📝',label:'Add Expense',hi:'खर्च जोड़ें',tab:'ledger',bg:'#FDF5E8'},{icon:'✅',label:'Add Task',hi:'काम जोड़ें',tab:'tasks',bg:'#EEF2FF'},{icon:'💉',label:'Health Log',hi:'स्वास्थ्य नोट',tab:'dairy',bg:'#FFF2F2'}].map((a,i)=>{
            const [h,setH]=useState(false)
            return (
              <button key={i} onClick={()=>nav(a.tab)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
                style={{background:a.bg,border:'1px solid rgba(60,30,0,0.07)',borderRadius:18,padding:'18px 16px',textAlign:'left',cursor:'pointer',boxShadow:h?'0 8px 24px rgba(60,30,0,0.12)':'0 2px 10px rgba(60,30,0,0.06)',transform:h?'translateY(-2px)':'none',transition:'all .18s'}}>
                <div style={{fontSize:30,marginBottom:10}}>{a.icon}</div>
                <div style={{fontSize:15,fontWeight:700,color:'#1A1008',fontFamily:"'DM Sans',sans-serif"}}>{a.label}</div>
                <div style={{fontFamily:'serif',fontSize:12,color:'#8A7A60',marginTop:3}}>{a.hi}</div>
              </button>
            )
          })}
        </div>
      </div>
      {todos.filter(t=>t.status==='pending').length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:'#8A7A60',marginBottom:10}}>Pending · लंबित काम</div>
          <Card style={{padding:'4px 18px'}}>
            {todos.filter(t=>t.status==='pending').slice(0,3).map((t,i,a)=>(
              <Row key={t.id} last={i===a.length-1}>
                <span style={{fontSize:16,flexShrink:0}}>{t.priority==='high'?'🔴':'🟡'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:'#2A1A08',lineHeight:1.35}}>{t.title}</div>
                  <div style={{fontSize:12,color:'#8A7A60',marginTop:3}}>Due {t.due_date} · {t.assigned_to}</div>
                </div>
              </Row>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

function Dairy() {
  const { cattle, addCattle }                   = useCattle()
  const { logs:milkLogs, addLog:addMilk }       = useMilkLogs()
  const { logs:healthLogs, addLog:addHealth }   = useHealthLogs()
  const { feed, addItem:addFeed }               = useFeed()
  const [sub,setSub]=useState('milk')
  const [mSh,setMSh]=useState(false)
  const [hSh,setHSh]=useState(false)
  const [fSh,setFSh]=useState(false)
  const [cSh,setCSh]=useState(false)
  const [mf,setMf]=useState({cattle_id:'',session:'morning',qty_liters:'',logged_by:'Papa',yield_date:TODAY})
  const [hf,setHf]=useState({cattle_id:'',event_type:'checkup',description:'',vet_name:'',next_due:''})
  const [ff,setFf]=useState({item_name:'',unit:'kg',stock:'',reorder_at:''})
  const [cf,setCf]=useState({name:'',tag:'',breed:'',dob:''})
  const [saving,setSaving]=useState(false)
  const [errMsg,setErrMsg]=useState('')
  const todayMilk=milkLogs.filter(l=>l.yield_date===TODAY).reduce((s,l)=>s+(l.qty_liters||0),0)
  const saveMilk=async()=>{
    if(!mf.cattle_id||!mf.qty_liters||isNaN(parseFloat(mf.qty_liters))) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await addMilk({...mf,qty_liters:parseFloat(mf.qty_liters)})
    setSaving(false)
    if(ok){setMSh(false);setMf({cattle_id:'',session:'morning',qty_liters:'',logged_by:'Papa',yield_date:TODAY})}
    else setErrMsg(error||'Failed to save milk log')
  }
  const saveHealth=async()=>{
    if(!hf.cattle_id||!hf.description) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await addHealth({...hf,log_date:TODAY})
    setSaving(false)
    if(ok){setHSh(false);setHf({cattle_id:'',event_type:'checkup',description:'',vet_name:'',next_due:''})}
    else setErrMsg(error||'Failed to save health log')
  }
  const saveFeed=async()=>{
    if(!ff.item_name) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await addFeed({...ff,stock:parseFloat(ff.stock)||0,reorder_at:parseFloat(ff.reorder_at)||0})
    setSaving(false)
    if(ok){setFSh(false);setFf({item_name:'',unit:'kg',stock:'',reorder_at:''})}
    else setErrMsg(error||'Failed to save feed item')
  }
  const saveCattle=async()=>{
    if(!cf.name) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await addCattle({...cf,status:'active'})
    setSaving(false)
    if(ok){setCSh(false);setCf({name:'',tag:'',breed:'',dob:''})}
    else setErrMsg(error||'Failed to register animal')
  }
  const onAdd=()=>{ if(sub==='milk') setMSh(true); else if(sub==='health') setHSh(true); else setFSh(true) }
  return (
    <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:'#1A1008',lineHeight:1.1}}>Dairy Tracker</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:3}}>डेयरी ट्रैकर</div>
        </div>
        <BtnGold small onClick={onAdd}>+ Add</BtnGold>
      </div>
      <SubTabs tabs={[{k:'milk',icon:'🥛',l:'Milk'},{k:'health',icon:'🩺',l:'Health'},{k:'feed',icon:'🌾',l:'Feed'}]} active={sub} setActive={setSub} />
      <div style={{overflowY:'auto',padding:'16px 20px 24px',display:'flex',flexDirection:'column',gap:10}}>
        {sub==='milk'&&<>
          <div style={{background:'linear-gradient(135deg,#FDF5E0,#F9ECC8)',borderRadius:20,padding:'18px 20px',border:'1px solid rgba(184,120,32,0.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:44,fontWeight:700,color:'#1A1008',lineHeight:1}}>{todayMilk.toFixed(1)}<span style={{fontSize:22,fontWeight:400,color:'#8A7A60'}}> L</span></div>
              <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:5}}>आज कुल दूध</div>
            </div>
            <div style={{fontSize:48,opacity:.2}}>🥛</div>
          </div>
          <Card style={{padding:'4px 18px'}}>
            {milkLogs.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'#8A7A60',fontSize:14}}>No milk logs yet. Tap + Add to start.</div>}
            {milkLogs.map((l,i)=>(
              <Row key={l.id} last={i===milkLogs.length-1}>
                <IBox bg='#EEF8F2'>🥛</IBox>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:'#1A1008'}}>{l.cattle?.name||'—'}</div>
                  <div style={{fontSize:12,color:'#8A7A60',marginTop:2}}>{l.session==='morning'?'🌅 Morning':'🌙 Evening'} · {l.yield_date} · {l.logged_by}</div>
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:700,color:'#2D8A5E'}}>{l.qty_liters}L</div>
              </Row>
            ))}
          </Card>
        </>}
        {sub==='health'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:'#8A7A60'}}>Cattle Registry · पशु सूची</div>
            <button onClick={()=>{setCf({name:'',tag:'',breed:'',dob:''});setErrMsg('');setCSh(true)}} style={{background:'#EDE6D8',border:'1px solid #DDD0BC',borderRadius:10,padding:'5px 11px',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600,color:'#6A5840'}}>+ Add Animal</button>
          </div>
          <Card style={{padding:'4px 18px'}}>
            {cattle.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'#8A7A60',fontSize:14}}>No cattle registered yet.</div>}
            {cattle.map((c,i)=>(
              <Row key={c.id} last={i===cattle.length-1}>
                <IBox bg='#EDF4EE'>🐄</IBox>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15}}>{c.name} <span style={{fontSize:12,color:'#8A7A60',fontWeight:400}}>#{c.tag}</span></div>
                  <div style={{fontSize:12,color:'#8A7A60',marginTop:2}}>{c.breed} · Born {c.dob}</div>
                </div>
                <Badge color='#2D8A5E' bg='#EEF8F2'>Active</Badge>
              </Row>
            ))}
          </Card>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:'#8A7A60',marginTop:6}}>Health Records · स्वास्थ्य रिकॉर्ड</div>
          {healthLogs.length===0&&<div style={{textAlign:'center',color:'#8A7A60',fontSize:14,padding:'10px 0'}}>No health records yet.</div>}
          {healthLogs.map(log=>{
            const ev=HEVT[log.event_type]||{icon:'📋',label:log.event_type}
            return (
              <Card key={log.id}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <IBox bg='#F5F0E8'>{ev.icon}</IBox>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15}}>{log.cattle?.name||'—'}</div>
                    <Badge color='#244D35' bg='rgba(36,77,53,0.1)'>{ev.label}</Badge>
                  </div>
                  <div style={{fontSize:12,color:'#8A7A60'}}>{log.log_date}</div>
                </div>
                <div style={{fontSize:14,color:'#3A2010',lineHeight:1.5}}>{log.description}</div>
                {log.vet_name&&<div style={{fontSize:12,color:'#8A7A60',marginTop:7}}>🩺 Dr. {log.vet_name}</div>}
                {log.next_due&&<div style={{marginTop:10,background:'#FDF5E0',borderRadius:10,padding:'7px 12px',fontSize:12,color:'#B87820',fontWeight:600}}>⏰ Next due: {log.next_due}</div>}
              </Card>
            )
          })}
        </>}
        {sub==='feed'&&feed.map(f=>{
          const pct=Math.min(100,(f.stock/(f.reorder_at*3))*100)
          const low=f.stock<=f.reorder_at
          return (
            <Card key={f.id}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{f.item_name}</div>
                  {low&&<div style={{fontSize:12,color:'#B04040',fontWeight:600,marginTop:4}}>⚠️ Reorder needed</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:low?'#B04040':'#2D8A5E'}}>{f.stock}</div>
                  <div style={{fontSize:12,color:'#8A7A60'}}>{f.unit}</div>
                </div>
              </div>
              <div style={{height:5,background:'#EDE6D8',borderRadius:3,overflow:'hidden',marginTop:10}}>
                <div style={{height:'100%',width:`${pct}%`,background:low?'#B04040':'#2D8A5E',borderRadius:3,transition:'width .5s'}} />
              </div>
              <div style={{fontSize:11,color:'#8A7A60',marginTop:6}}>Reorder at {f.reorder_at} {f.unit}</div>
            </Card>
          )
        })}
      </div>
      <Sheet open={mSh} onClose={()=>{setMSh(false);setErrMsg('')}}>
        <STitle en='Log Milk Yield' hi='दूध उत्पादन दर्ज करें' />
        <Field label='Cattle · पशु'><Sel value={mf.cattle_id} onChange={e=>setMf({...mf,cattle_id:e.target.value})}><option value=''>— Select animal —</option>{cattle.map(c=><option key={c.id} value={c.id}>{c.name} — {c.breed}</option>)}</Sel></Field>
        <Field label='Session · समय'><div style={{display:'flex',gap:8}}><TBtn label='🌅 Morning' active={mf.session==='morning'} onClick={()=>setMf({...mf,session:'morning'})} /><TBtn label='🌙 Evening' active={mf.session==='evening'} onClick={()=>setMf({...mf,session:'evening'})} /></div></Field>
        <Field label='Litres · लीटर'><Inp type='number' min='0' placeholder='e.g. 8.5' style={{fontSize:26,fontWeight:700}} value={mf.qty_liters} onChange={e=>setMf({...mf,qty_liters:e.target.value})} /></Field>
        <Field label='Logged by · किसने'><Sel value={mf.logged_by} onChange={e=>setMf({...mf,logged_by:e.target.value})}>{['Papa','Mummy','You','Farm Hand'].map(u=><option key={u}>{u}</option>)}</Sel></Field>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!mf.cattle_id||!mf.qty_liters||isNaN(parseFloat(mf.qty_liters))||saving} onClick={saveMilk}>{saving?'Saving...':'Save Entry · सहेजें'}</BtnGold>
          <BtnOutline full onClick={()=>{setMSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
      <Sheet open={hSh} onClose={()=>{setHSh(false);setErrMsg('')}}>
        <STitle en='Health Log' hi='स्वास्थ्य रिकॉर्ड' />
        <Field label='Cattle · पशु'><Sel value={hf.cattle_id} onChange={e=>setHf({...hf,cattle_id:e.target.value})}><option value=''>— Select animal —</option>{cattle.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>
        <Field label='Event Type · प्रकार'><Sel value={hf.event_type} onChange={e=>setHf({...hf,event_type:e.target.value})}>{Object.entries(HEVT).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</Sel></Field>
        <Field label='Description · विवरण'><Txta rows={3} placeholder='Describe the event...' value={hf.description} onChange={e=>setHf({...hf,description:e.target.value})} /></Field>
        <Field label='Vet Name · पशु चिकित्सक'><Inp placeholder='Dr. Mehta' value={hf.vet_name} onChange={e=>setHf({...hf,vet_name:e.target.value})} /></Field>
        <Field label='Next Due Date · अगली तारीख'><Inp type='date' value={hf.next_due} onChange={e=>setHf({...hf,next_due:e.target.value})} /></Field>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!hf.cattle_id||!hf.description||saving} onClick={saveHealth}>{saving?'Saving...':'Save · सहेजें'}</BtnGold>
          <BtnOutline full onClick={()=>{setHSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
      <Sheet open={fSh} onClose={()=>{setFSh(false);setErrMsg('')}}>
        <STitle en='Add Feed Item' hi='चारा जोड़ें' />
        <Field label='Item Name · नाम'><Inp placeholder='Mustard Cake' value={ff.item_name} onChange={e=>setFf({...ff,item_name:e.target.value})} /></Field>
        <Field label='Unit · इकाई'><Sel value={ff.unit} onChange={e=>setFf({...ff,unit:e.target.value})}>{['kg','quintal','bale','liters'].map(u=><option key={u}>{u}</option>)}</Sel></Field>
        <Field label='Current Stock · वर्तमान'><Inp type='number' min='0' placeholder='0' value={ff.stock} onChange={e=>setFf({...ff,stock:e.target.value})} /></Field>
        <Field label='Reorder Level · न्यूनतम'><Inp type='number' min='0' placeholder='0' value={ff.reorder_at} onChange={e=>setFf({...ff,reorder_at:e.target.value})} /></Field>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!ff.item_name||saving} onClick={saveFeed}>{saving?'Saving...':'Save · सहेजें'}</BtnGold>
          <BtnOutline full onClick={()=>{setFSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
      <Sheet open={cSh} onClose={()=>{setCSh(false);setErrMsg('')}}>
        <STitle en='Register Animal' hi='पशु पंजीकरण' />
        <Field label='Name · नाम'><Inp placeholder='e.g. Gauri' value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})} /></Field>
        <Field label='Tag / ID · टैग'><Inp placeholder='e.g. KF-001' value={cf.tag} onChange={e=>setCf({...cf,tag:e.target.value})} /></Field>
        <Field label='Breed · नस्ल'><Inp placeholder='e.g. HF Cross' value={cf.breed} onChange={e=>setCf({...cf,breed:e.target.value})} /></Field>
        <Field label='Date of Birth · जन्म तिथि'><Inp type='date' value={cf.dob} onChange={e=>setCf({...cf,dob:e.target.value})} /></Field>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!cf.name||saving} onClick={saveCattle}>{saving?'Saving...':'Register · पंजीकरण करें'}</BtnGold>
          <BtnOutline full onClick={()=>{setCSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
    </div>
  )
}

function Ledger() {
  const { entries, addEntry, updateEntry, deleteEntry, uploadReceipt } = useLedger()
  const { expenses:projExp } = useAllProjectExpenses()
  const [view,setView]=useState('ledger')
  const [sh,setSh]=useState(false)
  const [editSh,setEditSh]=useState(false)
  const [editEntry,setEditEntry]=useState(null)
  const [filter,setFilter]=useState('all')
  const [catFilter,setCatFilter]=useState(null)
  const [parsing,setParsing]=useState(false)
  const [saving,setSaving]=useState(false)
  const [confirmDel,setConfirmDel]=useState(false)
  const [errMsg,setErrMsg]=useState('')
  const fileRef=useRef()
  const editFileRef=useRef()
  const [form,setForm]=useState(LEDGER_INIT)

  const inc=entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0)
  const exp=entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0)
  const typeFiltered=filter==='all'?entries:entries.filter(e=>e.type===filter)
  const list=catFilter?typeFiltered.filter(e=>e.category===catFilter):typeFiltered
  const activeCats=Object.keys(CAT).filter(k=>entries.some(e=>e.category===k))
  const amountValid=!isNaN(parseFloat(form.amount))&&parseFloat(form.amount)>0

  /* ── merged list for "All Expenses" view ── */
  const mergedAll=(()=>{
    const ledgerItems=entries.map(e=>({...e,source:'ledger',_date:e.entry_date,_amount:e.amount,_desc:e.description,_party:null,_project:null,_cat:e.category}))
    const projItems=projExp.map(e=>({...e,source:'project',type:'expense',_date:e.date,_amount:e.amount,_desc:e.notes||'',_party:e.party_name,_project:e.projects?.name||'Project',_cat:e.category||'construction'}))
    const all=[...ledgerItems,...projItems].sort((a,b)=>(b._date||'').localeCompare(a._date||''))
    return all
  })()
  const mergedFiltered=filter==='all'?mergedAll:mergedAll.filter(e=>e.type===filter)
  const mergedList=catFilter?mergedFiltered.filter(e=>e._cat===catFilter):mergedFiltered
  const totalExpAll=mergedAll.filter(e=>e.type==='expense').reduce((s,e)=>s+(e._amount||0),0)
  const totalIncAll=mergedAll.filter(e=>e.type==='income').reduce((s,e)=>s+(e._amount||0),0)

  const save=async()=>{
    setSaving(true); setErrMsg('')
    const {ok,error}=await addEntry({...form,amount:parseFloat(form.amount)})
    setSaving(false)
    if(ok){setSh(false);setForm(LEDGER_INIT)}
    else setErrMsg(error||'Failed to save entry')
  }

  const openEdit=(entry)=>{
    setEditEntry(entry)
    setForm({type:entry.type,category:entry.category||'other',amount:String(entry.amount),description:entry.description||'',payment_mode:entry.payment_mode||'cash',entry_date:entry.entry_date||TODAY,logged_by:entry.logged_by||'Papa',receipt_url:entry.receipt_url||''})
    setConfirmDel(false); setErrMsg('')
    setEditSh(true)
  }

  const saveEdit=async()=>{
    if(!editEntry) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await updateEntry(editEntry.id,{...form,amount:parseFloat(form.amount)})
    setSaving(false)
    if(ok){setEditSh(false);setEditEntry(null)}
    else setErrMsg(error||'Failed to update entry')
  }

  const doDelete=async()=>{
    if(!confirmDel){setConfirmDel(true);return}
    setSaving(true); setErrMsg('')
    const {ok,error}=await deleteEntry(editEntry.id)
    setSaving(false)
    if(ok){setEditSh(false);setEditEntry(null);setConfirmDel(false)}
    else setErrMsg(error||'Failed to delete entry')
  }

  const handlePhoto=async(e,isEdit)=>{ const file=e.target.files[0]; if(!file) return; setParsing(true); const url=await uploadReceipt(file); setForm(f=>({...f,receipt_url:url||''})); setParsing(false); if(!isEdit) setSh(true) }

  const formFields=()=>(
    <>
      <Field label='Type · प्रकार'><div style={{display:'flex',gap:8}}><TBtn label='↑ Income' active={form.type==='income'} onClick={()=>setForm({...form,type:'income'})} activeColor='#2D8A5E' activeBg='#EEF8F2' /><TBtn label='↓ Expense' active={form.type==='expense'} onClick={()=>setForm({...form,type:'expense'})} activeColor='#B04040' activeBg='#FFF5F5' /></div></Field>
      <Field label='Category · श्रेणी'><div style={{display:'flex',flexWrap:'wrap',gap:7}}>{Object.entries(CAT).map(([k,v])=><button key={k} onClick={()=>setForm({...form,category:k})} style={{padding:'8px 13px',borderRadius:10,border:`1.5px solid ${form.category===k?v.color:'#DDD0BC'}`,background:form.category===k?v.color+'18':'transparent',color:form.category===k?v.color:'#6A5840',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:14,cursor:'pointer',transition:'all .15s'}}>{v.icon} {v.label}</button>)}</div></Field>
      <Field label='Amount · राशि (₹)'><Inp type='number' placeholder='0' style={{fontSize:26,fontWeight:700}} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></Field>
      <Field label='Description · विवरण'><Inp placeholder='What was this for?' value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></Field>
      <Field label='Date · तारीख'><Inp type='date' value={form.entry_date} onChange={e=>setForm({...form,entry_date:e.target.value})} /></Field>
      <div style={{display:'flex',gap:10}}>
        <Field label='Payment'><Sel value={form.payment_mode} onChange={e=>setForm({...form,payment_mode:e.target.value})} style={{fontSize:15}}>{['cash','upi','bank','credit'].map(p=><option key={p}>{p}</option>)}</Sel></Field>
        <Field label='Logged by'><Sel value={form.logged_by} onChange={e=>setForm({...form,logged_by:e.target.value})} style={{fontSize:15}}>{['Papa','Mummy','You','Farm Hand'].map(u=><option key={u}>{u}</option>)}</Sel></Field>
      </div>
      {form.receipt_url&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60',marginBottom:7}}>Receipt Photo</div><img src={form.receipt_url} alt='receipt' style={{width:80,height:80,objectFit:'cover',borderRadius:10,border:'1.5px solid #DDD0BC'}} /></div>}
    </>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:'#1A1008'}}>Ledger</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:3}}>बही-खाता</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>fileRef.current?.click()} style={{background:'#EDE6D8',border:'1px solid #DDD0BC',borderRadius:12,padding:'10px 14px',fontSize:20,cursor:'pointer'}}>{parsing?'⏳':'📷'}</button>
          <input ref={fileRef} type='file' accept='image/*' capture='environment' style={{display:'none'}} onChange={e=>handlePhoto(e,false)} />
          <BtnGold small onClick={()=>{setForm(LEDGER_INIT);setSh(true)}}>+ Add</BtnGold>
        </div>
      </div>
      {/* ── View toggle ── */}
      <div style={{display:'flex',gap:4,background:'#EDE6D8',borderRadius:16,padding:5,margin:'12px 20px 0',border:'1px solid #DDD0BC'}}>
        {[['ledger','📒 Ledger'],['all_expenses','📊 All Expenses']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{flex:1,padding:'11px 6px',border:'none',borderRadius:11,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:'pointer',transition:'all .2s',background:view===k?'#fff':'transparent',color:view===k?'#1A1008':'#8A7A60',boxShadow:view===k?'0 2px 10px rgba(60,30,0,0.1)':'none'}}>{l}</button>
        ))}
      </div>

      {view==='ledger' ? (
      <div style={{overflowY:'auto',padding:'16px 20px 24px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:10}}>
          {[{lbl:'INCOME',hi:'कुल आय',val:fmt(inc),c:'#2D8A5E',bg:'#EEF8F2',border:'#C6E8D4'},{lbl:'EXPENSE',hi:'कुल खर्च',val:fmt(exp),c:'#B04040',bg:'#FFF5F5',border:'#F5D0D0'}].map((s,i)=>(
            <div key={i} style={{flex:1,background:s.bg,borderRadius:16,padding:'14px 16px',border:`1px solid ${s.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:s.c,letterSpacing:1}}>{s.lbl}</div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:700,color:'#1A1008',marginTop:4}}>{s.val}</div>
              <div style={{fontFamily:'serif',fontSize:11,color:'#8A7A60',marginTop:3}}>{s.hi}</div>
            </div>
          ))}
        </div>
        <div style={{background:'linear-gradient(135deg,#FDF5E0,#F9ECC8)',borderRadius:16,padding:'14px 18px',border:'1px solid rgba(184,120,32,0.2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#B87820',letterSpacing:1}}>NET BALANCE · शुद्ध बचत</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:inc-exp>=0?'#2D8A5E':'#B04040'}}>{fmt(inc-exp)}</div>
        </div>
        {parsing&&<Card style={{textAlign:'center',padding:20}}><div style={{fontSize:28,marginBottom:8}}>🤖</div><div style={{fontWeight:600}}>Uploading photo...</div></Card>}
        <div style={{display:'flex',gap:4,background:'#EDE6D8',borderRadius:14,padding:4,border:'1px solid #DDD0BC'}}>
          {[['all','All'],['income','↑ Income'],['expense','↓ Expense']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{flex:1,padding:'10px',border:'none',borderRadius:10,cursor:'pointer',background:filter===k?'#fff':'transparent',color:filter===k?'#1A1008':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,boxShadow:filter===k?'0 2px 8px rgba(60,30,0,0.1)':'none',transition:'all .18s'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none',msOverflowStyle:'none'}}>
          <button onClick={()=>setCatFilter(null)} style={{flexShrink:0,padding:'6px 13px',borderRadius:20,border:`1.5px solid ${!catFilter?'#B87820':'#DDD0BC'}`,background:!catFilter?'rgba(184,120,32,0.1)':'transparent',color:!catFilter?'#B87820':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s'}}>All Categories</button>
          {Object.keys(CAT).map(k=>{
            const cat=CAT[k]; const active=catFilter===k; const hasEntries=activeCats.includes(k)
            return <button key={k} onClick={()=>setCatFilter(active?null:k)} style={{flexShrink:0,padding:'6px 12px',borderRadius:20,border:`1.5px solid ${active?cat.color:'#DDD0BC'}`,background:active?cat.color+'18':'transparent',color:active?cat.color:hasEntries?'#3A2A10':'#B0A090',fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',opacity:hasEntries?1:0.55}}>{cat.icon} {cat.label}</button>
          })}
        </div>
        <Card style={{padding:'4px 18px'}}>
          {list.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'#8A7A60',fontSize:14}}>No entries yet.</div>}
          {list.map((e,i)=>{
            const cat=CAT[e.category]||CAT.other
            return (
              <Row key={e.id} last={i===list.length-1}>
                <IBox bg={cat.color+'18'}>{cat.icon}</IBox>
                {e.receipt_url&&<img src={e.receipt_url} alt='' style={{width:36,height:36,objectFit:'cover',borderRadius:8,flexShrink:0,border:'1px solid #DDD0BC'}} />}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#1A1008'}}>{cat.icon} {e.description}</div>
                  <div style={{fontSize:12,color:'#8A7A60',marginTop:2}}>{cat.hi} · {e.entry_date} · {e.logged_by}</div>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:e.type==='income'?'#2D8A5E':'#B04040',flexShrink:0}}>{e.type==='income'?'+':'−'}{fmt(e.amount)}</div>
                <button onClick={()=>openEdit(e)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',fontSize:16,flexShrink:0,borderRadius:8,lineHeight:1,color:'#8A7A60'}}>✏️</button>
              </Row>
            )
          })}
        </Card>
      </div>
      ) : (
      /* ── All Expenses consolidated view ── */
      <div style={{overflowY:'auto',padding:'16px 20px 24px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:10}}>
          {[{lbl:'TOTAL EXPENSES',hi:'कुल खर्च',val:fmt(totalExpAll),c:'#B04040',bg:'#FFF5F5',border:'#F5D0D0'},{lbl:'TOTAL INCOME',hi:'कुल आय',val:fmt(totalIncAll),c:'#2D8A5E',bg:'#EEF8F2',border:'#C6E8D4'}].map((s,i)=>(
            <div key={i} style={{flex:1,background:s.bg,borderRadius:16,padding:'14px 16px',border:`1px solid ${s.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:s.c,letterSpacing:1}}>{s.lbl}</div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:700,color:'#1A1008',marginTop:4}}>{s.val}</div>
              <div style={{fontFamily:'serif',fontSize:11,color:'#8A7A60',marginTop:3}}>{s.hi}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:4,background:'#EDE6D8',borderRadius:14,padding:4,border:'1px solid #DDD0BC'}}>
          {[['all','All'],['income','↑ Income'],['expense','↓ Expense']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{flex:1,padding:'10px',border:'none',borderRadius:10,cursor:'pointer',background:filter===k?'#fff':'transparent',color:filter===k?'#1A1008':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,boxShadow:filter===k?'0 2px 8px rgba(60,30,0,0.1)':'none',transition:'all .18s'}}>{l}</button>
          ))}
        </div>
        <Card style={{padding:'4px 18px'}}>
          {mergedList.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'#8A7A60',fontSize:14}}>No entries yet.</div>}
          {mergedList.map((e,i)=>{
            const cat=CAT[e._cat]||CAT.other
            const isProj=e.source==='project'
            return (
              <Row key={`${e.source}-${e.id}`} last={i===mergedList.length-1}>
                <IBox bg={isProj?'#8B691418':cat.color+'18'}>{isProj?'🏗️':cat.icon}</IBox>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#1A1008'}}>{isProj?(e._party||e._project):e._desc}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:3,alignItems:'center'}}>
                    {isProj?<span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,color:'#8B6914',background:'#fdf3dc',gap:3}}>🏗️ {e._project}</span>
                           :<span style={{fontSize:12,color:'#8A7A60'}}>{cat.icon} {cat.label}</span>}
                    <span style={{fontSize:11,color:'#B0A090'}}>{e._date}</span>
                    {isProj&&e._desc&&<span style={{fontSize:11,color:'#B0A090'}}>· {e._desc}</span>}
                  </div>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:e.type==='income'?'#2D8A5E':'#B04040',flexShrink:0}}>{e.type==='income'?'+':'−'}{fmt(e._amount)}</div>
              </Row>
            )
          })}
        </Card>
      </div>
      )}
      <Sheet open={sh} onClose={()=>{setSh(false);setErrMsg('')}}>
        <STitle en='New Ledger Entry' hi='नई एंट्री दर्ज करें' />
        {formFields()}
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!amountValid||!form.description||saving} onClick={save}>{saving?'Saving...':'Save Entry · सहेजें'}</BtnGold>
          <BtnOutline full onClick={()=>{setSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
      <Sheet open={editSh} onClose={()=>{setEditSh(false);setConfirmDel(false);setErrMsg('')}}>
        <STitle en='Edit Entry' hi='एंट्री बदलें' />
        {formFields()}
        <div style={{marginBottom:12}}>
          <button onClick={()=>editFileRef.current?.click()} style={{background:'#EDE6D8',border:'1px solid #DDD0BC',borderRadius:10,padding:'8px 14px',fontSize:14,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600,color:'#6A5840'}}>{parsing?'⏳':'📷'} {form.receipt_url?'Replace Photo':'Add Photo'}</button>
          <input ref={editFileRef} type='file' accept='image/*' capture='environment' style={{display:'none'}} onChange={e=>handlePhoto(e,true)} />
        </div>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:8}}>
          <BtnGold full disabled={!amountValid||!form.description||saving} onClick={saveEdit}>{saving?'Saving...':'Update Entry · अपडेट करें'}</BtnGold>
          <button onClick={doDelete} style={{width:'100%',marginTop:10,padding:'14px',borderRadius:14,border:`1.5px solid ${confirmDel?'#B04040':'#F5D0D0'}`,background:confirmDel?'#FFF5F5':'transparent',color:'#B04040',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:'pointer',transition:'all .18s'}}>{confirmDel?'⚠️ Confirm Delete?':'🗑️ Delete Entry'}</button>
          <BtnOutline full onClick={()=>{setEditSh(false);setConfirmDel(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
    </div>
  )
}

function Tasks() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodos()
  const [sh,setSh]=useState(false)
  const [editSh,setEditSh]=useState(false)
  const [editTodo,setEditTodo]=useState(null)
  const [filter,setFilter]=useState('pending')
  const [saving,setSaving]=useState(false)
  const [confirmDel,setConfirmDel]=useState(false)
  const [errMsg,setErrMsg]=useState('')
  const [form,setForm]=useState(TASK_INIT)

  const filtered=filter==='all'?todos:todos.filter(t=>t.status===filter)
  const pend=todos.filter(t=>t.status==='pending').length

  const save=async()=>{
    if(!form.title) return
    setSaving(true); setErrMsg('')
    const {ok,error}=await addTodo(form)
    setSaving(false)
    if(ok){setSh(false);setForm(TASK_INIT)}
    else setErrMsg(error||'Failed to add task')
  }

  const openEdit=(todo)=>{
    setEditTodo(todo)
    setForm({title:todo.title,due_date:todo.due_date||'',priority:todo.priority||'medium',assigned_to:todo.assigned_to||'Papa',created_by:todo.created_by||'You'})
    setConfirmDel(false); setErrMsg('')
    setEditSh(true)
  }

  const saveEdit=async()=>{
    if(!editTodo) return
    setSaving(true); setErrMsg('')
    // Destructure only the allowed fields — status is intentionally excluded
    // so editing a task never changes its done/pending state
    const {title,due_date,priority,assigned_to}=form
    const {ok,error}=await updateTodo(editTodo.id,{title,due_date,priority,assigned_to})
    setSaving(false)
    if(ok){setEditSh(false);setEditTodo(null)}
    else setErrMsg(error||'Failed to update task')
  }

  const doDelete=async()=>{
    if(!confirmDel){setConfirmDel(true);return}
    setSaving(true); setErrMsg('')
    const {ok,error}=await deleteTodo(editTodo.id)
    setSaving(false)
    if(ok){setEditSh(false);setEditTodo(null);setConfirmDel(false)}
    else setErrMsg(error||'Failed to delete task')
  }

  const taskFormFields=()=>(
    <>
      <Field label='Task · काम'><Inp placeholder='e.g. Call the vet for Gauri' value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></Field>
      <Field label='Due Date · तारीख'><Inp type='date' value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></Field>
      <Field label='Priority · प्राथमिकता'><div style={{display:'flex',gap:8}}><TBtn label='🔴 High' active={form.priority==='high'} onClick={()=>setForm({...form,priority:'high'})} activeColor='#B04040' activeBg='#FFF5F5' /><TBtn label='🟡 Medium' active={form.priority==='medium'} onClick={()=>setForm({...form,priority:'medium'})} activeColor='#B87820' activeBg='#FDF5E0' /><TBtn label='🟢 Low' active={form.priority==='low'} onClick={()=>setForm({...form,priority:'low'})} activeColor='#2D8A5E' activeBg='#EEF8F2' /></div></Field>
      <Field label='Assign to · सौंपें'><Sel value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} style={{fontSize:15}}>{['Papa','Mummy','You','Farm Hand'].map(u=><option key={u}>{u}</option>)}</Sel></Field>
    </>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:'#1A1008'}}>Tasks</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:3}}>काम की सूची</div>
        </div>
        <BtnGold small onClick={()=>{setForm(TASK_INIT);setSh(true)}}>+ Add</BtnGold>
      </div>
      <div style={{overflowY:'auto',padding:'16px 20px 24px',display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'linear-gradient(150deg,#1A3D28,#245A36)',borderRadius:20,padding:'20px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-20,right:-20,width:120,height:120,background:'radial-gradient(circle,rgba(184,120,32,.2) 0%,transparent 70%)',borderRadius:'50%'}} />
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:48,fontWeight:700,color:'#FFF8EE',lineHeight:1}}>{pend}</div>
            <div style={{fontSize:13,color:'rgba(255,248,238,.5)',marginTop:5}}>tasks pending</div>
            <div style={{fontFamily:'serif',fontSize:12,color:'rgba(255,248,238,.3)',marginTop:3}}>लंबित काम</div>
          </div>
          <div style={{fontSize:60,opacity:.18}}>✅</div>
        </div>
        <div style={{display:'flex',gap:4,background:'#EDE6D8',borderRadius:14,padding:4,border:'1px solid #DDD0BC'}}>
          {[['all','All'],['pending','Pending'],['done','✓ Done']].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{flex:1,padding:'10px',border:'none',borderRadius:10,cursor:'pointer',background:filter===k?'#fff':'transparent',color:filter===k?'#1A1008':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,boxShadow:filter===k?'0 2px 8px rgba(60,30,0,0.1)':'none',transition:'all .18s'}}>{l}</button>
          ))}
        </div>
        {filtered.length===0?(
          <div style={{textAlign:'center',padding:'50px 20px'}}>
            <div style={{fontSize:50,opacity:.3,marginBottom:14}}>🎉</div>
            <div style={{fontSize:18,fontWeight:700,color:'#8A7A60'}}>All done!</div>
            <div style={{fontFamily:'serif',fontSize:14,color:'#8A7A60',opacity:.6,marginTop:5}}>सब काम हो गया!</div>
          </div>
        ):(
          filtered.map(t=>(
            <Card key={t.id} style={{opacity:t.status==='done'?.6:1,padding:'16px 18px'}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <button onClick={()=>toggleTodo(t.id,t.status)} style={{width:28,height:28,borderRadius:'50%',flexShrink:0,marginTop:1,border:`2px solid ${t.status==='done'?'#2D8A5E':'#DDD0BC'}`,background:t.status==='done'?'#2D8A5E':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',transition:'all .18s'}}>{t.status==='done'?'✓':''}</button>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:600,color:'#1A1008',textDecoration:t.status==='done'?'line-through':'none',lineHeight:1.4}}>{t.title}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                    {t.due_date&&<Badge color='#2E6FA8' bg='#EEF2FF'>📅 {t.due_date}</Badge>}
                    <Badge color={t.priority==='high'?'#B04040':t.priority==='medium'?'#B87820':'#2D8A5E'} bg={t.priority==='high'?'#FFF5F5':t.priority==='medium'?'#FDF5E0':'#EEF8F2'}>{t.priority==='high'?'🔴':t.priority==='medium'?'🟡':'🟢'} {t.priority}</Badge>
                    <Badge color='#6A5840' bg='#F0E8DA'>👤 {t.assigned_to}</Badge>
                  </div>
                </div>
                <button onClick={()=>openEdit(t)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',fontSize:16,flexShrink:0,borderRadius:8,lineHeight:1,color:'#8A7A60',marginTop:-2}}>✏️</button>
              </div>
            </Card>
          ))
        )}
      </div>
      <Sheet open={sh} onClose={()=>{setSh(false);setErrMsg('')}}>
        <STitle en='New Task' hi='नया काम जोड़ें' />
        {taskFormFields()}
        <Field label='Created by'><Sel value={form.created_by} onChange={e=>setForm({...form,created_by:e.target.value})} style={{fontSize:15}}>{['Papa','Mummy','You'].map(u=><option key={u}>{u}</option>)}</Sel></Field>
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:16}}>
          <BtnGold full disabled={!form.title||saving} onClick={save}>{saving?'Adding...':'Add Task · जोड़ें'}</BtnGold>
          <BtnOutline full onClick={()=>{setSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
      <Sheet open={editSh} onClose={()=>{setEditSh(false);setConfirmDel(false);setErrMsg('')}}>
        <STitle en='Edit Task' hi='काम बदलें' />
        {taskFormFields()}
        {errMsg&&<div style={{background:'#FFF5F5',border:'1px solid #F5D0D0',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#B04040',marginBottom:12}}>⚠️ {errMsg}</div>}
        <div style={{marginTop:16}}>
          <BtnGold full disabled={!form.title||saving} onClick={saveEdit}>{saving?'Saving...':'Update Task · अपडेट करें'}</BtnGold>
          <button onClick={doDelete} style={{width:'100%',marginTop:10,padding:'14px',borderRadius:14,border:`1.5px solid ${confirmDel?'#B04040':'#F5D0D0'}`,background:confirmDel?'#FFF5F5':'transparent',color:'#B04040',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:'pointer',transition:'all .18s'}}>{confirmDel?'⚠️ Confirm Delete?':'🗑️ Delete Task'}</button>
          <BtnOutline full onClick={()=>{setEditSh(false);setConfirmDel(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
        </div>
      </Sheet>
    </div>
  )
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [tab,setTab]=useState('home')
  const isDesktop = useWindowSize()

  if (loading) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#F7F1E8',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{fontSize:48,marginBottom:16}}>🐄</div>
        <div style={{fontSize:16,color:'#8A7A60'}}>Loading Kaaya Farms...</div>
      </div>
    )
  }
  if (!user) return <Login />

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#F7F1E8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
    @keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(95,212,160,.5)}60%{box-shadow:0 0 0 5px rgba(95,212,160,0)}}
    ::-webkit-scrollbar{width:0}
  `

  /* ── DESKTOP layout: sidebar + full-width content ── */
  if (isDesktop) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{display:'flex',height:'100vh',width:'100%',overflow:'hidden'}}>
          <Sidebar tab={tab} setTab={setTab} onSignOut={signOut} />
          <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:'#F7F1E8'}}>
            {tab==='home'     && <Home     nav={setTab} />}
            {tab==='dairy'    && <Dairy    />}
            {tab==='ledger'   && <Ledger   />}
            {tab==='projects' && <Projects />}
            {tab==='reports'  && <Reports  />}
            {tab==='tasks'    && <Tasks    />}
          </div>
        </div>
      </>
    )
  }

  /* ── MOBILE layout: unchanged ── */
  return (
    <>
      <style>{globalStyles}</style>
      <div style={{maxWidth:460,margin:'0 auto',height:'100vh',display:'flex',flexDirection:'column',background:'#F7F1E8',overflow:'hidden',boxShadow:'0 0 60px rgba(0,0,0,0.15)'}}>
        <Header onSignOut={signOut} />
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          {tab==='home'     && <Home     nav={setTab} />}
          {tab==='dairy'    && <Dairy    />}
          {tab==='ledger'   && <Ledger   />}
          {tab==='projects' && <Projects />}
          {tab==='reports'  && <Reports  />}
          {tab==='tasks'    && <Tasks    />}
        </div>
        <Nav tab={tab} setTab={setTab} />
      </div>
    </>
  )
}