import { Outlet } from 'react-router-dom'
import { Box, Flex } from '../chakra-ui'
import { ConsoleSidebar } from './ConsoleSidebar'
import type { ConsoleNavItem, ConsoleSidebarTheme } from './ConsoleSidebar'
import type { ElementType } from 'react'

type ConsoleLayoutProps = {
  brandIcon: ElementType
  brandSubtitle: string
  navItems: ConsoleNavItem[]
  theme: ConsoleSidebarTheme
}

export function ConsoleLayout({
  brandIcon,
  brandSubtitle,
  navItems,
  theme,
}: ConsoleLayoutProps) {
  return (
    <Flex minH="100vh" bg="gray.50">
      <ConsoleSidebar
        brandIcon={brandIcon}
        brandSubtitle={brandSubtitle}
        navItems={navItems}
        theme={theme}
      />

      <Box flex="1" pl="260px" minW="0">
        <Box as="main" p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
