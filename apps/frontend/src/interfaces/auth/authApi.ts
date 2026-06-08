import type { AuthRole, AuthSession, AuthUser } from './types'

type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    role: string
    is_verified: boolean
    userOrganisationId?: string | null
    organisations?: Array<{
      id: string
      orgName: string
    }>
  }
}

export async function loginWithPassword(input: {
  identifier: string
  password: string
}): Promise<AuthSession> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as LoginResponse

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapAuthUser(data.user),
  }
}

export async function logoutWithRefreshToken(refreshToken: string) {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
}

async function getErrorMessage(response: Response) {
  try {
    const errorBody = (await response.json()) as { message?: string }
    return errorBody.message ?? 'Login failed'
  } catch {
    return 'Login failed'
  }
}

function mapAuthUser(user: LoginResponse['user']): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    role: normalizeRole(user.role),
    isVerified: user.is_verified,
    userOrganisationId: user.userOrganisationId ?? null,
    organisations: user.organisations ?? [],
  }
}

function normalizeRole(role: string): AuthRole {
  if (role === 'user' || role === 'responder' || role === 'admin') {
    return role
  }

  throw new Error('Unsupported user role')
}
