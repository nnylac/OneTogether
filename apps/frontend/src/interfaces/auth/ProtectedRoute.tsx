import { Outlet } from 'react-router-dom'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { useAuth } from './useAuth'
import type { AuthRole } from './types'

export function ProtectedRoute({ allowedRoles }: { allowedRoles: AuthRole[] }) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />
  }

  return <Outlet />
}
