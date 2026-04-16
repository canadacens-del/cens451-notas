import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getDivisiones, getMaterias, getAlumnos, guardarNotasBatch, getNotasPorDivisionMateria } from '../firebase/service'
import { PageTitle, Select, Card, Btn, Loading, Textarea, NotaInput } from '../components/UI'
import { calcularEstado } from '../utils/notas'

const CICLO = String(new Date().getFullYear())

const CAMPOS = [
  { key:'c1Informe', label:'1°Inf' },
  { key:'c1Cuatrimestre', label:'Cuat' },
  { key:'c1Final', label:'Final' },
  { key:'c1TurnoAgosto', label:'Ago' },
  { key:'c1TurnoDic', label:'Dic' },
  { key:'c1TurnoFeb', label:'Feb' },
  { key:'c2Informe', label:'2°Inf' },
  { key:'c2Cuatrimestre', label:'Cuat' },
  { key:'c2Final', label:'Final' },
  { key:'c2TurnoDic', label:'Dic' },
  { key:'c2TurnoFeb', label:'Feb' },
]

const TEXTOS = [
  { key:'c1SaberesEnseniados', label:'Saberes enseñados (C1)' },
  { key:'c1AprendizajesAlcanzados', label:'Aprendizajes alcanzados (C1)' },
  { key:'c1AprendizajesPendientes', label:'Aprendizajes pendientes (C1)' },
  { key:'c2SaberesEnseniados', label:'Saberes enseñados (C2)' },
  { key:'c2AprendizajesAlcanzados', label:'Aprendizajes alcanzados (C2)' },
  { key:'c2AprendizajesPendientes', label:'Aprendizajes pendientes (C2)' },
]

