import {
  useCallback,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { loginWithPassword, logoutWithRefreshToken } from './authApi'
import { AuthContext } from './authContextValue'
import type { AuthContextValue } from './authContextValue'
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from './authStorage'
import type { AuthSession } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )

  const login = useCallback(
    async (input: { identifier: string; password: string }) => {
      const nextSession = await loginWithPassword(input)
      saveAuthSession(nextSession)
      setSession(nextSession)
      return nextSession.user
    },
    [],
  )

  const logout = useCallback(() => {
    if (session?.refreshToken) {
      void logoutWithRefreshToken(session.refreshToken).catch(() => undefined)
    }

    clearAuthSession()
    setSession(null)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken && session.user),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
