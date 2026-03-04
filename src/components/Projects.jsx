import { useState } from 'react'
import { useProjects, useProjectExpenses } from '../hooks'

const TODAY = new Date().toISOString().split('T')[0]
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

const EXPENSE_CATS = {
  construction: { icon:'🏗️', label:'Construction' },
  labour:       { icon:'👷', label:'Labour'       },
  transport:    { icon:'🚛', label:'Transport'    },
  equipment:    { icon:'🔧', label:'Equipment'    },
  dairy_feed:   { icon:'🥛', label:'Dairy & Feed' },
  utilities:    { icon:'⚡', label:'Utilities'    },
  other:        { icon:'📌', label:'Other'        },
}

const STATUS_BADGE = {
  active:    { color:'#2d8a5e', bg:'#e6f4ec', label:'Active'    },
  completed: { color:'#8B6914', bg:'#fdf3dc', label:'Completed' },
  paused:    { color:'#b04040', bg:'#fce8e8', label:'Paused'    },
}

/* ── shared tiny components (match App.jsx styling) ── */
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
function Field({ label, children }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60',marginBottom:7}}>{label}</div>
      {children}
    </div>
  )
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

const EXP_INIT = { party_name:'', amount:'', date:TODAY, payment_mode:'cash', notes:'', category:'construction' }

