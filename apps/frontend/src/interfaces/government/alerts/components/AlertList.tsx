import { RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { AlertListItem } from './AlertListItem'
import type { GovernmentAlert } from '../types/alert'

type AlertListProps = {
  title: string
  alerts: GovernmentAlert[]
  onDelete: (alertId: string) => void
  onRefresh: () => void
  onUpdateThreshold: (alertId: string, thresholdValue: number) => void
}

export function AlertList({
  title,
  alerts,
  onDelete,
  onRefresh,
  onUpdateThreshold,
}: AlertListProps) {
  const [openMenuAlertId, setOpenMenuAlertId] = useState<string | null>(null)

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px">
      <Flex align="center" justify="space-between" px="4" py="4" gap="4">
        <Box>
          <Text color="gray.900" fontSize="md" fontWeight="900">
            {title}
          </Text>
          <Text color="gray.500" fontSize="sm">
            Monitor threshold limits and alert severity.
          </Text>
        </Box>

        <Button
          bg="green.600"
          color="white"
          size="sm"
          onClick={onRefresh}
          _hover={{
            bg: 'green.700',
          }}
        >
          <Icon as={RefreshCcw} />
          Reset Mock Data
        </Button>
      </Flex>

      <Box
        display={{ base: 'none', xl: 'grid' }}
        gap="4"
        gridTemplateColumns="2fr 1fr 1fr 1fr 48px"
        px="4"
        py="3"
      >
        <HeaderText>Name</HeaderText>
        <HeaderText>Severity</HeaderText>
        <HeaderText>Current</HeaderText>
        <HeaderText>Threshold Limit</HeaderText>
        <Box />
      </Box>

      {alerts.length === 0 ? (
        <Box borderTopColor="gray.100" borderTopWidth="1px" px="4" py="8">
          <Text color="gray.500">No alert rules found for this filter.</Text>
        </Box>
      ) : (
        <Stack gap="0">
          {alerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              isMenuOpen={openMenuAlertId === alert.id}
              onDelete={onDelete}
              onSetOpenMenuAlertId={setOpenMenuAlertId}
              onUpdateThreshold={onUpdateThreshold}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

function HeaderText({ children }: { children: string }) {
  return (
    <Text
      color="gray.500"
      fontSize="xs"
      fontWeight="900"
      textTransform="uppercase"
    >
      {children}
    </Text>
  )
}
