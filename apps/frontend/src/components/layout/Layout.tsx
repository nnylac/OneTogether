import { Box, Flex } from '../chakra-ui'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />

      <Box flex="1" pl="260px" minW="0">
        <Box as="main" p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
