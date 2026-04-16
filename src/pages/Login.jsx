import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
      <div style={{ background:'white', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, background:'#2563eb', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:'1rem' }}>📚</div>
          <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>CENS 451</h1>
          <p style={{ fontSize:14, color:'#6b7280', marginTop:4 }}>Sistema de Gestión de Notas</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#374151', display:'block', marginBottom:4 }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@email.com"
              style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, color:'#374151', display:'block', marginBottom:4 }}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
          </div>
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 12px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'10px', background:loading?'#93c5fd':'#2563eb', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
