import * as XLSX from 'xlsx'

export function calcularEstado(nota) {
  if (!nota) return { estado: 'sin_nota', label: 'Sin nota', color: '#9ca3af' }
  const c1 = parseFloat(nota.c1Final)
  const c2 = parseFloat(nota.c2Final)
  if (!isNaN(c1) && !isNaN(c2)) {
    if (c1 >= 7 && c2 >= 7) return { estado: 'promocionado', label: 'Promoc.', color: '#15803d' }
    return { estado: 'a_mesa', label: 'Mesa', color: '#d97706' }
  }
  if (!isNaN(c1)) return { estado: 'c1_ok', label: `C1: ${c1}`, color: '#2563eb' }
  return { estado: 'sin_nota', label: 'Sin nota', color: '#9ca3af' }
}

export function calcularPromedio(notas) {
  const valores = notas.map(n => {
    const c1 = parseFloat(n?.c1Final), c2 = parseFloat(n?.c2Final)
    if (!isNaN(c1) && !isNaN(c2)) return (c1 + c2) / 2
    if (!isNaN(c1)) return c1
    return null
  }).filter(v => v !== null)
  if (!valores.length) return null
  return +(valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)
}

export function estadisticasCurso(notasAlumnos) {
  let promocionados = 0, aMesa = 0, sinNota = 0
  notasAlumnos.forEach(({ notas }) => {
    const estados = notas.map(({ nota }) => calcularEstado(nota).estado)
    if (estados.length && estados.every(e => e === 'promocionado')) promocionados++
    else if (estados.some(e => e === 'a_mesa')) aMesa++
    else sinNota++
  })
  return { total: notasAlumnos.length, promocionados, aMesa, sinNota }
}

export function exportarPlanillaAlumno(alumno, materias, notas, ciclo) {
  const wb = XLSX.utils.book_new()
  const header = [
    ['CENS 451', '', `Ciclo ${ciclo}`], [],
    ['Alumno:', `${alumno.apellido} ${alumno.nombre}`, '', 'DNI:', alumno.dni], [],
    ['Materia', '1° Inf.', '1° Cuat', 'Final C1', 'Turno Ago.', 'Turno Dic.', 'Turno Feb.',
     'Saberes enseñados C1', 'Aprend. alcanzados C1', 'Aprend. pendientes C1',
     '2° Inf.', '2° Cuat', 'Final C2', 'Turno Dic.', 'Turno Feb.',
     'Saberes enseñados C2', 'Aprend. alcanzados C2', 'Aprend. pendientes C2', 'Estado']
  ]
  const filas = materias.map(m => {
    const n = notas.find(x => x.materiaId === m.id) || {}
    return [m.nombre,
      n.c1Informe||'', n.c1Cuatrimestre||'', n.c1Final||'',
      n.c1TurnoAgosto||'', n.c1TurnoDic||'', n.c1TurnoFeb||'',
      n.c1SaberesEnseniados||'', n.c1AprendizajesAlcanzados||'', n.c1AprendizajesPendientes||'',
      n.c2Informe||'', n.c2Cuatrimestre||'', n.c2Final||'',
      n.c2TurnoDic||'', n.c2TurnoFeb||'',
      n.c2SaberesEnseniados||'', n.c2AprendizajesAlcanzados||'', n.c2AprendizajesPendientes||'',
      calcularEstado(n).label]
  })
  const ws = XLSX.utils.aoa_to_sheet([...header, ...filas])
  ws['!cols'] = [{ wch: 30 }, ...Array(18).fill({ wch: 14 })]
  XLSX.utils.book_append_sheet(wb, ws, alumno.apellido.substring(0, 31))
  XLSX.writeFile(wb, `Boletin_${alumno.apellido}_${alumno.nombre}_${ciclo}.xlsx`)
}

