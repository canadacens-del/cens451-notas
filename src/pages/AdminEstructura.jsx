import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  getUsuarios, setUsuario, getDivisiones, setDivision,
  getMaterias, setMateria, getModalidades, setModalidad,
  setAlumno, getAlumnos
} from '../firebase/service'
import { PageTitle, Card, SectionTitle, Input, Select, Btn, Tabla, Modal, Loading, EmptyState } from '../components/UI'

const ROLES = [
  { value:'admin', label:'Administrador' },
  { value:'directivo', label:'Directivo' },
  { value:'docente', label:'Docente' },
  { value:'preceptor', label:'Preceptor' },
]
const ANIOS = ['1°','2°','3°'].map(a => ({ value:a, label:a }))

export default function AdminEstructura() {
  const [sec, setSec] = useState('usuarios')
  const [data, setData] = useState({ usuarios:[], divisiones:[], materias:[], modalidades:[], alumnosFiltrados:null })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // forms
  const [fU, setFU] = useState({ email:'', password:'', nombre:'', rol:'docente' })
  const [fD, setFD] = useState({ nombre:'', modalidadId:'', anio:'' })
  const [fM, setFM] = useState({ nombre:'', modalidadId:'', anio:'' })
  const [fMod, setFMod] = useState({ nombre:'' })
  const [fAl, setFAl] = useState({ apellido:'', nombre:'', dni:'', divisionId:'' })

  // asignación docente
  const [docenteSelec, setDocenteSelec] = useState(null)
  const [asigDivs, setAsigDivs] = useState([])
  const [asigMats, setAsigMats] = useState([])
  const [asigSaved, setAsigSaved] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [us, divs, mats, mods] = await Promise.all([
      getUsuarios(), getDivisiones(), getMaterias(), getModalidades()
    ])
    setData(prev => ({ ...prev, usuarios:us, divisiones:divs, materias:mats, modalidades:mods }))
    setLoading(false)
  }

  async function crearUsuario() {
    setSaving(true); setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, fU.email, fU.password)
      await setUsuario(cred.user.uid, { email:fU.email, nombre:fU.nombre, rol:fU.rol, divisiones:[], materias:[] })
      setModal(null); setFU({ email:'', password:'', nombre:'', rol:'docente' })
      await loadAll()
    } catch(e) { setError(e.message) }
    setSaving(false)
  }

  async function guardarDivision() {
    setSaving(true)
    await setDivision(`div_${Date.now()}`, fD)
    setModal(null); setFD({ nombre:'', modalidadId:'', anio:'' }); await loadAll(); setSaving(false)
  }

  async function guardarMateria() {
    setSaving(true)
    await setMateria(`mat_${Date.now()}`, fM)
    setModal(null); setFM({ nombre:'', modalidadId:'', anio:'' }); await loadAll(); setSaving(false)
  }

  async function guardarModalidad() {
    setSaving(true)
    const id = fMod.nombre.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
    await setModalidad(id, fMod); setModal(null); setFMod({ nombre:'' }); await loadAll(); setSaving(false)
  }

  async function guardarAlumno() {
    setSaving(true)
    await setAlumno(null, fAl); setModal(null); setFAl({ apellido:'', nombre:'', dni:'', divisionId:'' }); await loadAll(); setSaving(false)
  }

  function abrirAsignacion(docente) {
    setDocenteSelec(docente)
    setAsigDivs(docente.divisiones || [])
    setAsigMats(docente.materias || [])
    setAsigSaved(false)
    setModal('asignacion')
  }

  function toggleArr(arr, setArr, id) {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setAsigSaved(false)
  }

  async function guardarAsignacion() {
    setSaving(true)
    await setUsuario(docenteSelec.id, { divisiones: asigDivs, materias: asigMats })
    setAsigSaved(true)
    await loadAll()
    setSaving(false)
    setTimeout(() => setAsigSaved(false), 3000)
  }

  const SECS = [
    { k:'usuarios', l:'Usuarios' },
    { k:'modalidades', l:'Modalidades' },
    { k:'divisiones', l:'Divisiones' },
    { k:'materias', l:'Materias' },
    { k:'alumnos', l:'Alumnos' },
  ]

  const tabStyle = (k) => ({
    padding:'7px 14px', borderRadius:8, fontSize:13, cursor:'pointer',
    background: sec===k ? '#1e293b' : 'white',
    color: sec===k ? 'white' : 'var(--color-text-secondary)',
    border: sec===k ? 'none' : '0.5px solid var(--color-border-secondary)',
    fontWeight: sec===k ? 500 : 400,
  })

  return (
    <div>
      <PageTitle>Administración</PageTitle>

      <div style={{ display:'flex', gap:6, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {SECS.map(s => <button key={s.k} onClick={() => setSec(s.k)} style={tabStyle(s.k)}>{s.l}</button>)}
      </div>

      {loading && <Loading />}

      {/* ── USUARIOS ── */}
      {!loading && sec === 'usuarios' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Usuarios ({data.usuarios.length})</SectionTitle>
            <Btn onClick={() => setModal('usuario')}>+ Nuevo</Btn>
          </div>
          {data.usuarios.length > 0 ? (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Nombre','Email','Rol','Divisiones','Materias',''].map((h,i) => (
                      <th key={i} style={{ padding:'8px 10px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', textAlign:'left', fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                      <td style={{ padding:'8px 10px' }}>{u.nombre || '—'}</td>
                      <td style={{ padding:'8px 10px', color:'#6b7280', fontSize:12 }}>{u.email}</td>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={{
                          fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:5,
                          background: u.rol==='admin'?'#dcfce7': u.rol==='directivo'?'#fef9c3': u.rol==='docente'?'#dbeafe':'#f3f4f6',
                          color: u.rol==='admin'?'#15803d': u.rol==='directivo'?'#92400e': u.rol==='docente'?'#1d4ed8':'#6b7280',
                        }}>{u.rol}</span>
                      </td>
                      <td style={{ padding:'8px 10px', color:'#6b7280', fontSize:12 }}>
                        {u.divisiones?.length ? `${u.divisiones.length} div.` : <span style={{ color:'#d1d5db' }}>Sin asignar</span>}
                      </td>
                      <td style={{ padding:'8px 10px', color:'#6b7280', fontSize:12 }}>
                        {u.materias?.length ? `${u.materias.length} mat.` : <span style={{ color:'#d1d5db' }}>Sin asignar</span>}
                      </td>
                      <td style={{ padding:'8px 10px' }}>
                        {u.rol === 'docente' && (
                          <button onClick={() => abrirAsignacion(u)} style={{
                            fontSize:12, color:'#2563eb', background:'none',
                            border:'0.5px solid #bfdbfe', borderRadius:6,
                            padding:'3px 10px', cursor:'pointer'
                          }}>
                            Asignar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="Sin usuarios aún" />}
        </Card>
      )}

      {/* ── MODALIDADES ── */}
      {!loading && sec === 'modalidades' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Modalidades ({data.modalidades.length})</SectionTitle>
            <Btn onClick={() => setModal('modalidad')}>+ Nueva</Btn>
          </div>
          {data.modalidades.length > 0
            ? <Tabla headers={['ID','Nombre']} rows={data.modalidades.map(m => [m.id, m.nombre])} />
            : <EmptyState text="Creá una modalidad primero" />}
        </Card>
      )}

      {/* ── DIVISIONES ── */}
      {!loading && sec === 'divisiones' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Divisiones ({data.divisiones.length})</SectionTitle>
            <Btn onClick={() => setModal('division')}>+ Nueva</Btn>
          </div>
          {data.divisiones.length > 0
            ? <Tabla headers={['División','Modalidad','Año']} rows={data.divisiones.map(d => [
                d.nombre,
                data.modalidades.find(m => m.id === d.modalidadId)?.nombre || d.modalidadId,
                d.anio || '—'
              ])} />
            : <EmptyState text="Sin divisiones" />}
        </Card>
      )}

      {/* ── MATERIAS ── */}
      {!loading && sec === 'materias' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Materias ({data.materias.length})</SectionTitle>
            <Btn onClick={() => setModal('materia')}>+ Nueva</Btn>
          </div>
          {data.materias.length > 0
            ? <Tabla headers={['Materia','Modalidad','Año']} rows={data.materias.map(m => [
                m.nombre,
                data.modalidades.find(x => x.id === m.modalidadId)?.nombre || m.modalidadId,
                m.anio || '—'
              ])} />
            : <EmptyState text="Sin materias" />}
        </Card>
      )}

      {/* ── ALUMNOS ── */}
      {!loading && sec === 'alumnos' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Alumnos</SectionTitle>
            <Btn onClick={() => setModal('alumno')}>+ Nuevo</Btn>
          </div>
          <div style={{ marginBottom:12 }}>
            <Select placeholder="Elegí una división para ver sus alumnos" value=""
              onChange={async v => {
                if (!v) return
                const als = await getAlumnos(v)
                setData(prev => ({ ...prev, alumnosFiltrados: als }))
              }}
              options={data.divisiones.map(d => ({ value:d.id, label:d.nombre }))}
            />
          </div>
          {data.alumnosFiltrados?.length > 0
            ? <Tabla headers={['Apellido','Nombre','DNI']} rows={data.alumnosFiltrados.map(a => [a.apellido, a.nombre, a.dni])} />
            : data.alumnosFiltrados?.length === 0
              ? <EmptyState text="Sin alumnos en esta división" />
              : <EmptyState text="Seleccioná una división arriba" />}
        </Card>
      )}

      {/* ══ MODALES ══ */}

      {modal === 'usuario' && (
        <Modal title="Nuevo usuario" onClose={() => { setModal(null); setError('') }}>
          <Input label="Nombre completo" value={fU.nombre} onChange={v => setFU(p => ({ ...p, nombre:v }))} />
          <Input label="Email" type="email" value={fU.email} onChange={v => setFU(p => ({ ...p, email:v }))} />
          <Input label="Contraseña temporal" type="password" value={fU.password} onChange={v => setFU(p => ({ ...p, password:v }))} />
          <Select label="Rol" value={fU.rol} onChange={v => setFU(p => ({ ...p, rol:v }))} options={ROLES} />
          {error && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12, background:'#fef2f2', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
          <Btn onClick={crearUsuario} disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Btn>
        </Modal>
      )}

      {modal === 'modalidad' && (
        <Modal title="Nueva modalidad" onClose={() => setModal(null)}>
          <Input label="Nombre (ej: Gestión del Emprendimiento)" value={fMod.nombre} onChange={v => setFMod({ nombre:v })} />
          <Btn onClick={guardarModalidad} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'division' && (
        <Modal title="Nueva división" onClose={() => setModal(null)}>
          <Input label="Nombre (ej: 1°D)" value={fD.nombre} onChange={v => setFD(p => ({ ...p, nombre:v }))} />
          <Select label="Modalidad" value={fD.modalidadId} onChange={v => setFD(p => ({ ...p, modalidadId:v }))}
            options={data.modalidades.map(m => ({ value:m.id, label:m.nombre }))} />
          <Select label="Año" value={fD.anio} onChange={v => setFD(p => ({ ...p, anio:v }))} options={ANIOS} />
          <Btn onClick={guardarDivision} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'materia' && (
        <Modal title="Nueva materia" onClose={() => setModal(null)}>
          <Input label="Nombre" value={fM.nombre} onChange={v => setFM(p => ({ ...p, nombre:v }))} />
          <Select label="Modalidad" value={fM.modalidadId} onChange={v => setFM(p => ({ ...p, modalidadId:v }))}
            options={data.modalidades.map(m => ({ value:m.id, label:m.nombre }))} />
          <Select label="Año" value={fM.anio} onChange={v => setFM(p => ({ ...p, anio:v }))} options={ANIOS} />
          <Btn onClick={guardarMateria} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'alumno' && (
        <Modal title="Nuevo alumno" onClose={() => setModal(null)}>
          <Input label="Apellido" value={fAl.apellido} onChange={v => setFAl(p => ({ ...p, apellido:v }))} />
          <Input label="Nombre" value={fAl.nombre} onChange={v => setFAl(p => ({ ...p, nombre:v }))} />
          <Input label="DNI" value={fAl.dni} onChange={v => setFAl(p => ({ ...p, dni:v }))} />
          <Select label="División" value={fAl.divisionId} onChange={v => setFAl(p => ({ ...p, divisionId:v }))}
            options={data.divisiones.map(d => ({ value:d.id, label:d.nombre }))} />
          <Btn onClick={guardarAlumno} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {/* ── MODAL ASIGNACIÓN DOCENTE ── */}
      {modal === 'asignacion' && docenteSelec && (
        <Modal title="Asignar materias y divisiones" onClose={() => setModal(null)}>
          {/* Info docente */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 12px', background:'var(--color-background-secondary)', borderRadius:8 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:'#1d4ed8', flexShrink:0 }}>
              {(docenteSelec.nombre||'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--color-text-primary)' }}>{docenteSelec.nombre}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{docenteSelec.email}</div>
            </div>
          </div>

          {/* Divisiones */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-secondary)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>
              Divisiones a cargo
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {data.divisiones.map(d => {
                const on = asigDivs.includes(d.id)
                return (
                  <div key={d.id} onClick={() => toggleArr(asigDivs, setAsigDivs, d.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer',
                      border: on ? '1.5px solid #2563eb' : '0.5px solid var(--color-border-tertiary)',
                      borderRadius:8, background: on ? '#eff6ff' : 'var(--color-background-primary)',
                    }}>
                    <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                      background: on ? '#2563eb' : 'transparent',
                      border: on ? 'none' : '1.5px solid #d1d5db',
                    }}>
                      {on && <span style={{ color:'white', fontSize:10, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color: on ? '#1d4ed8' : 'var(--color-text-primary)', fontWeight: on ? 500 : 400 }}>
                      {d.nombre}
                    </span>
                  </div>
                )
              })}
            </div>
            {data.divisiones.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>No hay divisiones cargadas aún.</div>}
          </div>

          {/* Materias */}
          <div style={{ marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-secondary)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>
              Materias que dicta
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {data.materias.map(m => {
                const on = asigMats.includes(m.id)
                return (
                  <div key={m.id} onClick={() => toggleArr(asigMats, setAsigMats, m.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer',
                      border: on ? '1.5px solid #2563eb' : '0.5px solid var(--color-border-tertiary)',
                      borderRadius:8, background: on ? '#eff6ff' : 'var(--color-background-primary)',
                    }}>
                    <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                      background: on ? '#2563eb' : 'transparent',
                      border: on ? 'none' : '1.5px solid #d1d5db',
                    }}>
                      {on && <span style={{ color:'white', fontSize:10, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color: on ? '#1d4ed8' : 'var(--color-text-primary)', fontWeight: on ? 500 : 400 }}>
                      {m.nombre}
                    </span>
                  </div>
                )
              })}
            </div>
            {data.materias.length === 0 && <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>No hay materias cargadas aún.</div>}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:10, marginTop:16, paddingTop:14, borderTop:'0.5px solid var(--color-border-tertiary)' }}>
            {asigSaved && <span style={{ fontSize:12, color:'#15803d' }}>✓ Guardado</span>}
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardarAsignacion} disabled={saving}>{saving ? 'Guardando...' : 'Guardar asignación'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
