import {
  BarChart3,
  Building2,
  Grid2X2,
  Map,
  RadioTower,
  Settings,
  Shield,
  Siren,
  AlarmClock
} from 'lucide-react'
import { ConsoleLayout } from '../../../components/layout/ConsoleLayout'
import type { ConsoleNavItem, ConsoleSidebarTheme } from '../../../components/layout/ConsoleSidebar'

const navItems: ConsoleNavItem[] = [
  { label: 'Dashboard', href: '/government', icon: Grid2X2, end: true },
  { label: 'Incidents', href: '/government/incidents', icon: Siren },
  { label: 'Map', href: '/government/map', icon: Map },
  { label: 'Broadcasts', href: '/government/broadcasts', icon: RadioTower },
  { label: 'Organisations', href: '/government/organisations', icon: Building2 },
  { label: 'Analytics', href: '/government/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/government/alerts', icon: AlarmClock},
  { label: 'Settings', href: '/government/settings', icon: Settings },
]

const sidebarTheme: ConsoleSidebarTheme = {
  activeBg: '#e0f2fe',
  activeBorder: '#0284c7',
  activeColor: '#075985',
  hoverBg: 'blue.50',
  hoverColor: 'blue.700',
}

export function GovernmentLayout() {
  return (
    <ConsoleLayout
      brandIcon={Shield}
      brandSubtitle="Government"
      navItems={navItems}
      theme={sidebarTheme}
    />
  )
}
