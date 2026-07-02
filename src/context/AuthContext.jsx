import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (email, password, nombre, extra = {}) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          ...extra,
          perfil_completo: true
        }
      }
    })
    if (error) throw error
  }

  const loginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // No pedimos scopes extra — solo el email
        scopes: 'email',
        queryParams: {
          // Forzar que siempre pida elegir cuenta
          prompt: 'select_account'
        }
      }
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  // Verificar si el perfil está completo
  const perfilCompleto = usuario?.user_metadata?.perfil_completo === true

  return (
    <AuthContext.Provider value={{ usuario, login, register, loginGoogle, logout, cargando, perfilCompleto }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
