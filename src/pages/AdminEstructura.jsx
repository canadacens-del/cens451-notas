import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getUsuarios, setUsuario, getDivisiones, setDivision, deleteDivision, getMaterias, setMateria, deleteMateria, getModalidades, setModalidad, setAlumno, getAlumnos, importarAlumnos } from '../firebase/service'
import { PageTitle, Card, SectionTitle, Input, Select, Btn, Tabla, Modal, Loading, EmptyState } from '../components/UI'

const ROLES = [{value:'admin',label:'Administrador'},{value:'directivo',label:'Directivo'},{value:'docente',label:'Docente'},{value:'preceptor',label:'Preceptor'}]
const ANIOS = ['1°','2°','3°'].map(a=>({value:a,label:a}))

export default function AdminEstructura() {
  const [sec, setSec] = useState('usuarios')
  const [data, setData] = useState({ usuarios:[], divisiones:[], materias:[], modalidades:[] })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fU, setFU] = useState({ email:'', password:'', nombre:'', rol:'docente' })
  const [fD, setFD] = useState({ nombre:'', modalidadId:'', anio:'' })
  const [fM, setFM] = useState({ nombre:'', modalidadId:'', anio:'' })
  const [fMod, setFMod] = useState({ nombre:'' })
  const [fAl, setFAl] = useState({ apellido:'', nombre:'', dni:'', divisionId:'' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [us,divs,mats,mods] = await Promise.all([getUsuarios(), getDivisiones(), getMaterias(), getModalidades()])
    setData({ usuarios:us, divisiones:divs, materias:mats, modalidades:mods })
    setLoading(false)
  }

  async function crearUsuario() {
    setSaving(true); setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, fU.email, fU.password)
      await setUsuario(cred.user.uid, { email:fU.email, nombre:fU.nombre, rol:fU.rol })
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

  const SECS = [
    { k:'usuarios', l:'👤 Usuarios' },
    { k:'modalidades', l:'🏛 Modalidades' },
    { k:'divisiones', l:'🏫 Divisiones' },
    { k:'materias', l:'📖 Materias' },
    { k:'alumnos', l:'🎒 Alumnos' },
  ]

  return (
    <div>
      <PageTitle>Administración</PageTitle>
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {SECS.map(s=>(
          <button key={s.k} onClick={()=>setSec(s.k)} style={{ padding:'8px 16px', borderRadius:8, fontSize:14, cursor:'pointer', background:sec===s.k?'#1e293b':'white', color:sec===s.k?'white':'#374151', border:sec===s.k?'none':'1px solid #d1d5db', fontWeight:sec===s.k?600:400 }}>{s.l}</button>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && sec==='usuarios' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Usuarios ({data.usuarios.length})</SectionTitle>
            <Btn onClick={()=>setModal('usuario')}>+ Nuevo</Btn>
          </div>
          {data.usuarios.length>0
            ? <Tabla headers={['Nombre','Email','Rol']} rows={data.usuarios.map(u=>[u.nombre||'—',u.email,u.rol])} />
            : <EmptyState text="Sin usuarios aún" />}
        </Card>
      )}

      {!loading && sec==='modalidades' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Modalidades ({data.modalidades.length})</SectionTitle>
            <Btn onClick={()=>setModal('modalidad')}>+ Nueva</Btn>
          </div>
          {data.modalidades.length>0
            ? <Tabla headers={['ID','Nombre']} rows={data.modalidades.map(m=>[m.id,m.nombre])} />
            : <EmptyState text="Creá una modalidad primero" />}
        </Card>
      )}

      {!loading && sec==='divisiones' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Divisiones ({data.divisiones.length})</SectionTitle>
            <Btn onClick={()=>setModal('division')}>+ Nueva</Btn>
          </div>
          {data.divisiones.length>0
            ? <Tabla headers={['División','Modalidad','Año']} rows={data.divisiones.map(d=>[d.nombre, data.modalidades.find(m=>m.id===d.modalidadId)?.nombre||d.modalidadId, d.anio||'—'])} />
            : <EmptyState text="Sin divisiones" />}
        </Card>
      )}

      {!loading && sec==='materias' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Materias ({data.materias.length})</SectionTitle>
            <Btn onClick={()=>setModal('materia')}>+ Nueva</Btn>
          </div>
          {data.materias.length>0
            ? <Tabla headers={['Materia','Modalidad','Año']} rows={data.materias.map(m=>[m.nombre, data.modalidades.find(x=>x.id===m.modalidadId)?.nombre||m.modalidadId, m.anio||'—'])} />
            : <EmptyState text="Sin materias" />}
        </Card>
      )}

      {!loading && sec==='alumnos' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <SectionTitle>Alumnos</SectionTitle>
            <Btn onClick={()=>setModal('alumno')}>+ Nuevo</Btn>
          </div>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
            Seleccioná una división para ver sus alumnos.
          </p>
          <Select placeholder="Elegí una división" value="" onChange={async v => {
            if (!v) return
            const als = await getAlumnos(v)
            setData(prev => ({ ...prev, _alumnosFiltrados: als, _divSeleccionada: v }))
          }} options={data.divisiones.map(d=>({value:d.id,label:d.nombre}))} />
          {data._alumnosFiltrados?.length > 0
            ? <Tabla headers={['Apellido','Nombre','DNI']} rows={data._alumnosFiltrados.map(a=>[a.apellido,a.nombre,a.dni])} />
            : data._alumnosFiltrados?.length === 0 ? <EmptyState text="Sin alumnos en esta división" /> : null}
        </Card>
      )}

      {/* MODALES */}
      {modal==='usuario' && (
        <Modal title="Nuevo usuario" onClose={()=>{setModal(null);setError('')}}>
          <Input label="Nombre completo" value={fU.nombre} onChange={v=>setFU(p=>({...p,nombre:v}))} />
          <Input label="Email" type="email" value={fU.email} onChange={v=>setFU(p=>({...p,email:v}))} />
          <Input label="Contraseña temporal" type="password" value={fU.password} onChange={v=>setFU(p=>({...p,password:v}))} />
          <Select label="Rol" value={fU.rol} onChange={v=>setFU(p=>({...p,rol:v}))} options={ROLES} />
          {error && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12, background:'#fef2f2', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
          <Btn onClick={crearUsuario} disabled={saving}>{saving?'Creando...':'Crear usuario'}</Btn>
        </Modal>
      )}
      {modal==='modalidad' && (
        <Modal title="Nueva modalidad" onClose={()=>setModal(null)}>
          <Input label="Nombre (ej: Gestión del Emprendimiento)" value={fMod.nombre} onChange={v=>setFMod({nombre:v})} />
          <Btn onClick={guardarModalidad} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn>
        </Modal>
      )}
      {modal==='division' && (
        <Modal title="Nueva división" onClose={()=>setModal(null)}>
          <Input label="Nombre (ej: 1°D)" value={fD.nombre} onChange={v=>setFD(p=>({...p,nombre:v}))} />
          <Select label="Modalidad" value={fD.modalidadId} onChange={v=>setFD(p=>({...p,modalidadId:v}))} options={data.modalidades.map(m=>({value:m.id,label:m.nombre}))} />
          <Select label="Año" value={fD.anio} onChange={v=>setFD(p=>({...p,anio:v}))} options={ANIOS} />
          <Btn onClick={guardarDivision} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn>
        </Modal>
      )}
      {modal==='materia' && (
        <Modal title="Nueva materia" onClose={()=>setModal(null)}>
          <Input label="Nombre" value={fM.nombre} onChange={v=>setFM(p=>({...p,nombre:v}))} />
          <Select label="Modalidad" value={fM.modalidadId} onChange={v=>setFM(p=>({...p,modalidadId:v}))} options={data.modalidades.map(m=>({value:m.id,label:m.nombre}))} />
          <Select label="Año" value={fM.anio} onChange={v=>setFM(p=>({...p,anio:v}))} options={ANIOS} />
          <Btn onClick={guardarMateria} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn>
        </Modal>
      )}
      {modal==='alumno' && (
        <Modal title="Nuevo alumno" onClose={()=>setModal(null)}>
          <Input label="Apellido" value={fAl.apellido} onChange={v=>setFAl(p=>({...p,apellido:v}))} />
          <Input label="Nombre" value={fAl.nombre} onChange={v=>setFAl(p=>({...p,nombre:v}))} />
          <Input label="DNI" value={fAl.dni} onChange={v=>setFAl(p=>({...p,dni:v}))} />
          <Select label="División" value={fAl.divisionId} onChange={v=>setFAl(p=>({...p,divisionId:v}))} options={data.divisiones.map(d=>({value:d.id,label:d.nombre}))} />
          <Btn onClick={guardarAlumno} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn>
        </Modal>
      )}
    </div>
  )
}
