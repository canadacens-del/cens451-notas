import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  getUsuarios, setUsuario, getDivisiones, setDivision, deleteDivision,
  getMaterias, setMateria, deleteMateria, getModalidades, setModalidad,
  setAlumno, getAlumnos, deleteAlumno
} from '../firebase/service'
import { PageTitle, Card, SectionTitle, Input, Select, Btn, Tabla, Modal, Loading, EmptyState } from '../components/UI'

const ROLES = [
  { value:'admin', label:'Administrador' },
  { value:'directivo', label:'Directivo' },
  { value:'docente', label:'Docente' },
  { value:'preceptor', label:'Preceptor' },
]
const ANIOS = ['1°','2°','3°'].map(a => ({ value:a, label:a }))

const chip = (on) => ({
  display:'flex', alignItems:'center', gap:8, padding:'7px 10px', cursor:'pointer',
  border: on ? '1.5px solid #2563eb' : '0.5px solid var(--color-border-tertiary)',
  borderRadius:8, background: on ? '#eff6ff' : 'var(--color-background-primary)',
})
const checkBox = (on) => ({
  width:16, height:16, borderRadius:4, flexShrink:0,
  display:'flex', alignItems:'center', justifyContent:'center',
  background: on ? '#2563eb' : 'transparent',
  border: on ? 'none' : '1.5px solid #d1d5db',
})
const chipLabel = (on) => ({
  fontSize:12, fontWeight: on ? 500 : 400,
  color: on ? '#1d4ed8' : 'var(--color-text-primary)',
})
const sectionLabel = {
  fontSize:11, fontWeight:500, color:'var(--color-text-secondary)',
  marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em',
}
const actionBtn = {
  fontSize:12, background:'none', borderRadius:6,
  padding:'3px 10px', cursor:'pointer', marginLeft:4,
}

