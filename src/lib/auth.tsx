import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { Role } from '@/lib/types'
import { getStoredToken, setStoredToken } from '@/lib/token'

interface AuthContextValue {
  role: Role
  token: string | null
  isEditor: boolean
  loading: boolean
  login: (secret: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [role, setRole] = useState<Role>('reader')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (current: string | null) => {
    try {
      const me = await api.me(current)
      setRole(me.role)
      if (me.role !== 'editor') {
        setStoredToken(null)
        setToken(null)
      }
    } catch {
      setRole('reader')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(token)
  }, [token, refresh])

  const login = useCallback(async (secret: string) => {
    const res = await api.login(secret)
    setStoredToken(res.token)
    setToken(res.token)
    setRole('editor')
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    setToken(null)
    setRole('reader')
  }, [])

  const value = useMemo(
    () => ({
      role,
      token,
      isEditor: role === 'editor',
      loading,
      login,
      logout,
    }),
    [role, token, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
