import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getUsuario } from '../firebase/service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const p = await getUsuario(firebaseUser.uid)
        setPerfil(p)
      } else {
        setUser(null)
        setPerfil(null)
      }
      setLoading(false)
    })
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const p = await getUsuario(cred.user.uid)
    setPerfil(p)
    return p
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
export function puedeCargar(p) { return p?.rol === 'admin' || p?.rol === 'docente' }
export function puedeVerTodo(p) { return p?.rol === 'admin' || p?.rol === 'directivo' }
export function puedeEmitirInformes(p) { return p?.rol === 'admin' || p?.rol === 'directivo' }
