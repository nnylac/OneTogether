import { Box, Flex, HStack, Text } from '../chakra-ui'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileSidebar, MobileSidebarButton, Sidebar } from './Sidebar'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <Box flex="1" pl={{ base: '0', lg: '260px' }} minW="0">
        <HStack as="header" h="10" px="4" bg="black" color="white" gap="3">
          <MobileSidebarButton onClick={() => setMobileOpen(true)} />
          <Box boxSize="2.5" borderRadius="full" bg="red.500" />
          <Text fontSize="sm" fontWeight="600">
            A Singapore Government Agency Website
          </Text>
        </HStack>

        <Box as="main" p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
