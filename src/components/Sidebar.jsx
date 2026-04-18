import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const rolLabel = { admin:'Administrador', directivo:'Directivo', docente:'Docente', preceptor:'Preceptor' }

export default function Sidebar() {
  const { perfil, logout } = useAuth()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  const links = [
    { to:'/', label:'Inicio', icon:'⌂' },
    { to:'/cargar', label:'Cargar notas', icon:'✎', roles:['admin','docente'] },
    { to:'/consultar', label:'Consultar notas', icon:'◎' },
    { to:'/informes', label:'Informes', icon:'▤', roles:['admin','directivo'] },
    { to:'/admin/estructura', label:'Administración', icon:'⚙', roles:['admin','directivo','preceptor'] },
  ].filter(l => !l.roles || l.roles.includes(perfil?.rol))

  const navContent = (
    <>
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500, color:'white' }}>CENS 451</div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Gestión de notas</div>
        </div>
        <button onClick={() => setOpen(false)}
          style={{ display:'none', background:'none', border:'none', color:'#94a3b8', fontSize:20, cursor:'pointer', lineHeight:1 }}
          className="close-btn">✕</button>
      </div>

      <nav style={{ flex:1, padding:'10px 8px' }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{
            display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
            borderRadius:8, marginBottom:2, fontSize:14, textDecoration:'none',
            color: loc.pathname === l.to ? 'white' : '#94a3b8',
            background: loc.pathname === l.to ? '#2563eb' : 'transparent',
            fontWeight: loc.pathname === l.to ? 500 : 400,
          }}>
            <span style={{ fontSize:16, lineHeight:1 }}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding:'12px 16px', borderTop:'1px solid #334155' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:500, flexShrink:0 }}>
            {(perfil?.nombre || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:12, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130 }}>{perfil?.nombre || perfil?.email}</div>
            <div style={{ fontSize:10, color:'#64748b' }}>{rolLabel[perfil?.rol] || perfil?.rol}</div>
          </div>
        </div>
        <button onClick={logout} style={{ fontSize:12, color:'#94a3b8', background:'none', border:'1px solid #334155', borderRadius:6, padding:'5px 10px', cursor:'pointer', width:'100%' }}>
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Barra superior mobile */}
      <div style={{
        display:'none', position:'sticky', top:0, zIndex:200,
        background:'#1e293b', padding:'12px 16px',
        alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid #334155',
      }} className="mobile-topbar">
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:'white' }}>CENS 451</div>
        </div>
        <button onClick={() => setOpen(true)}
          style={{ background:'none', border:'none', color:'white', fontSize:22, cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>
          ☰
        </button>
      </div>

      {/* Overlay oscuro al abrir en mobile */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:299,
        }} />
      )}

      {/* Sidebar desktop — siempre visible */}
      <aside className="sidebar-desktop" style={{
        width:210, minHeight:'100vh', background:'#1e293b',
        display:'flex', flexDirection:'column', flexShrink:0,
      }}>
        {navContent}
      </aside>

      {/* Sidebar mobile — drawer lateral */}
      <aside className="sidebar-mobile" style={{
        position:'fixed', top:0, left: open ? 0 : '-220px',
        width:210, height:'100%', background:'#1e293b',
        display:'flex', flexDirection:'column',
        zIndex:300, transition:'left .25s ease',
        boxShadow: open ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {navContent}
      </aside>

      <style>{`
        @media (max-width: 640px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: flex !important; }
          .mobile-topbar { display: flex !important; }
          .close-btn { display: block !important; }
        }
        @media (min-width: 641px) {
          .sidebar-mobile { display: none !important; }
          .mobile-topbar { display: none !important; }
        }
      `}</style>
    </>
  )
}
