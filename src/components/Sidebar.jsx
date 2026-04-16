import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const rolLabel = { admin:'Administrador', directivo:'Directivo', docente:'Docente', preceptor:'Preceptor' }

export default function Sidebar() {
  const { perfil, logout } = useAuth()
  const loc = useLocation()
  const links = [
    { to:'/', label:'🏠 Inicio' },
    { to:'/cargar', label:'✏️ Cargar notas', roles:['admin','docente'] },
    { to:'/consultar', label:'🔍 Consultar notas' },
    { to:'/informes', label:'📊 Informes', roles:['admin','directivo'] },
    { to:'/admin/estructura', label:'⚙️ Administración', roles:['admin'] },
  ].filter(l => !l.roles || l.roles.includes(perfil?.rol))

  return (
    <aside style={{ width:220, minHeight:'100vh', background:'#1e293b', display:'flex', flexDirection:'column', padding:'1.5rem 0', flexShrink:0 }}>
      <div style={{ padding:'0 1.25rem 1.5rem', borderBottom:'1px solid #334155' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'white' }}>CENS 451</div>
        <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Gestión de Notas</div>
      </div>
      <nav style={{ flex:1, padding:'1rem 0.75rem' }}>
        {links.map(l=>(
          <Link key={l.to} to={l.to} style={{
            display:'block', padding:'9px 12px', borderRadius:8, marginBottom:2, fontSize:14,
            color: loc.pathname===l.to ? 'white' : '#94a3b8',
            background: loc.pathname===l.to ? '#2563eb' : 'transparent',
            textDecoration:'none', fontWeight: loc.pathname===l.to ? 600 : 400
          }}>{l.label}</Link>
        ))}
      </nav>
      <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #334155' }}>
        <div style={{ fontSize:13, color:'#e2e8f0', marginBottom:2 }}>{perfil?.nombre || perfil?.email}</div>
        <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>{rolLabel[perfil?.rol] || perfil?.rol}</div>
        <button onClick={logout} style={{ fontSize:13, color:'#94a3b8', background:'none', border:'1px solid #334155', borderRadius:6, padding:'5px 10px', cursor:'pointer', width:'100%' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