export default function AdminEstructura() {
  const [sec, setSec] = useState('usuarios')
  const [data, setData] = useState({
    usuarios:[], divisiones:[], materias:[], modalidades:[], alumnosFiltrados:null, divSeleccionada:''
  })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [fU, setFU] = useState({ email:'', password:'', nombre:'', rol:'docente' })
  const [fD, setFD] = useState({ id:null, nombre:'', modalidadId:'', anio:'' })
  const [fM, setFM] = useState({ id:null, nombre:'', modalidadId:'', anio:'' })
  const [fMod, setFMod] = useState({ id:null, nombre:'' })
  const [fAl, setFAl] = useState({ id:null, apellido:'', nombre:'', dni:'', divisionId:'' })
  const [fUEdit, setFUEdit] = useState({ id:null, nombre:'', rol:'docente' })

  const [docenteSelec, setDocenteSelec] = useState(null)
  const [asignaciones, setAsignaciones] = useState([]) // [{materiaId, divisionId}]
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
      await setUsuario(cred.user.uid, { email:fU.email, nombre:fU.nombre, rol:fU.rol, asignaciones:[] })
      setModal(null); setFU({ email:'', password:'', nombre:'', rol:'docente' })
      await loadAll()
    } catch(e) { setError(e.message) }
    setSaving(false)
  }

  async function editarUsuario() {
    setSaving(true)
    await setUsuario(fUEdit.id, { nombre:fUEdit.nombre, rol:fUEdit.rol })
    setModal(null); await loadAll(); setSaving(false)
  }

  function abrirEditUsuario(u) {
    setFUEdit({ id:u.id, nombre:u.nombre||'', rol:u.rol||'docente' })
    setModal('editUsuario')
  }

  function abrirAsignacion(docente) {
    setDocenteSelec(docente)
    setAsignaciones(docente.asignaciones || [])
    setAsigSaved(false)
    setModal('asignacion')
  }

  function toggleAsignacion(materiaId, divisionId) {
    setAsignaciones(prev => {
      const existe = prev.some(a => a.materiaId === materiaId && a.divisionId === divisionId)
      if (existe) return prev.filter(a => !(a.materiaId === materiaId && a.divisionId === divisionId))
      return [...prev, { materiaId, divisionId }]
    })
    setAsigSaved(false)
  }

  async function guardarAsignacion() {
    setSaving(true)
    await setUsuario(docenteSelec.id, { asignaciones })
    setAsigSaved(true)
    const us = await getUsuarios()
    setData(prev => ({ ...prev, usuarios:us }))
    setSaving(false)
    setTimeout(() => setAsigSaved(false), 3000)
  }

  async function guardarModalidad() {
    setSaving(true)
    const id = fMod.id || fMod.nombre.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
    await setModalidad(id, { nombre:fMod.nombre })
    setModal(null); setFMod({ id:null, nombre:'' }); await loadAll(); setSaving(false)
  }

  async function guardarDivision() {
    setSaving(true)
    const id = fD.id || `div_${Date.now()}`
    await setDivision(id, { nombre:fD.nombre, modalidadId:fD.modalidadId, anio:fD.anio })
    setModal(null); setFD({ id:null, nombre:'', modalidadId:'', anio:'' }); await loadAll(); setSaving(false)
  }

  async function eliminarDivision(id) {
    if (!confirm('¿Eliminar esta división?')) return
    await deleteDivision(id); await loadAll()
  }

  async function guardarMateria() {
    setSaving(true)
    const id = fM.id || `mat_${Date.now()}`
    await setMateria(id, { nombre:fM.nombre, modalidadId:fM.modalidadId, anio:fM.anio })
    setModal(null); setFM({ id:null, nombre:'', modalidadId:'', anio:'' }); await loadAll(); setSaving(false)
  }

  async function eliminarMateria(id) {
    if (!confirm('¿Eliminar esta materia?')) return
    await deleteMateria(id); await loadAll()
  }

  async function guardarAlumno() {
    setSaving(true)
    await setAlumno(fAl.id || null, {
      apellido:fAl.apellido, nombre:fAl.nombre, dni:fAl.dni, divisionId:fAl.divisionId
    })
    setModal(null)
    setFAl({ id:null, apellido:'', nombre:'', dni:'', divisionId:'' })
    if (data.divSeleccionada) {
      const als = await getAlumnos(data.divSeleccionada)
      setData(prev => ({ ...prev, alumnosFiltrados:als }))
    }
    setSaving(false)
  }

  async function eliminarAlumno(id) {
    if (!confirm('¿Eliminar este alumno?')) return
    await deleteAlumno(id)
    if (data.divSeleccionada) {
      const als = await getAlumnos(data.divSeleccionada)
      setData(prev => ({ ...prev, alumnosFiltrados:als }))
    }
  }

  const TH = { padding:'8px 10px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', textAlign:'left', fontWeight:600, color:'#374151', whiteSpace:'nowrap', fontSize:13 }
  const TD = { padding:'8px 10px', fontSize:13, color:'var(--color-text-primary)', borderBottom:'0.5px solid #f3f4f6' }
  const tabStyle = (k) => ({
    padding:'7px 14px', borderRadius:8, fontSize:13, cursor:'pointer',
    background: sec===k ? '#1e293b' : 'var(--color-background-primary)',
    color: sec===k ? 'white' : 'var(--color-text-secondary)',
    border: sec===k ? 'none' : '0.5px solid var(--color-border-secondary)',
    fontWeight: sec===k ? 500 : 400,
  })

  const SECS = [
    { k:'usuarios', l:'Usuarios' },
    { k:'modalidades', l:'Modalidades' },
    { k:'divisiones', l:'Divisiones' },
    { k:'materias', l:'Materias' },
    { k:'alumnos', l:'Alumnos' },
  ]

  return (
    <div>
      <PageTitle>Administración</PageTitle>
      <div style={{ display:'flex', gap:6, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {SECS.map(s => <button key={s.k} onClick={() => setSec(s.k)} style={tabStyle(s.k)}>{s.l}</button>)}
      </div>

      {loading && <Loading />}

      {/* USUARIOS */}
      {!loading && sec === 'usuarios' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Usuarios ({data.usuarios.length})</SectionTitle>
            <Btn onClick={() => { setError(''); setFU({ email:'', password:'', nombre:'', rol:'docente' }); setModal('usuario') }}>+ Nuevo</Btn>
          </div>
          {data.usuarios.length > 0 ? (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Nombre','Email','Rol','Asignaciones','Acciones'].map((h,i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {data.usuarios.map(u => (
                    <tr key={u.id}>
                      <td style={TD}>{u.nombre||'—'}</td>
                      <td style={{ ...TD, color:'var(--color-text-secondary)', fontSize:12 }}>{u.email}</td>
                      <td style={TD}>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:5,
                          background: u.rol==='admin'?'#dcfce7': u.rol==='directivo'?'#fef9c3': u.rol==='docente'?'#dbeafe':'#f3f4f6',
                          color: u.rol==='admin'?'#15803d': u.rol==='directivo'?'#92400e': u.rol==='docente'?'#1d4ed8':'#6b7280',
                        }}>{u.rol}</span>
                      </td>
                      <td style={{ ...TD, color:'var(--color-text-secondary)', fontSize:12 }}>
                        {u.asignaciones?.length
                          ? `${u.asignaciones.length} mat.`
                          : <span style={{color:'#d1d5db'}}>—</span>}
                      </td>
                      <td style={TD}>
                        <button onClick={() => abrirEditUsuario(u)} style={{ ...actionBtn, color:'#2563eb', border:'0.5px solid #bfdbfe' }}>Editar</button>
                        {u.rol === 'docente' && (
                          <button onClick={() => abrirAsignacion(u)} style={{ ...actionBtn, color:'#7c3aed', border:'0.5px solid #ddd6fe' }}>Asignar</button>
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

      {/* MODALIDADES */}
      {!loading && sec === 'modalidades' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Modalidades ({data.modalidades.length})</SectionTitle>
            <Btn onClick={() => { setFMod({ id:null, nombre:'' }); setModal('modalidad') }}>+ Nueva</Btn>
          </div>
          {data.modalidades.length > 0 ? (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Nombre','Acciones'].map((h,i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.modalidades.map(m => (
                  <tr key={m.id}>
                    <td style={TD}>{m.nombre}</td>
                    <td style={TD}><button onClick={() => { setFMod({ id:m.id, nombre:m.nombre }); setModal('modalidad') }} style={{ ...actionBtn, color:'#2563eb', border:'0.5px solid #bfdbfe' }}>Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState text="Creá una modalidad primero" />}
        </Card>
      )}

      {/* DIVISIONES */}
      {!loading && sec === 'divisiones' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Divisiones ({data.divisiones.length})</SectionTitle>
            <Btn onClick={() => { setFD({ id:null, nombre:'', modalidadId:'', anio:'' }); setModal('division') }}>+ Nueva</Btn>
          </div>
          {data.divisiones.length > 0 ? (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['División','Modalidad','Año','Acciones'].map((h,i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.divisiones.map(d => (
                  <tr key={d.id}>
                    <td style={TD}>{d.nombre}</td>
                    <td style={TD}>{data.modalidades.find(m => m.id===d.modalidadId)?.nombre||d.modalidadId}</td>
                    <td style={TD}>{d.anio||'—'}</td>
                    <td style={TD}>
                      <button onClick={() => { setFD({ id:d.id, nombre:d.nombre, modalidadId:d.modalidadId, anio:d.anio||'' }); setModal('division') }} style={{ ...actionBtn, color:'#2563eb', border:'0.5px solid #bfdbfe' }}>Editar</button>
                      <button onClick={() => eliminarDivision(d.id)} style={{ ...actionBtn, color:'#dc2626', border:'0.5px solid #fecaca' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState text="Sin divisiones" />}
        </Card>
      )}

      {/* MATERIAS */}
      {!loading && sec === 'materias' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Materias ({data.materias.length})</SectionTitle>
            <Btn onClick={() => { setFM({ id:null, nombre:'', modalidadId:'', anio:'' }); setModal('materia') }}>+ Nueva</Btn>
          </div>
          {data.materias.length > 0 ? (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Materia','Modalidad','Año','Acciones'].map((h,i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.materias.map(m => (
                  <tr key={m.id}>
                    <td style={TD}>{m.nombre}</td>
                    <td style={TD}>{data.modalidades.find(x => x.id===m.modalidadId)?.nombre||m.modalidadId}</td>
                    <td style={TD}>{m.anio||'—'}</td>
                    <td style={TD}>
                      <button onClick={() => { setFM({ id:m.id, nombre:m.nombre, modalidadId:m.modalidadId, anio:m.anio||'' }); setModal('materia') }} style={{ ...actionBtn, color:'#2563eb', border:'0.5px solid #bfdbfe' }}>Editar</button>
                      <button onClick={() => eliminarMateria(m.id)} style={{ ...actionBtn, color:'#dc2626', border:'0.5px solid #fecaca' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState text="Sin materias" />}
        </Card>
      )}

      {/* ALUMNOS */}
      {!loading && sec === 'alumnos' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Alumnos</SectionTitle>
            <Btn onClick={() => { setFAl({ id:null, apellido:'', nombre:'', dni:'', divisionId:data.divSeleccionada||'' }); setModal('alumno') }}>+ Nuevo</Btn>
          </div>
          <div style={{ marginBottom:12 }}>
            <Select placeholder="Elegí una división" value={data.divSeleccionada}
              onChange={async v => {
                setData(prev => ({ ...prev, divSeleccionada:v, alumnosFiltrados:null }))
                if (v) {
                  const als = await getAlumnos(v)
                  setData(prev => ({ ...prev, alumnosFiltrados:als, divSeleccionada:v }))
                }
              }}
              options={data.divisiones.map(d => ({ value:d.id, label:d.nombre }))}
            />
          </div>
          {data.alumnosFiltrados?.length > 0 ? (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Apellido','Nombre','DNI','Acciones'].map((h,i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.alumnosFiltrados.map(a => (
                  <tr key={a.id}>
                    <td style={TD}>{a.apellido}</td>
                    <td style={TD}>{a.nombre}</td>
                    <td style={TD}>{a.dni}</td>
                    <td style={TD}>
                      <button onClick={() => { setFAl({ id:a.id, apellido:a.apellido, nombre:a.nombre, dni:a.dni, divisionId:a.divisionId }); setModal('alumno') }} style={{ ...actionBtn, color:'#2563eb', border:'0.5px solid #bfdbfe' }}>Editar</button>
                      <button onClick={() => eliminarAlumno(a.id)} style={{ ...actionBtn, color:'#dc2626', border:'0.5px solid #fecaca' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : data.alumnosFiltrados?.length === 0
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

      {modal === 'editUsuario' && (
        <Modal title="Editar usuario" onClose={() => setModal(null)}>
          <Input label="Nombre completo" value={fUEdit.nombre} onChange={v => setFUEdit(p => ({ ...p, nombre:v }))} />
          <Select label="Rol" value={fUEdit.rol} onChange={v => setFUEdit(p => ({ ...p, rol:v }))} options={ROLES} />
          <p style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>El email no se puede cambiar desde aquí. Para cambiar la contraseña usá Firebase Console.</p>
          <Btn onClick={editarUsuario} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Btn>
        </Modal>
      )}

      {modal === 'modalidad' && (
        <Modal title={fMod.id ? 'Editar modalidad' : 'Nueva modalidad'} onClose={() => setModal(null)}>
          <Input label="Nombre (ej: Gestión del Emprendimiento)" value={fMod.nombre} onChange={v => setFMod(p => ({ ...p, nombre:v }))} />
          <Btn onClick={guardarModalidad} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'division' && (
        <Modal title={fD.id ? 'Editar división' : 'Nueva división'} onClose={() => setModal(null)}>
          <Input label="Nombre (ej: 1°D)" value={fD.nombre} onChange={v => setFD(p => ({ ...p, nombre:v }))} />
          <Select label="Modalidad" value={fD.modalidadId} onChange={v => setFD(p => ({ ...p, modalidadId:v }))}
            options={data.modalidades.map(m => ({ value:m.id, label:m.nombre }))} />
          <Select label="Año" value={fD.anio} onChange={v => setFD(p => ({ ...p, anio:v }))} options={ANIOS} />
          <Btn onClick={guardarDivision} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'materia' && (
        <Modal title={fM.id ? 'Editar materia' : 'Nueva materia'} onClose={() => setModal(null)}>
          <Input label="Nombre" value={fM.nombre} onChange={v => setFM(p => ({ ...p, nombre:v }))} />
          <Select label="Modalidad" value={fM.modalidadId} onChange={v => setFM(p => ({ ...p, modalidadId:v }))}
            options={data.modalidades.map(m => ({ value:m.id, label:m.nombre }))} />
          <Select label="Año" value={fM.anio} onChange={v => setFM(p => ({ ...p, anio:v }))} options={ANIOS} />
          <Btn onClick={guardarMateria} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'alumno' && (
        <Modal title={fAl.id ? 'Editar alumno' : 'Nuevo alumno'} onClose={() => setModal(null)}>
          <Input label="Apellido" value={fAl.apellido} onChange={v => setFAl(p => ({ ...p, apellido:v }))} />
          <Input label="Nombre" value={fAl.nombre} onChange={v => setFAl(p => ({ ...p, nombre:v }))} />
          <Input label="DNI" value={fAl.dni} onChange={v => setFAl(p => ({ ...p, dni:v }))} />
          <Select label="División" value={fAl.divisionId} onChange={v => setFAl(p => ({ ...p, divisionId:v }))}
            options={data.divisiones.map(d => ({ value:d.id, label:d.nombre }))} />
          <Btn onClick={guardarAlumno} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        </Modal>
      )}

      {modal === 'asignacion' && docenteSelec && (
        <Modal title="Asignar materias y divisiones" onClose={() => setModal(null)}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 12px', background:'var(--color-background-secondary)', borderRadius:8 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:'#1d4ed8', flexShrink:0 }}>
              {(docenteSelec.nombre||'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--color-text-primary)' }}>{docenteSelec.nombre}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{docenteSelec.email}</div>
            </div>
          </div>

          <p style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>
            Marcá cada combinación <strong>materia → división</strong> que dicta este docente.
          </p>

          {data.materias.length === 0 || data.divisiones.length === 0
            ? <p style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Primero creá materias y divisiones desde sus respectivas pestañas.</p>
            : <div style={{ maxHeight:360, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
                {data.materias.map(m => (
                  <div key={m.id}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--color-text-primary)', marginBottom:6, padding:'4px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                      {m.nombre}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                      {data.divisiones.map(d => {
                        const on = asignaciones.some(a => a.materiaId === m.id && a.divisionId === d.id)
                        return (
                          <div key={d.id} onClick={() => toggleAsignacion(m.id, d.id)} style={chip(on)}>
                            <div style={checkBox(on)}>{on && <span style={{ color:'white', fontSize:10, fontWeight:700 }}>✓</span>}</div>
                            <span style={chipLabel(on)}>{d.nombre}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
          }

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
