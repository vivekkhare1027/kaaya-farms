import { useState, useMemo } from 'react'
import { useLedger, useProjects, useAllProjectExpenses } from '../hooks'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const NOW = new Date()

const CAT = {
  dairy_feed:   { icon:'🥛', label:'Dairy & Feed',   color:'#2d8a5e' },
  construction: { icon:'🏗️', label:'Construction',   color:'#8B6914' },
  transport:    { icon:'🚛', label:'Transport',       color:'#2e6fa8' },
  labour:       { icon:'👷', label:'Labour',          color:'#b5721a' },
  medicine:     { icon:'💊', label:'Medicine & Vet',  color:'#b04040' },
  utilities:    { icon:'⚡', label:'Utilities',       color:'#6b5ba8' },
  grocery:      { icon:'🛒', label:'Grocery',         color:'#a04878' },
  equipment:    { icon:'🔧', label:'Equipment',       color:'#5a7050' },
  milk_sale:    { icon:'🥛', label:'Milk Sale',       color:'#2d8a5e' },
  other:        { icon:'📌', label:'Other',           color:'#7a7870' },
}

const STATUS_BADGE = {
  active:    { color:'#2d8a5e', bg:'#e6f4ec', label:'Active'    },
  completed: { color:'#8B6914', bg:'#fdf3dc', label:'Completed' },
  paused:    { color:'#b04040', bg:'#fce8e8', label:'Paused'    },
}

function Card({ children, style={} }) {
  return <div style={{background:'#fff',borderRadius:20,padding:18,border:'1px solid rgba(60,30,0,0.07)',boxShadow:'0 2px 16px rgba(60,30,0,0.06), 0 1px 4px rgba(60,30,0,0.06)',...style}}>{children}</div>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'#FEFAF4',border:'1px solid #DDD0BC',borderRadius:10,padding:'8px 12px',fontSize:13,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 12px rgba(60,30,0,0.12)'}}>
      <div style={{fontWeight:700,color:'#1A1008'}}>{label}</div>
      <div style={{color:'#B04040',marginTop:2}}>{fmt(payload[0].value)}</div>
    </div>
  )
}

