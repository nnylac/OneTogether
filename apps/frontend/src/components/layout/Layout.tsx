import { Box, Flex } from '../chakra-ui'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileSidebar, Sidebar } from './Sidebar'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <Box flex="1" pl={{ base: '0', lg: '260px' }} minW="0">
        <Box as="main" p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