/* ── Project Detail (expenses list + add form) ── */
function ProjectDetail({ project, onBack }) {
  const { expenses, loading, addExpense } = useProjectExpenses(project.id)
  const [sh,setSh]=useState(false)
  const [form,setForm]=useState(EXP_INIT)
  const [saving,setSaving]=useState(false)
  const [errMsg,setErrMsg]=useState('')

  const spent = expenses.reduce((s,e)=>s+(e.amount||0),0)
  const pct = project.budget > 0 ? Math.min((spent/project.budget)*100,100) : 0
  const amountValid = !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0

  const save = async () => {
    setSaving(true); setErrMsg('')
    const { ok, error } = await addExpense({ ...form, amount: parseFloat(form.amount) })
    setSaving(false)
    if (ok) { setSh(false); setForm(EXP_INIT) }
    else setErrMsg(error || 'Failed to save expense')
  }

  return (
    <div style={{overflowY:'auto',padding:'18px 20px 24px',display:'flex',flexDirection:'column',gap:14}}>
      {/* Back + Title */}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} style={{background:'#F0EAD8',border:'none',borderRadius:12,width:40,height:40,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:700,color:'#1A1008'}}>{project.name}</div>
          {project.description && <div style={{fontSize:13,color:'#8A7A60',marginTop:2}}>{project.description}</div>}
        </div>
        <div style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,...(STATUS_BADGE[project.status]||STATUS_BADGE.active),background:(STATUS_BADGE[project.status]||STATUS_BADGE.active).bg,color:(STATUS_BADGE[project.status]||STATUS_BADGE.active).color}}>
          {(STATUS_BADGE[project.status]||STATUS_BADGE.active).label}
        </div>
      </div>

      {/* Budget card */}
      <div style={{background:'#fff',borderRadius:20,padding:18,border:'1px solid rgba(60,30,0,0.07)',boxShadow:'0 2px 16px rgba(60,30,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60'}}>Budget</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:'#1A1008'}}>{fmt(project.budget||0)}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60'}}>Spent</div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:pct>90?'#b04040':'#2d8a5e'}}>{fmt(spent)}</div>
          </div>
        </div>
        <div style={{background:'#F0EAD8',borderRadius:8,height:10,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:8,background:pct>90?'#b04040':pct>70?'#CF8A1C':'#2d8a5e',width:`${pct}%`,transition:'width .4s'}} />
        </div>
        <div style={{fontSize:12,color:'#8A7A60',marginTop:6,textAlign:'right'}}>{pct.toFixed(1)}% used</div>
      </div>

      {/* Add expense button */}
      <BtnGold full onClick={()=>setSh(true)}>+ Add Expense</BtnGold>

      {/* Expenses list */}
      <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,fontWeight:700,color:'#1A1008',marginTop:4}}>Expenses</div>
      {loading ? <div style={{textAlign:'center',padding:24,color:'#8A7A60'}}>Loading...</div> :
       expenses.length===0 ? <div style={{textAlign:'center',padding:32,color:'#B0A090',fontSize:14}}>No expenses yet</div> :
       <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {expenses.map(e=>{
          const cat = EXPENSE_CATS[e.category] || EXPENSE_CATS.other
          return (
            <div key={e.id} style={{background:'#fff',borderRadius:16,padding:'14px 16px',border:'1px solid rgba(60,30,0,0.07)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:42,height:42,borderRadius:12,background:'#F0EAD8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{cat.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:600,color:'#1A1008',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.party_name||'—'}</div>
                <div style={{fontSize:12,color:'#8A7A60',marginTop:2}}>{e.date} · {e.payment_mode} {e.notes ? `· ${e.notes}` : ''}</div>
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:20,fontWeight:700,color:'#b04040',flexShrink:0}}>{fmt(e.amount)}</div>
            </div>
          )
        })}
       </div>
      }

      {/* Add Expense Sheet */}
      <Sheet open={sh} onClose={()=>{setSh(false);setErrMsg('')}}>
        <div style={{marginBottom:22}}>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:'#1A1008',lineHeight:1.1}}>Add Expense</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:4}}>खर्च जोड़ें</div>
        </div>
        {errMsg && <div style={{background:'#fce8e8',color:'#b04040',padding:'10px 14px',borderRadius:12,fontSize:13,marginBottom:12}}>{errMsg}</div>}
        <Field label="Party Name"><Inp value={form.party_name} onChange={e=>setForm({...form,party_name:e.target.value})} placeholder="e.g. Rajesh Mistri" /></Field>
        <Field label="Amount (₹)"><Inp type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" /></Field>
        <Field label="Date"><Inp type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
        <Field label="Payment Mode">
          <div style={{display:'flex',gap:6}}>
            {['cash','upi','bank'].map(m=>(
              <button key={m} onClick={()=>setForm({...form,payment_mode:m})} style={{flex:1,padding:'11px 8px',borderRadius:12,border:`2px solid ${form.payment_mode===m?'#B87820':'#DDD0BC'}`,background:form.payment_mode===m?'rgba(184,120,32,0.1)':'transparent',color:form.payment_mode===m?'#B87820':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:'pointer',textTransform:'capitalize'}}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Category">
          <Sel value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {Object.entries(EXPENSE_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </Sel>
        </Field>
        <Field label="Notes"><Txta rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes..." /></Field>
        <BtnGold full disabled={!amountValid||saving} onClick={save}>{saving?'Saving...':'Save Expense'}</BtnGold>
        <BtnOutline full onClick={()=>{setSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
      </Sheet>
    </div>
  )
}

/* ── Main Projects page ── */
export default function Projects() {
  const { projects, loading, addProject } = useProjects()
  const [selected,setSelected]=useState(null)
  const [sh,setSh]=useState(false)
  const [form,setForm]=useState({ name:'', description:'', budget:'', start_date:TODAY, status:'active' })
  const [saving,setSaving]=useState(false)
  const [errMsg,setErrMsg]=useState('')

  if (selected) {
    const proj = projects.find(p=>p.id===selected)
    if (proj) return <ProjectDetail project={proj} onBack={()=>setSelected(null)} />
  }

  const save = async () => {
    setSaving(true); setErrMsg('')
    const budget = parseFloat(form.budget) || 0
    const { ok, error } = await addProject({ ...form, budget })
    setSaving(false)
    if (ok) { setSh(false); setForm({ name:'', description:'', budget:'', start_date:TODAY, status:'active' }) }
    else setErrMsg(error || 'Failed to create project')
  }

  return (
    <div style={{overflowY:'auto',padding:'18px 20px 24px',display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:'#1A1008'}}>Projects</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:2}}>परियोजनाएँ</div>
        </div>
        <BtnGold small onClick={()=>setSh(true)}>+ New</BtnGold>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:'#8A7A60'}}>Loading...</div> :
       projects.length===0 ? <div style={{textAlign:'center',padding:40,color:'#B0A090',fontSize:15}}>No projects yet. Create one!</div> :
       <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {projects.map(p=><ProjectCard key={p.id} project={p} onClick={()=>setSelected(p.id)} />)}
       </div>
      }

      {/* New Project Sheet */}
      <Sheet open={sh} onClose={()=>{setSh(false);setErrMsg('')}}>
        <div style={{marginBottom:22}}>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:26,fontWeight:700,color:'#1A1008',lineHeight:1.1}}>New Project</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:4}}>नई परियोजना</div>
        </div>
        {errMsg && <div style={{background:'#fce8e8',color:'#b04040',padding:'10px 14px',borderRadius:12,fontSize:13,marginBottom:12}}>{errMsg}</div>}
        <Field label="Project Name"><Inp value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Cowshed Extension" /></Field>
        <Field label="Description"><Txta rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional..." /></Field>
        <Field label="Budget (₹)"><Inp type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} placeholder="0" /></Field>
        <Field label="Start Date"><Inp type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} /></Field>
        <Field label="Status">
          <div style={{display:'flex',gap:6}}>
            {['active','paused','completed'].map(s=>(
              <button key={s} onClick={()=>setForm({...form,status:s})} style={{flex:1,padding:'11px 8px',borderRadius:12,border:`2px solid ${form.status===s?'#B87820':'#DDD0BC'}`,background:form.status===s?'rgba(184,120,32,0.1)':'transparent',color:form.status===s?'#B87820':'#8A7A60',fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,cursor:'pointer',textTransform:'capitalize'}}>{s}</button>
            ))}
          </div>
        </Field>
        <BtnGold full disabled={!form.name.trim()||saving} onClick={save}>{saving?'Creating...':'Create Project'}</BtnGold>
        <BtnOutline full onClick={()=>{setSh(false);setErrMsg('')}} style={{marginTop:10}}>Cancel</BtnOutline>
      </Sheet>
    </div>
  )
}

