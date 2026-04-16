import { useEffect, useState } from 'react'
import { getDivisiones, getMaterias, getAlumnos, getAllAlumnos, getNotasPorDivision, getNotasPorAlumno, getNotasPorDocente, getUsuarios } from '../firebase/service'
import { exportarPlanillaAlumno, exportarPlanillaCurso, exportarInformeDocente, exportarInformeAnual, calcularEstado, calcularPromedio, estadisticasCurso } from '../utils/notas'
import { PageTitle, Card, Select, Btn, Loading, SectionTitle, Tabla, EmptyState } from '../components/UI'

const CICLO = String(new Date().getFullYear())

function StatBox({ label, value, color='#2563eb' }) {
  return (
    <div style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:12, color:'#6b7280' }}>{label}</div>
    </div>
  )
}

export default function Informes() {
  const [tab, setTab] = useState('alumno')
  const [divisiones, setDivisiones] = useState([])
  const [materias, setMaterias] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [docentes, setDocentes] = useState([])
  const [loading, setLoading] = useState(false)
  const [divisionId, setDivisionId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [docenteId, setDocenteId] = useState('')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    Promise.all([getDivisiones(), getMaterias(), getAllAlumnos(), getUsuarios()]).then(([divs,mats,als,users]) => {
      setDivisiones(divs); setMaterias(mats); setAlumnos(als)
      setDocentes(users.filter(u=>u.rol==='docente'))
    })
  }, [])

  async function verAlumno() {
    if (!alumnoId) return
    setLoading(true)
    const alumno = alumnos.find(a=>a.id===alumnoId)
    const notas = await getNotasPorAlumno(alumnoId, CICLO)
    const divAlumno = divisiones.find(d=>d.id===alumno.divisionId)
    const matsAlumno = materias.filter(m=>m.modalidadId===divAlumno?.modalidadId)
    const filas = matsAlumno.map(m => {
      const n = notas.find(x=>x.materiaId===m.id)
      const {estado,label} = calcularEstado(n)
      const badge = <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:estado==='promocionado'?'#dcfce7':estado==='a_mesa'?'#fef9c3':'#f3f4f6', color:estado==='promocionado'?'#15803d':estado==='a_mesa'?'#92400e':'#6b7280' }}>{label}</span>
      return [m.nombre, n?.c1Final||'—', n?.c2Final||'—', badge]
    })
    setResultado({ tipo:'alumno', alumno, filas, notas, materias:matsAlumno, promedio:calcularPromedio(matsAlumno.map(m=>notas.find(x=>x.materiaId===m.id))) })
    setLoading(false)
  }

  async function verCurso() {
    if (!divisionId) return
    setLoading(true)
    const div = divisiones.find(d=>d.id===divisionId)
    const als = await getAlumnos(divisionId)
    const notas = await getNotasPorDivision(divisionId, CICLO)
    const matsDiv = materias.filter(m=>m.modalidadId===div?.modalidadId)
    const notasPorAlumno = {}
    als.forEach(al => { notasPorAlumno[al.id] = notas.filter(n=>n.alumnoId===al.id) })
    const stats = estadisticasCurso(als.map(al => ({ alumno:al, notas:matsDiv.map(m=>({ materia:m, nota:notasPorAlumno[al.id]?.find(n=>n.materiaId===m.id) })) })))
    const filas = als.map(al => {
      const ns = notasPorAlumno[al.id]||[]
      const proms = matsDiv.map(m=>{ const n=ns.find(x=>x.materiaId===m.id); const c1=parseFloat(n?.c1Final),c2=parseFloat(n?.c2Final); return (!isNaN(c1)&&!isNaN(c2))?(c1+c2)/2:null }).filter(Boolean)
      const prom = proms.length ? (proms.reduce((a,b)=>a+b,0)/proms.length).toFixed(2) : '—'
      return [`${al.apellido}, ${al.nombre}`, al.dni, prom, `${ns.length}/${matsDiv.length}`]
    })
    setResultado({ tipo:'curso', div, filas, stats, als, notas, materias:matsDiv, notasPorAlumno })
    setLoading(false)
  }

  async function verDocente() {
    if (!docenteId) return
    setLoading(true)
    const docente = docentes.find(d=>d.id===docenteId)
    const notas = await getNotasPorDocente(docenteId, CICLO)
    const matsDocente = [...new Set(notas.map(n=>n.materiaId))].map(id=>materias.find(m=>m.id===id)).filter(Boolean)
    const filas = matsDocente.map(m => {
      const ns = notas.filter(n=>n.materiaId===m.id)
      const promo = ns.filter(n=>calcularEstado(n).estado==='promocionado').length
      const mesa = ns.filter(n=>calcularEstado(n).estado==='a_mesa').length
      return [m.nombre, ns.length, promo, mesa, ns.length?`${Math.round(promo/ns.length*100)}%`:'—']
    })
    setResultado({ tipo:'docente', docente, filas, notas, materias:matsDocente })
    setLoading(false)
  }

  async function verAnual() {
    setLoading(true)
    const als = await getAllAlumnos()
    const allNotas = []
    for (const div of divisiones) {
      const ns = await getNotasPorDivision(div.id, CICLO)
      allNotas.push(...ns)
    }
    const filas = divisiones.map(div => {
      const alsDiv = als.filter(a=>a.divisionId===div.id)
      const matsDiv = materias.filter(m=>m.modalidadId===div.modalidadId)
      const notasDiv = allNotas.filter(n=>n.divisionId===div.id)
      let promo=0
      alsDiv.forEach(al => {
        const ns = notasDiv.filter(n=>n.alumnoId===al.id)
        if (matsDiv.length>0 && matsDiv.every(m=>calcularEstado(ns.find(n=>n.materiaId===m.id)).estado==='promocionado')) promo++
      })
      const pct = alsDiv.length ? `${Math.round(promo/alsDiv.length*100)}%` : '—'
      return [div.nombre, alsDiv.length, promo, alsDiv.length-promo, pct]
    })
    setResultado({ tipo:'anual', filas, divisiones, als, allNotas })
    setLoading(false)
  }

  function exportar() {
    if (!resultado) return
    const {tipo} = resultado
    if (tipo==='alumno') exportarPlanillaAlumno(resultado.alumno, resultado.materias, resultado.notas, CICLO)
    else if (tipo==='curso') exportarPlanillaCurso(resultado.div, resultado.materias, resultado.als, resultado.notasPorAlumno, CICLO)
    else if (tipo==='docente') exportarInformeDocente(resultado.docente, resultado.materias, resultado.notas, CICLO)
    else if (tipo==='anual') exportarInformeAnual(divisiones, materias, resultado.als, resultado.allNotas, CICLO)
  }

  const TABS = [{k:'alumno',l:'Por alumno'},{k:'curso',l:'Por curso'},{k:'docente',l:'Por docente'},{k:'anual',l:'Comparativo anual'}]

  return (
    <div>
      <PageTitle>Informes y reportes</PageTitle>
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>{setTab(t.k);setResultado(null)}} style={{
            padding:'8px 16px', borderRadius:8, fontSize:14, cursor:'pointer',
            background:tab===t.k?'#2563eb':'white', color:tab===t.k?'white':'#374151',
            border:tab===t.k?'none':'1px solid #d1d5db', fontWeight:tab===t.k?600:400
          }}>{t.l}</button>
        ))}
      </div>

      <Card style={{ marginBottom:'1.5rem' }}>
        {tab==='alumno' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
            <Select label="División" value={divisionId} onChange={v=>{setDivisionId(v);setAlumnoId('')}} options={divisiones.map(d=>({value:d.id,label:d.nombre}))} />
            <Select label="Alumno" value={alumnoId} onChange={setAlumnoId} options={alumnos.filter(a=>!divisionId||a.divisionId===divisionId).map(a=>({value:a.id,label:`${a.apellido}, ${a.nombre}`}))} />
            <Btn onClick={verAlumno} disabled={!alumnoId} style={{ alignSelf:'flex-end', marginBottom:12 }}>Ver</Btn>
          </div>
        )}
        {tab==='curso' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'flex-end' }}>
            <Select label="División" value={divisionId} onChange={setDivisionId} options={divisiones.map(d=>({value:d.id,label:d.nombre}))} />
            <Btn onClick={verCurso} disabled={!divisionId} style={{ alignSelf:'flex-end', marginBottom:12 }}>Ver</Btn>
          </div>
        )}
        {tab==='docente' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'flex-end' }}>
            <Select label="Docente" value={docenteId} onChange={setDocenteId} options={docentes.map(d=>({value:d.id,label:d.nombre||d.email}))} />
            <Btn onClick={verDocente} disabled={!docenteId} style={{ alignSelf:'flex-end', marginBottom:12 }}>Ver</Btn>
          </div>
        )}
        {tab==='anual' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontSize:14, color:'#6b7280' }}>Resumen de todas las divisiones — ciclo {CICLO}.</p>
            <Btn onClick={verAnual}>Generar</Btn>
          </div>
        )}
      </Card>

      {loading && <Loading text="Generando informe..." />}

      {resultado && !loading && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>
              {resultado.tipo==='alumno' && `${resultado.alumno.apellido}, ${resultado.alumno.nombre}`}
              {resultado.tipo==='curso' && `División ${resultado.div.nombre}`}
              {resultado.tipo==='docente' && (resultado.docente.nombre||resultado.docente.email)}
              {resultado.tipo==='anual' && `Comparativo anual ${CICLO}`}
            </SectionTitle>
            <Btn onClick={exportar} variant="secondary">⬇ Exportar .xlsx</Btn>
          </div>

          {resultado.tipo==='alumno' && (
            <>
              <div style={{ display:'flex', gap:24, marginBottom:16, padding:'12px 16px', background:'#f8fafc', borderRadius:8 }}>
                <div><span style={{ fontSize:12, color:'#6b7280' }}>DNI</span><br /><strong>{resultado.alumno.dni||'—'}</strong></div>
                <div><span style={{ fontSize:12, color:'#6b7280' }}>Promedio</span><br /><strong style={{ fontSize:22, color:resultado.promedio>=7?'#15803d':'#d97706' }}>{resultado.promedio??'—'}</strong></div>
              </div>
              <Tabla headers={['Materia','Final C1','Final C2','Estado']} rows={resultado.filas} />
            </>
          )}
          {resultado.tipo==='curso' && (
            <>
              <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                <StatBox label="Total" value={resultado.stats.total} color="#2563eb" />
                <StatBox label="Promocionados" value={resultado.stats.promocionados} color="#15803d" />
                <StatBox label="A mesa" value={resultado.stats.aMesa} color="#d97706" />
              </div>
              <Tabla headers={['Alumno','DNI','Promedio','Materias']} rows={resultado.filas} />
            </>
          )}
          {resultado.tipo==='docente' && (
            <Tabla headers={['Materia','Alumnos','Promocionados','A mesa','% Promoc.']} rows={resultado.filas} />
          )}
          {resultado.tipo==='anual' && (
            <Tabla headers={['División','Total','Promocionados','A mesa','% Promoc.']} rows={resultado.filas} />
          )}
        </Card>
      )}
    </div>
  )
}
