import { Bell, FolderOpen, Grid2X2, Map, Settings, Shield, Siren } from 'lucide-react'
import { ConsoleLayout } from '../../../components/layout/ConsoleLayout'
import type { ConsoleNavItem, ConsoleSidebarTheme } from '../../../components/layout/ConsoleSidebar'

const navItems: ConsoleNavItem[] = [
  { label: 'Dashboard', href: '/responder', icon: Grid2X2, end: true },
  { label: 'Incidents', href: '/responder/incidents', icon: Siren },
  { label: 'Map', href: '/responder/map', icon: Map },
  { label: 'Resources', href: '/responder/resources', icon: FolderOpen },
  { label: 'Notifications', href: '/responder/notifications', icon: Bell },
  { label: 'Settings', href: '/responder/settings', icon: Settings },
]

const sidebarTheme: ConsoleSidebarTheme = {
  activeBg: '#f0e7ff',
  activeBorder: '#7c3aed',
  activeColor: '#6d28d9',
  hoverBg: 'purple.50',
  hoverColor: 'purple.700',
}

export function ResponderLayout() {
  return (
    <ConsoleLayout
      brandIcon={Shield}
      brandSubtitle="Together as One"
      navItems={navItems}
      theme={sidebarTheme}
    />
  )
}
