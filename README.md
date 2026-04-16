# CENS 451 · Sistema de Gestión de Notas

App web para carga, consulta y generación de informes de notas.  
Stack: React + Vite · Firebase (Auth + Firestore) · GitHub Pages

---

## 1. Crear proyecto Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. **Crear proyecto** → nombre: `cens451-notas` → continuar (sin Google Analytics si querés)
3. En el menú lateral: **Authentication** → Empezar → activar **Email/Contraseña**
4. En el menú lateral: **Firestore Database** → Crear base de datos → **Modo producción** → elegir región `southamerica-east1` (São Paulo, la más cercana)
5. En el menú lateral: **Configuración del proyecto** (ícono ⚙️) → pestaña **General** → sección "Tus apps" → icono `</>` (web) → registrar app → copiar el objeto `firebaseConfig`

## 2. Pegar credenciales

Abrir `src/firebase/config.js` y reemplazar los valores del objeto `firebaseConfig` con los que copiaste en el paso anterior.

## 3. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/cens-notas/`

## 4. Configurar reglas y índices de Firestore

### Reglas de seguridad
En Firebase Console → Firestore → pestaña **Reglas** → pegar el contenido de `firestore.rules` → Publicar.

### Índices compuestos
En Firebase Console → Firestore → pestaña **Índices** → **Importar** → subir `firestore.indexes.json`.  
*(Alternativamente, los índices se crean automáticamente la primera vez que se hace una consulta que los necesita — Firebase muestra un enlace en la consola del navegador.)*

## 5. Crear el primer usuario administrador

Desde Firebase Console → Authentication → **Agregar usuario** manualmente:
- Email: tu email
- Contraseña: la que elijas

Luego en Firestore → colección `usuarios` → **Agregar documento**:
- ID del documento: el UID que aparece en Authentication
- Campos:
  - `email` (string): tu email
  - `nombre` (string): tu nombre
  - `rol` (string): `admin`

Una vez logueado como admin, podés crear el resto de los usuarios desde la sección **Administración** de la app.

## 6. Cargar la estructura inicial

Desde **Administración → Modalidades**, crear las 2 modalidades:
- Gestión del Emprendimiento
- Administración Pública

Desde **Administración → Divisiones**, cargar las 34 divisiones (nombre + modalidad + año).

Desde **Administración → Materias**, cargar las materias por modalidad y año.

Desde **Administración → Usuarios**, crear docentes, directivos y preceptores.

## 7. Asignar divisiones y materias a cada docente

Por ahora esto se hace directamente en Firestore: en el documento del usuario (colección `usuarios`), agregar:
- `divisiones` (array de IDs de divisiones)
- `materias` (array de IDs de materias)

*(En una próxima versión se puede agregar esta pantalla a la UI de admin.)*

## 8. Publicar en GitHub Pages

```bash
# Asegurate de tener gh-pages instalado
npm install

# Cambiá el base en vite.config.js si tu repo tiene otro nombre
# base: '/nombre-de-tu-repo/'

# Deploy
npm run deploy
```

Esto construye y publica en la rama `gh-pages` de tu repo.  
La app queda en: `https://tu-usuario.github.io/cens-notas/`

---

## Estructura del proyecto

```
src/
├── firebase/
│   ├── config.js        ← credenciales Firebase (completar)
│   └── service.js       ← todas las operaciones Firestore
├── hooks/
│   └── useAuth.jsx      ← contexto de autenticación y roles
├── utils/
│   └── notas.js         ← lógica de promoción, promedios, exportación xlsx
├── components/
│   ├── UI.jsx           ← componentes reutilizables (Card, Input, Tabla, Modal...)
│   ├── Layout.jsx       ← wrapper con sidebar
│   └── Sidebar.jsx      ← navegación lateral con roles
└── pages/
    ├── Login.jsx         ← pantalla de login
    ├── Home.jsx          ← dashboard de inicio
    ├── CargarNotas.jsx   ← carga de notas (docentes)
    ├── ConsultarNotas.jsx← consulta por curso o alumno
    ├── Informes.jsx      ← informes y exportación (directivos)
    └── AdminEstructura.jsx ← gestión de usuarios, divisiones, materias
```

## Estructura Firestore

```
/usuarios/{uid}
  email, nombre, rol, divisiones[], materias[]

/modalidades/{id}
  nombre

/divisiones/{id}
  nombre, modalidadId, anio

/materias/{id}
  nombre, modalidadId, anio

/alumnos/{id}
  apellido, nombre, dni, divisionId

/notas/{alumnoId_materiaId_ciclo}
  alumnoId, materiaId, divisionId, docenteUid, ciclo
  c1Informe, c1Cuatrimestre, c1Final
  c1TurnoAgosto, c1TurnoDic, c1TurnoFeb
  c1SaberesEnseniados, c1AprendizajesAlcanzados, c1AprendizajesPendientes
  c2Informe, c2Cuatrimestre, c2Final
  c2TurnoDic, c2TurnoFeb
  c2SaberesEnseniados, c2AprendizajesAlcanzados, c2AprendizajesPendientes
  updatedAt
```

## Roles y permisos

| Función             | Admin | Directivo | Docente | Preceptor |
|---------------------|-------|-----------|---------|-----------|
| Cargar notas        | ✓     |           | ✓ (sus materias) |     |
| Consultar notas     | ✓     | ✓         | ✓       | ✓         |
| Ver informes        | ✓     | ✓         |         |           |
| Exportar xlsx       | ✓     | ✓         |         |           |
| Gestionar usuarios  | ✓     |           |         |           |
| Gestionar estructura| ✓     |           |         |           |

## Lógica de promoción

Un alumno **promociona** una materia si obtiene **7 o más** en el final del 1° cuatrimestre **y** 7 o más en el final del 2° cuatrimestre.  
Si no, figura como **"Mesa"** (va a turno de examen).
