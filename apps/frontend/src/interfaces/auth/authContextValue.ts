import { createContext } from 'react'
import type { AuthUser } from './types'

export type AuthContextValue = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (input: { identifier: string; password: string }) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
