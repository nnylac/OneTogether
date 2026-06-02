import { Box, Flex } from '../../../components/chakra-ui'
import { Outlet } from 'react-router-dom'
import { GovernmentSidebar } from './GovernmentSidebar'

export function GovernmentLayout() {
  return (
    <Flex minH="100vh" bg="gray.50">
      <GovernmentSidebar />

      <Box flex="1" pl="260px" minW="0">
        <Box as="main" p={{ base: '4', md: '8' }}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
