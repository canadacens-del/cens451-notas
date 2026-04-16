import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from './config'

export async function getUsuario(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export async function setUsuario(uid, data) {
  await setDoc(doc(db, 'usuarios', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
export async function getUsuarios() {
  const snap = await getDocs(collection(db, 'usuarios'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getModalidades() {
  const snap = await getDocs(query(collection(db, 'modalidades'), orderBy('nombre')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function setModalidad(id, data) {
  await setDoc(doc(db, 'modalidades', id), data, { merge: true })
}

export async function getDivisiones(modalidadId = null) {
  const ref = collection(db, 'divisiones')
  const q = modalidadId
    ? query(ref, where('modalidadId', '==', modalidadId), orderBy('nombre'))
    : query(ref, orderBy('nombre'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function setDivision(id, data) {
  await setDoc(doc(db, 'divisiones', id), data, { merge: true })
}
export async function deleteDivision(id) {
  await deleteDoc(doc(db, 'divisiones', id))
}

export async function getMaterias(modalidadId = null, anio = null) {
  const ref = collection(db, 'materias')
  let q
  if (modalidadId && anio) q = query(ref, where('modalidadId', '==', modalidadId), where('anio', '==', anio), orderBy('nombre'))
  else if (modalidadId) q = query(ref, where('modalidadId', '==', modalidadId), orderBy('nombre'))
  else q = query(ref, orderBy('nombre'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function setMateria(id, data) {
  await setDoc(doc(db, 'materias', id), data, { merge: true })
}
export async function deleteMateria(id) {
  await deleteDoc(doc(db, 'materias', id))
}

export async function getAlumnos(divisionId) {
  const q = query(collection(db, 'alumnos'), where('divisionId', '==', divisionId), orderBy('apellido'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getAllAlumnos() {
  const snap = await getDocs(query(collection(db, 'alumnos'), orderBy('apellido')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function setAlumno(id, data) {
  const ref = id ? doc(db, 'alumnos', id) : doc(collection(db, 'alumnos'))
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  return ref.id
}
export async function deleteAlumno(id) {
  await deleteDoc(doc(db, 'alumnos', id))
}
export async function importarAlumnos(alumnos) {
  const batch = writeBatch(db)
  alumnos.forEach(a => {
    const ref = doc(collection(db, 'alumnos'))
    batch.set(ref, { ...a, updatedAt: serverTimestamp() })
  })
  await batch.commit()
}

export function notaId(alumnoId, materiaId, ciclo) {
  return `${alumnoId}_${materiaId}_${ciclo}`
}
export async function getNotasPorDivisionMateria(divisionId, materiaId, ciclo) {
  const q = query(collection(db, 'notas'),
    where('divisionId', '==', divisionId),
    where('materiaId', '==', materiaId),
    where('ciclo', '==', ciclo))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getNotasPorAlumno(alumnoId, ciclo) {
  const q = query(collection(db, 'notas'), where('alumnoId', '==', alumnoId), where('ciclo', '==', ciclo))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getNotasPorDivision(divisionId, ciclo) {
  const q = query(collection(db, 'notas'), where('divisionId', '==', divisionId), where('ciclo', '==', ciclo))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getNotasPorDocente(docenteUid, ciclo) {
  const q = query(collection(db, 'notas'), where('docenteUid', '==', docenteUid), where('ciclo', '==', ciclo))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function guardarNotasBatch(notasArray) {
  const batch = writeBatch(db)
  notasArray.forEach(({ alumnoId, materiaId, divisionId, docenteUid, ciclo, ...data }) => {
    const id = notaId(alumnoId, materiaId, ciclo)
    batch.set(doc(db, 'notas', id), {
      alumnoId, materiaId, divisionId, docenteUid, ciclo,
      ...data, updatedAt: serverTimestamp()
    }, { merge: true })
  })
  await batch.commit()
}
