import type { AuthSession } from './types'

const accessTokenKey = 'onetogether.accessToken'
const refreshTokenKey = 'onetogether.refreshToken'
const userKey = 'onetogether.currentUser'

export function loadAuthSession(): AuthSession | null {
  const accessToken = localStorage.getItem(accessTokenKey)
  const refreshToken = localStorage.getItem(refreshTokenKey)
  const userJson = localStorage.getItem(userKey)

  if (!accessToken || !refreshToken || !userJson) {
    return null
  }

  try {
    return {
      accessToken,
      refreshToken,
      user: JSON.parse(userJson) as AuthSession['user'],
    }
  } catch {
    clearAuthSession()
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(accessTokenKey, session.accessToken)
  localStorage.setItem(refreshTokenKey, session.refreshToken)
  localStorage.setItem(userKey, JSON.stringify(session.user))
}

export function clearAuthSession() {
  localStorage.removeItem(accessTokenKey)
  localStorage.removeItem(refreshTokenKey)
  localStorage.removeItem(userKey)
}
