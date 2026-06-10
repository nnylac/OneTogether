import { Bell, FolderOpen, Grid2X2, Map, Shield, Siren } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ConsoleLayout } from '../../../components/layout/ConsoleLayout'
import type { ConsoleNavItem, ConsoleSidebarTheme } from '../../../components/layout/ConsoleSidebar'
import { useAuth } from '../../auth/useAuth'
import {
  fetchUnreadResponderNotificationCount,
  isResponderOrganisationNotification,
  subscribeToResponderNotificationCreated,
} from '../notifications/api/responderNotificationsApi'

const navItems: ConsoleNavItem[] = [
  { label: 'Dashboard', href: '/responder', icon: Grid2X2, end: true },
  { label: 'Incidents', href: '/responder/incidents', icon: Siren },
  { label: 'Map', href: '/responder/map', icon: Map },
  { label: 'Resources', href: '/responder/resources', icon: FolderOpen },
  { label: 'Notifications', href: '/responder/notifications', icon: Bell },
]

const sidebarTheme: ConsoleSidebarTheme = {
  activeBg: '#f0e7ff',
  activeBorder: '#7c3aed',
  activeColor: '#6d28d9',
  hoverBg: 'purple.50',
  hoverColor: 'purple.700',
}

export function ResponderLayout() {
  const { user } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)
  const organisationId =
    user?.userOrganisationId ?? user?.organisations[0]?.id ?? undefined

  const refreshNotificationCount = useCallback(() => {
    if (!organisationId) {
      setNotificationCount(0)
      return
    }

    fetchUnreadResponderNotificationCount(organisationId)
      .then(setNotificationCount)
      .catch(() => setNotificationCount(0))
  }, [organisationId])

  useEffect(() => {
    refreshNotificationCount()

    const intervalId = window.setInterval(refreshNotificationCount, 30000)
    window.addEventListener('responder-notification-read', refreshNotificationCount)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('responder-notification-read', refreshNotificationCount)
    }
  }, [refreshNotificationCount])

  useEffect(() => {
    if (!organisationId) {
      return undefined
    }

    return subscribeToResponderNotificationCreated(
      (notification) => {
        if (isResponderOrganisationNotification(notification, organisationId)) {
          setNotificationCount((currentCount) => currentCount + 1)
        }
      },
      refreshNotificationCount,
    )
  }, [organisationId, refreshNotificationCount])

  const handleNotificationsClick = useCallback(() => {
    setNotificationCount(0)
  }, [])

  const responderNavItems = useMemo(
    () =>
      navItems.map((item) => {
        if (item.label !== 'Notifications') {
          return item
        }

        return {
          ...item,
          badgeCount: notificationCount,
          onClick: handleNotificationsClick,
        }
      }),
    [handleNotificationsClick, notificationCount],
  )

  return (
    <ConsoleLayout
      brandIcon={Shield}
      brandSubtitle="Together as One"
      navItems={responderNavItems}
      theme={sidebarTheme}
    />
  )
}
