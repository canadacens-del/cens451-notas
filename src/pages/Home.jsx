import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDivisiones, getMaterias } from '../firebase/service'
import { Card, PageTitle } from '../components/UI'

export default function Home() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([getDivisiones(), getMaterias()]).then(([divs, mats]) =>
      setStats({ divisiones: divs.length, materias: mats.length })
    )
  }, [])

  const rolMsg = {
    admin: 'Administrador del sistema',
    directivo: 'Acceso completo a informes y consultas',
    docente: 'Cargá las notas de tus materias',
    preceptor: 'Consultá el estado académico de los alumnos',
  }

  return (
    <div>
      <PageTitle>Bienvenido, {perfil?.nombre || 'usuario'}</PageTitle>
      <p style={{ color:'#6b7280', marginBottom:'2rem', marginTop:'-1rem' }}>{rolMsg[perfil?.rol]}</p>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:16, marginBottom:'2rem' }}>
          {[
            { label:'Divisiones', value:stats.divisiones, icon:'🏫' },
            { label:'Materias', value:stats.materias, icon:'📖' },
            { label:'Ciclo', value:new Date().getFullYear(), icon:'📅' },
          ].map(s => (
            <Card key={s.label}>
              <div style={{ fontSize:26, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:700, color:'#111' }}>{s.value}</div>
              <div style={{ fontSize:13, color:'#6b7280' }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
        {['docente','admin'].includes(perfil?.rol) && (
          <Card>
            <h3 style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>✏️ Cargar notas</h3>
            <p style={{ fontSize:13, color:'#6b7280' }}>Completá notas por materia y división. Los cambios se guardan en Firebase en tiempo real.</p>
          </Card>
        )}
        {['directivo','admin'].includes(perfil?.rol) && (
          <Card>
            <h3 style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>📊 Informes disponibles</h3>
            <ul style={{ fontSize:13, color:'#6b7280', paddingLeft:'1.2rem', lineHeight:2 }}>
              <li>Boletín por alumno</li>
              <li>Resumen por curso</li>
              <li>Informe por docente</li>
              <li>Comparativo anual</li>
            </ul>
          </Card>
        )}
        <Card>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>🔍 Consultar notas</h3>
          <p style={{ fontSize:13, color:'#6b7280' }}>Buscá por curso y materia, o directamente por alumno.</p>
        </Card>
      </div>
    </div>
  )
}