export default function Reports() {
  const { entries } = useLedger()
  const { projects } = useProjects()
  const { expenses: projExp } = useAllProjectExpenses()
  const [year, setYear] = useState(NOW.getFullYear())

  // All ledger expenses for the selected year (includes mirrored project expenses)
  const yearExpenses = useMemo(() =>
    entries.filter(e => e.type === 'expense' && e.entry_date?.startsWith(String(year))),
    [entries, year]
  )

  // Available years from data
  const years = useMemo(() => {
    const ySet = new Set()
    entries.forEach(e => { if (e.entry_date) ySet.add(parseInt(e.entry_date.substring(0, 4))) })
    projExp.forEach(e => { if (e.date) ySet.add(parseInt(e.date.substring(0, 4))) })
    if (ySet.size === 0) ySet.add(NOW.getFullYear())
    return [...ySet].sort((a, b) => b - a)
  }, [entries, projExp])

  // ─── A) Monthly bar data ───
  const monthlyData = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0)
    yearExpenses.forEach(e => {
      const m = parseInt(e.entry_date.substring(5, 7)) - 1
      buckets[m] += e.amount || 0
    })
    return MONTHS.map((name, i) => ({ name, amount: buckets[i], isCurrent: i === NOW.getMonth() && year === NOW.getFullYear() }))
  }, [yearExpenses, year])

  // ─── B) Category pie data ───
  const catData = useMemo(() => {
    const totals = {}
    yearExpenses.forEach(e => {
      const cat = e.category || 'other'
      totals[cat] = (totals[cat] || 0) + (e.amount || 0)
    })
    return Object.entries(totals)
      .map(([k, v]) => ({ name: (CAT[k]?.label || k), value: v, color: CAT[k]?.color || '#7a7870' }))
      .sort((a, b) => b.value - a.value)
  }, [yearExpenses])

  // ─── C) Project breakdown ───
  const projectData = useMemo(() => {
    return projects.map(p => {
      const pExps = projExp.filter(e => e.project_id === p.id && e.date?.startsWith(String(year)))
      const spent = pExps.reduce((s, e) => s + (e.amount || 0), 0)
      const top3 = [...pExps].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 3)
      return { ...p, spent, top3, budget: p.budget || 0 }
    }).filter(p => p.spent > 0 || p.budget > 0)
  }, [projects, projExp, year])

  const totalExp = yearExpenses.reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:28,fontWeight:700,color:'#1A1008'}}>Reports</div>
          <div style={{fontFamily:'serif',fontSize:13,color:'#8A7A60',marginTop:3}}>रिपोर्ट</div>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{background:'#F5EFE4',border:'1.5px solid #DDD0BC',borderRadius:12,padding:'10px 14px',fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:'#1A1008',cursor:'pointer'}}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{overflowY:'auto',padding:'16px 20px 24px',display:'flex',flexDirection:'column',gap:14}}>
        {/* Summary banner */}
        <div style={{background:'linear-gradient(150deg,#1A3D28 0%,#245A36 100%)',borderRadius:20,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-30,right:-20,width:140,height:140,background:'radial-gradient(circle,rgba(184,120,32,0.2) 0%,transparent 70%)',borderRadius:'50%'}} />
          <div style={{fontSize:10,color:'rgba(255,248,238,0.4)',fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',position:'relative'}}>Total Expenses · कुल खर्च · {year}</div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:36,fontWeight:700,color:'#FFF8EE',marginTop:6,position:'relative'}}>{fmt(totalExp)}</div>
        </div>

        {/* A) Monthly Bar Chart */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60',marginBottom:14}}>Monthly Expenses · मासिक खर्च</div>
          {totalExp === 0 ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#8A7A60',fontSize:14}}>No expense data for {year}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{top:5,right:5,bottom:5,left:-10}}>
                <XAxis dataKey="name" tick={{fontSize:11,fill:'#8A7A60'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:10,fill:'#8A7A60'}} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} cursor={{fill:'rgba(184,120,32,0.06)'}} />
                <Bar dataKey="amount" radius={[6,6,0,0]}>
                  {monthlyData.map((d, i) => (
                    <Cell key={i} fill={d.isCurrent ? '#B87820' : '#2D6A4F'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* B) Category Pie Chart */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',color:'#8A7A60',marginBottom:14}}>By Category · श्रेणी अनुसार</div>
          {catData.length === 0 ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#8A7A60',fontSize:14}}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                  {catData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
                <Legend
                  layout="horizontal" align="center" verticalAlign="bottom"
                  formatter={(value) => <span style={{fontSize:11,color:'#3A2010',fontFamily:"'DM Sans',sans-serif"}}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* C) Project Breakdown */}
        {projectData.length > 0 && <>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:'#8A7A60',marginTop:4}}>Project Spending · परियोजना खर्च</div>
          {projectData.map(p => {
            const pct = p.budget > 0 ? Math.min(100, (p.spent / p.budget) * 100) : 0
            const over = p.budget > 0 && p.spent > p.budget
            const sb = STATUS_BADGE[p.status] || STATUS_BADGE.active
            return (
              <Card key={p.id}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:'#1A1008'}}>{p.name}</div>
                    <span style={{display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,color:sb.color,background:sb.bg,marginTop:4}}>{sb.label}</span>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:22,fontWeight:700,color:over?'#B04040':'#1A1008'}}>{fmt(p.spent)}</div>
                    {p.budget > 0 && <div style={{fontSize:11,color:'#8A7A60'}}>of {fmt(p.budget)}</div>}
                  </div>
                </div>
                {p.budget > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{height:6,background:'#EDE6D8',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:over?'#B04040':pct>75?'#B87820':'#2D8A5E',borderRadius:3,transition:'width .5s'}} />
                    </div>
                    <div style={{fontSize:11,color:'#8A7A60',marginTop:4,textAlign:'right'}}>{pct.toFixed(0)}% used</div>
                  </div>
                )}
                {p.top3.length > 0 && (
                  <div style={{borderTop:'1px solid #F0E8DA',paddingTop:10}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#B0A090',marginBottom:6}}>Top expenses</div>
                    {p.top3.map((e, i) => (
                      <div key={e.id || i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:13,borderBottom:i < p.top3.length - 1 ? '1px solid #F5F0E8' : 'none'}}>
                        <span style={{color:'#3A2010',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{e.party_name || e.notes || 'Expense'}</span>
                        <span style={{fontWeight:700,color:'#B04040',flexShrink:0}}>{fmt(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </>}
      </div>
    </div>
  )
}
