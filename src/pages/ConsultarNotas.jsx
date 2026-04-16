import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDivisiones, getMaterias, getAlumnos, getNotasPorDivisionMateria, getNotasPorAlumno } from '../firebase/service'
import { PageTitle, Card, Select, Loading, Tabla, EmptyState, SectionTitle } from '../components/UI'
import { calcularEstado } from '../utils/notas'

const CICLO = String(new Date().getFullYear())

function estadoBadge(estado, label) {
  const map = { promocionado:{bg:'#dcfce7',c:'#15803d'}, a_mesa:{bg:'#fef9c3',c:'#92400e'}, c1_ok:{bg:'#dbeafe',c:'#1d4ed8'}, sin_nota:{bg:'#f3f4f6',c:'#6b7280'} }
  const s = map[estado] || map.sin_nota
  return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:s.bg, color:s.c }}>{label}</span>
}

export default function ConsultarNotas() {
  const { perfil } = useAuth()
  const [divisiones, setDivisiones] = useState([])
  const [materias, setMaterias] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [divisionId, setDivisionId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [modo, setModo] = useState('curso')
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getDivisiones().then(divs =>
      setDivisiones(perfil?.rol==='docente' ? divs.filter(d=>perfil?.divisiones?.includes(d.id)) : divs)
    )
    getMaterias().then(setMaterias)
  }, [perfil])

  useEffect(() => {
    if (!divisionId) { setAlumnos([]); return }
    getAlumnos(divisionId).then(setAlumnos)
  }, [divisionId])

  async function buscar() {
    if (modo==='curso' && (!divisionId||!materiaId)) return
    if (modo==='alumno' && !alumnoId) return
    setLoading(true)
    const ns = modo==='curso'
      ? await getNotasPorDivisionMateria(divisionId, materiaId, CICLO)
      : await getNotasPorAlumno(alumnoId, CICLO)
    setNotas(ns)
    setLoading(false)
  }

  const mats = materias.filter(m => {
    if (!divisionId) return true
    const div = divisiones.find(d=>d.id===divisionId)
    return m.modalidadId === div?.modalidadId
  })

  const filas = modo==='curso'
    ? alumnos.map(al => {
        const n = notas.find(x=>x.alumnoId===al.id)||{}
        const {estado,label} = calcularEstado(n)
        return [`${al.apellido}, ${al.nombre}`, n.c1Final||'—', n.c2Final||'—', estadoBadge(estado,label)]
      })
    : mats.map(m => {
        const n = notas.find(x=>x.materiaId===m.id)||{}
        const {estado,label} = calcularEstado(n)
        return [m.nombre, n.c1Final||'—', n.c2Final||'—', n.c1TurnoAgosto||'—', n.c1TurnoDic||'—', n.c1TurnoFeb||'—', estadoBadge(estado,label)]
      })

  return (
    <div>
      <PageTitle>Consultar notas</PageTitle>
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem' }}>
        {[{k:'curso',l:'Por curso y materia'},{k:'alumno',l:'Por alumno'}].map(m=>(
          <button key={m.k} onClick={()=>{setModo(m.k);setNotas([])}} style={{
            padding:'8px 16px', borderRadius:8, fontSize:14, cursor:'pointer',
            background:modo===m.k?'#2563eb':'white', color:modo===m.k?'white':'#374151',
            border:modo===m.k?'none':'1px solid #d1d5db', fontWeight:modo===m.k?600:400
          }}>{m.l}</button>
        ))}
      </div>

      <Card style={{ marginBottom:'1.5rem' }}>
        {modo==='curso' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
            <Select label="División" value={divisionId} onChange={v=>{setDivisionId(v);setNotas([])}}
              options={divisiones.map(d=>({value:d.id,label:d.nombre}))} />
            <Select label="Materia" value={materiaId} onChange={v=>{setMateriaId(v);setNotas([])}}
              options={mats.map(m=>({value:m.id,label:m.nombre}))} />
            <button onClick={buscar} style={{ padding:'8px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', alignSelf:'flex-end', marginBottom:12 }}>Buscar</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
            <Select label="División (para filtrar)" value={divisionId} onChange={v=>{setDivisionId(v);setAlumnoId('')}}
              options={divisiones.map(d=>({value:d.id,label:d.nombre}))} />
            <Select label="Alumno" value={alumnoId} onChange={setAlumnoId}
              options={alumnos.map(a=>({value:a.id,label:`${a.apellido}, ${a.nombre}`}))} />
            <button onClick={buscar} style={{ padding:'8px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', alignSelf:'flex-end', marginBottom:12 }}>Buscar</button>
          </div>
        )}
      </Card>

      {loading && <Loading />}

      {!loading && filas.length>0 && (
        <Card>
          <SectionTitle>Resultados · Ciclo {CICLO}</SectionTitle>
          <Tabla
            headers={modo==='curso'
              ? ['Alumno','Final C1','Final C2','Estado']
              : ['Materia','Final C1','Final C2','Ago.','Dic.','Feb.','Estado']}
            rows={filas}
          />
        </Card>
      )}
      {!loading && filas.length===0 && (divisionId||alumnoId) && notas.length===0 && (
        <EmptyState text="No hay notas para esta selección todavía." />
      )}
    </div>
  )
}