/* ── Project Card ── */
function ProjectCard({ project, onClick }) {
  const { expenses } = useProjectExpenses(project.id)
  const spent = expenses.reduce((s,e)=>s+(e.amount||0),0)
  const pct = project.budget > 0 ? Math.min((spent/project.budget)*100,100) : 0
  const badge = STATUS_BADGE[project.status] || STATUS_BADGE.active
  const [h,setH]=useState(false)

  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?'#FEFAF4':'#fff',borderRadius:20,padding:18,border:'1px solid rgba(60,30,0,0.07)',boxShadow:h?'0 4px 20px rgba(60,30,0,0.1)':'0 2px 16px rgba(60,30,0,0.06)',cursor:'pointer',transition:'all .18s'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:42,height:42,borderRadius:14,background:'linear-gradient(135deg,#CF8A1C,#B87820)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',flexShrink:0}}>🏗️</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:'#1A1008',fontFamily:"'DM Sans',sans-serif"}}>{project.name}</div>
            {project.description && <div style={{fontSize:12,color:'#8A7A60',marginTop:2,maxWidth:200,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{project.description}</div>}
          </div>
        </div>
        <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,color:badge.color,background:badge.bg}}>{badge.label}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#8A7A60',marginBottom:8}}>
        <span>Budget: {fmt(project.budget||0)}</span>
        <span>Spent: {fmt(spent)}</span>
      </div>
      <div style={{background:'#F0EAD8',borderRadius:6,height:8,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:6,background:pct>90?'#b04040':pct>70?'#CF8A1C':'#2d8a5e',width:`${pct}%`,transition:'width .4s'}} />
      </div>
      <div style={{fontSize:11,color:'#B0A090',marginTop:4,textAlign:'right'}}>{pct.toFixed(1)}%</div>
    </div>
  )
}
