import type { ReactNode } from 'react'
import { Box, VStack } from '../../../../components/chakra-ui'

export function IncidentRoomCard({ children }: { children: ReactNode }) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      h={{ base: 'auto', lg: 'calc(100vh - 260px)' }}
      minH="620px"
    >
      {children}
    </Box>
  )
}

export function IncidentRoomContent({ children }: { children: ReactNode }) {
  return (
    <VStack align="stretch" flex="1" gap="0" minH="0">
      {children}
    </VStack>
  )
}

export function IncidentRoomScrollArea({ children }: { children: ReactNode }) {
  return (
    <Box flex="1" minH="0" p="5" overflowY="auto">
      {children}
    </Box>
  )
}