export default function CargarNotas() {
  const { perfil } = useAuth()
  const [divisiones, setDivisiones] = useState([])
  const [materias, setMaterias] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [notas, setNotas] = useState({})
  const [divisionId, setDivisionId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    getDivisiones().then(divs => {
      setDivisiones(perfil?.rol === 'admin' ? divs : divs.filter(d => perfil?.divisiones?.includes(d.id)))
    })
  }, [perfil])

  useEffect(() => {
    if (!divisionId) { setMaterias([]); return }
    const div = divisiones.find(d => d.id === divisionId)
    getMaterias(div?.modalidadId).then(mats => {
      setMaterias(perfil?.rol === 'admin' ? mats : mats.filter(m => perfil?.materias?.includes(m.id)))
    })
  }, [divisionId, divisiones, perfil])

  useEffect(() => {
    if (!divisionId || !materiaId) { setAlumnos([]); setNotas({}); return }
    setLoading(true)
    Promise.all([getAlumnos(divisionId), getNotasPorDivisionMateria(divisionId, materiaId, CICLO)]).then(([als, ns]) => {
      setAlumnos(als)
      const map = {}
      ns.forEach(n => { map[n.alumnoId] = n })
      als.forEach(a => { if (!map[a.id]) map[a.id] = {} })
      setNotas(map)
      setLoading(false)
    })
  }, [divisionId, materiaId])

  function upd(alumnoId, campo, valor) {
    setNotas(prev => ({ ...prev, [alumnoId]: { ...(prev[alumnoId]||{}), [campo]: valor } }))
    setSaved(false)
  }

  async function guardar() {
    setSaving(true)
    await guardarNotasBatch(alumnos.map(al => ({
      alumnoId: al.id, materiaId, divisionId, docenteUid: perfil?.id || '', ciclo: CICLO, ...notas[al.id]
    })))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const estadoStyle = (estado) => ({
    fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
    background: estado==='promocionado'?'#dcfce7': estado==='a_mesa'?'#fef9c3':'#f3f4f6',
    color: estado==='promocionado'?'#15803d': estado==='a_mesa'?'#92400e':'#6b7280'
  })

  return (
    <div>
      <PageTitle>Cargar notas</PageTitle>
      <Card style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Select label="División" value={divisionId} onChange={v=>{setDivisionId(v);setMateriaId('')}}
            options={divisiones.map(d=>({value:d.id,label:d.nombre}))} />
          <Select label="Materia" value={materiaId} onChange={setMateriaId}
            options={materias.map(m=>({value:m.id,label:m.nombre}))} placeholder="Primero elegí división" />
        </div>
      </Card>

      {loading && <Loading text="Cargando alumnos..." />}

      {!loading && alumnos.length > 0 && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:14, color:'#6b7280' }}>{alumnos.length} alumnos · Ciclo {CICLO}</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {saved && <span style={{ fontSize:13, color:'#15803d' }}>✓ Guardado</span>}
              <Btn onClick={guardar} disabled={saving}>{saving?'Guardando...':'Guardar todo'}</Btn>
            </div>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:900 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  <th style={TH}>Alumno</th>
                  {/* encabezados de grupo */}
                  <th colSpan={3} style={{...TH, textAlign:'center', borderLeft:'2px solid #e5e7eb'}}>1° Cuatrimestre</th>
                  <th colSpan={3} style={{...TH, textAlign:'center', borderLeft:'2px solid #e5e7eb'}}>Turnos C1</th>
                  <th colSpan={3} style={{...TH, textAlign:'center', borderLeft:'2px solid #e5e7eb'}}>2° Cuatrimestre</th>
                  <th colSpan={2} style={{...TH, textAlign:'center', borderLeft:'2px solid #e5e7eb'}}>Turnos C2</th>
                  <th style={TH}>Estado</th>
                  <th style={TH}>+</th>
                </tr>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e5e7eb' }}>
                  <th style={TH}></th>
                  {CAMPOS.map((c,i) => (
                    <th key={c.key} style={{...TH, fontSize:11, borderLeft: [0,3,6,9].includes(i)?'2px solid #e5e7eb':undefined}}>
                      {c.label}
                    </th>
                  ))}
                  <th style={TH}></th><th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(al => {
                  const n = notas[al.id] || {}
                  const { estado, label } = calcularEstado(n)
                  const exp = expandido === al.id
                  return (
                    <>
                      <tr key={al.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                        <td style={{ ...TD, fontWeight:500, whiteSpace:'nowrap' }}>{al.apellido}, {al.nombre}</td>
                        {CAMPOS.map((c,i) => (
                          <td key={c.key} style={{ ...TD, padding:'6px 3px', borderLeft:[0,3,6,9].includes(i)?'2px solid #e5e7eb':undefined }}>
                            <NotaInput value={n[c.key]||''} onChange={v=>upd(al.id,c.key,v)} />
                          </td>
                        ))}
                        <td style={TD}><span style={estadoStyle(estado)}>{label}</span></td>
                        <td style={TD}>
                          <button onClick={()=>setExpandido(exp?null:al.id)}
                            style={{ fontSize:12, color:'#2563eb', background:'none', border:'none', cursor:'pointer' }}>
                            {exp?'▲':'▼'}
                          </button>
                        </td>
                      </tr>
                      {exp && (
                        <tr key={`${al.id}-txt`} style={{ background:'#f9fafb' }}>
                          <td colSpan={CAMPOS.length+3} style={{ padding:'1rem' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                              {TEXTOS.map(t => (
                                <Textarea key={t.key} label={t.label} value={n[t.key]||''} onChange={v=>upd(al.id,t.key,v)} rows={3} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:16, textAlign:'right', display:'flex', justifyContent:'flex-end', gap:8, alignItems:'center' }}>
            {saved && <span style={{ fontSize:13, color:'#15803d' }}>✓ Guardado en Firebase</span>}
            <Btn onClick={guardar} disabled={saving}>{saving?'Guardando...':'Guardar todo'}</Btn>
          </div>
        </>
      )}

      {!loading && divisionId && materiaId && alumnos.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:14 }}>
          No hay alumnos cargados en esta división.
        </div>
      )}
    </div>
  )
}

const TH = { padding:'8px 8px', textAlign:'left', fontWeight:600, color:'#374151', whiteSpace:'nowrap' }
const TD = { padding:'8px', color:'#111827', verticalAlign:'middle' }
