export type AuthRole = 'user' | 'responder' | 'admin'

export type AuthOrganisation = {
  id: string
  orgName: string
}

export type AuthUser = {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: AuthRole
  isVerified: boolean
  organisations: AuthOrganisation[]
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}
