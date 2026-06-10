import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BarChart3,
  Building2,
  Grid2X2,
  Map,
  RadioTower,
  Shield,
  Siren,
  AlarmClock
} from 'lucide-react'
import { ConsoleLayout } from '../../../components/layout/ConsoleLayout'
import type { ConsoleNavItem, ConsoleSidebarTheme } from '../../../components/layout/ConsoleSidebar'
import { fetchGovernmentAlertRules } from '../alerts/api/governmentAlertRulesApi'

const navItems: ConsoleNavItem[] = [
  { label: 'Dashboard', href: '/government', icon: Grid2X2, end: true },
  { label: 'Incidents', href: '/government/incidents', icon: Siren },
  { label: 'Map', href: '/government/map', icon: Map },
  { label: 'Broadcasts', href: '/government/broadcasts', icon: RadioTower },
  { label: 'Organisations', href: '/government/organisations', icon: Building2 },
  { label: 'Analytics', href: '/government/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/government/alerts', icon: AlarmClock},
]

const sidebarTheme: ConsoleSidebarTheme = {
  activeBg: '#e0f2fe',
  activeBorder: '#0284c7',
  activeColor: '#075985',
  hoverBg: 'blue.50',
  hoverColor: 'blue.700',
}

export function GovernmentLayout() {
  const [alertNotificationCount, setAlertNotificationCount] = useState(0)

  const refreshAlertNotificationCount = useCallback(() => {
    fetchGovernmentAlertRules()
      .then((alerts) => {
        setAlertNotificationCount(
          alerts.filter((alert) => alert.status === 'Critical').length,
        )
      })
      .catch(() => setAlertNotificationCount(0))
  }, [])

  const handleGovernmentAlertNotificationCreated = useCallback(() => {
    setAlertNotificationCount((currentCount) => currentCount + 1)
  }, [])

  useEffect(() => {
    refreshAlertNotificationCount()

    const intervalId = window.setInterval(refreshAlertNotificationCount, 30000)
    window.addEventListener(
      'government-alert-notification-created',
      handleGovernmentAlertNotificationCreated,
    )
    window.addEventListener(
      'government-alert-rules-changed',
      refreshAlertNotificationCount,
    )

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener(
        'government-alert-notification-created',
        handleGovernmentAlertNotificationCreated,
      )
      window.removeEventListener(
        'government-alert-rules-changed',
        refreshAlertNotificationCount,
      )
    }
  }, [handleGovernmentAlertNotificationCreated, refreshAlertNotificationCount])

  const governmentNavItems = useMemo(
    () =>
      navItems.map((item) => {
        if (item.label !== 'Alerts') {
          return item
        }

        return {
          ...item,
          badgeCount: alertNotificationCount,
        }
      }),
    [alertNotificationCount],
  )

  return (
    <ConsoleLayout
      brandIcon={Shield}
      brandSubtitle="Government"
      navItems={governmentNavItems}
      theme={sidebarTheme}
    />
  )
}