export function exportarPlanillaCurso(division, materias, alumnos, notasPorAlumno, ciclo) {
  const wb = XLSX.utils.book_new()
  materias.forEach(materia => {
    const filas = alumnos.map((al, i) => {
      const n = (notasPorAlumno[al.id] || []).find(x => x.materiaId === materia.id) || {}
      return [i + 1, `${al.apellido} ${al.nombre}`, al.dni,
        n.c1Informe||'', n.c1Cuatrimestre||'', n.c1Final||'',
        n.c1TurnoAgosto||'', n.c1TurnoDic||'', n.c1TurnoFeb||'',
        n.c1SaberesEnseniados||'', n.c1AprendizajesAlcanzados||'', n.c1AprendizajesPendientes||'',
        n.c2Informe||'', n.c2Cuatrimestre||'', n.c2Final||'',
        n.c2TurnoDic||'', n.c2TurnoFeb||'',
        n.c2SaberesEnseniados||'', n.c2AprendizajesAlcanzados||'', n.c2AprendizajesPendientes||'',
        calcularEstado(n).label]
    })
    const header = [
      [`Ciclo ${ciclo}`, 'CENS 451', '', materia.nombre], [],
      ['N°', 'Alumno', 'DNI',
       '1° Inf', '1° Cuat', 'Final C1', 'Ago.', 'Dic.', 'Feb.',
       'Saberes C1', 'Alc. C1', 'Pend. C1',
       '2° Inf', '2° Cuat', 'Final C2', 'Dic.', 'Feb.',
       'Saberes C2', 'Alc. C2', 'Pend. C2', 'Estado']
    ]
    const ws = XLSX.utils.aoa_to_sheet([...header, ...filas])
    ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 12 }, ...Array(18).fill({ wch: 12 })]
    XLSX.utils.book_append_sheet(wb, ws, materia.nombre.substring(0, 31))
  })
  XLSX.writeFile(wb, `Notas_${division.nombre}_${ciclo}.xlsx`)
}

export function exportarInformeDocente(docente, materias, notas, ciclo) {
  const wb = XLSX.utils.book_new()
  const filas = [
    [`Informe docente: ${docente.nombre || docente.email}`, '', `Ciclo ${ciclo}`], [],
    ['Materia', 'Total alumnos', 'Promocionados', 'A mesa', '% Promoción']
  ]
  materias.forEach(m => {
    const ns = notas.filter(n => n.materiaId === m.id)
    const promo = ns.filter(n => calcularEstado(n).estado === 'promocionado').length
    const mesa = ns.filter(n => calcularEstado(n).estado === 'a_mesa').length
    const pct = ns.length ? Math.round(promo / ns.length * 100) : 0
    filas.push([m.nombre, ns.length, promo, mesa, `${pct}%`])
  })
  const ws = XLSX.utils.aoa_to_sheet(filas)
  ws['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
  XLSX.writeFile(wb, `Informe_${(docente.nombre || docente.email).replace(/\s/g, '_')}_${ciclo}.xlsx`)
}

export function exportarInformeAnual(divisiones, materias, alumnos, todasNotas, ciclo) {
  const wb = XLSX.utils.book_new()
  const filas = [
    [`Informe Anual CENS 451 – Ciclo ${ciclo}`], [],
    ['División', 'Modalidad', 'Total alumnos', 'Promocionados', 'A mesa', '% Promoción']
  ]
  divisiones.forEach(div => {
    const alsDiv = alumnos.filter(a => a.divisionId === div.id)
    const matsDiv = materias.filter(m => m.modalidadId === div.modalidadId)
    const notasDiv = todasNotas.filter(n => n.divisionId === div.id)
    let promo = 0
    alsDiv.forEach(al => {
      const notasAl = notasDiv.filter(n => n.alumnoId === al.id)
      const ok = matsDiv.length > 0 && matsDiv.every(m => {
        const nota = notasAl.find(n => n.materiaId === m.id)
        return calcularEstado(nota).estado === 'promocionado'
      })
      if (ok) promo++
    })
    const pct = alsDiv.length ? Math.round(promo / alsDiv.length * 100) : 0
    filas.push([div.nombre, div.modalidadId, alsDiv.length, promo, alsDiv.length - promo, `${pct}%`])
  })
  const ws = XLSX.utils.aoa_to_sheet(filas)
  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen anual')
  XLSX.writeFile(wb, `Informe_Anual_CENS451_${ciclo}.xlsx`)
}
