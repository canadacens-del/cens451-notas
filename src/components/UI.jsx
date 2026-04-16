export function Card({ children, style = {} }) {
  return <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'1.25rem', ...style }}>{children}</div>
}
export function PageTitle({ children }) {
  return <h1 style={{ fontSize:22, fontWeight:600, marginBottom:'1.5rem', color:'#111' }}>{children}</h1>
}
export function SectionTitle({ children }) {
  return <h2 style={{ fontSize:16, fontWeight:600, marginBottom:'1rem', color:'#374151' }}>{children}</h2>
}
export function Badge({ label, color='#6b7280', bg='#f3f4f6' }) {
  return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:bg, color, display:'inline-block' }}>{label}</span>
}
export function Btn({ children, onClick, variant='primary', disabled=false, style={} }) {
  const s = { primary:{background:'#2563eb',color:'white',border:'none'}, secondary:{background:'white',color:'#374151',border:'1px solid #d1d5db'}, danger:{background:'#dc2626',color:'white',border:'none'}, ghost:{background:'transparent',color:'#2563eb',border:'none'} }
  return <button onClick={onClick} disabled={disabled} style={{ padding:'8px 16px',borderRadius:8,fontSize:14,fontWeight:500,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,...s[variant],...style }}>{children}</button>
}
export function Input({ label, value, onChange, type='text', placeholder='', required=false }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ fontSize:13, color:'#374151', display:'block', marginBottom:4 }}>{label}{required&&' *'}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
    </div>
  )
}
export function Select({ label, value, onChange, options=[], placeholder='Seleccionar...' }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ fontSize:13, color:'#374151', display:'block', marginBottom:4 }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, background:'white', boxSizing:'border-box' }}>
        <option value="">{placeholder}</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
export function Textarea({ label, value, onChange, rows=3, placeholder='' }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ fontSize:13, color:'#374151', display:'block', marginBottom:4 }}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width:'100%', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
    </div>
  )
}
export function NotaInput({ value, onChange, label }) {
  return (
    <div style={{ textAlign:'center' }}>
      {label && <div style={{ fontSize:10, color:'#6b7280', marginBottom:2 }}>{label}</div>}
      <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="—"
        style={{ width:48, padding:'4px 6px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14, textAlign:'center' }} />
    </div>
  )
}
export function Tabla({ headers, rows }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>{headers.map((h,i)=><th key={i} style={{ padding:'8px 12px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', textAlign:'left', fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
              {row.map((cell,j)=><td key={j} style={{ padding:'8px 12px', color:'#111827' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:16, padding:'1.5rem', width:'90%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#6b7280' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function Loading({ text='Cargando...' }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', color:'#6b7280', fontSize:14 }}>{text}</div>
}
export function EmptyState({ text='Sin datos' }) {
  return <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:14 }}>{text}</div>
}
