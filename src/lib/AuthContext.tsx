import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { type UserResponse, getMe, login, logout, setAuthToken } from '@/lib/authApi'
import { apiClient } from '@/lib/apiClient'

// ---- Types ----

interface AuthState {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Clé rôle : accès rapide pour les guards et le menu */
  role: 'admin' | 'manager' | null
}

// ---- Constantes ----

const TOKEN_KEY = 'hb_auth_token'

// ---- Context ----

const AuthContext = createContext<AuthContextValue | null>(null)

// ---- Provider ----

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // true au démarrage : on recharge le token stocké
  })

  /** Recharge le token depuis localStorage et récupère le profil */
  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    try {
      setAuthToken(storedToken)
      const user = await getMe()
      setState({ user, token: storedToken, isAuthenticated: true, isLoading: false })
    } catch {
      // Token expiré ou révoqué → nettoyage silencieux
      localStorage.removeItem(TOKEN_KEY)
      setAuthToken(null)
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      void restoreSession()
    }, 0)
  }, [restoreSession])

  /** EF-AUTH-10 : intercepter les 401 → déconnexion automatique (session expirée) */
  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error?.status === 401 && state.isAuthenticated) {
          localStorage.removeItem(TOKEN_KEY)
          setAuthToken(null)
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
        return Promise.reject(error)
      },
    )
    return () => apiClient.interceptors.response.eject(id)
  }, [state.isAuthenticated])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await login(email, password)
    localStorage.setItem(TOKEN_KEY, res.token)
    setAuthToken(res.token)
    setState({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false })
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setAuthToken(null)
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  const value: AuthContextValue = {
    ...state,
    role: state.user?.role ?? null,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---- Hook ----

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
