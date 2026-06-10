import { useEffect, useMemo, useState } from 'react'
import { Bell, RefreshCcw, ShieldAlert } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { fetchPublicAlerts } from '../api/publicBroadcastsApi'
import { AlertFilterBar } from '../components/AlertFilterBar'
import type { AlertFilter } from '../components/AlertFilterBar'
import { AlertSeverityBadge } from '../components/AlertSeverityBadge'
import { AlertSummaryCards } from '../components/AlertSummaryCards'
import { PublicAlertDetailPanel } from '../components/PublicAlertDetailPanel'
import { PublicAlertListItem } from '../components/PublicAlertListItem'
import type { PublicAlert } from '../types/alert'

export function AlertsPage() {
  const [alerts, setAlerts] = useState<PublicAlert[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all')
  const [isLoading, setIsLoading] = useState(true)

  async function loadAlerts({ showLoading = false } = {}) {
    if (showLoading) {
      setIsLoading(true)
    }

    const nextAlerts = await fetchPublicAlerts()
    setAlerts(nextAlerts)
    setSelectedAlertId((currentId) => currentId ?? nextAlerts[0]?.id ?? null)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadAlerts({ showLoading: true })
  }, [])

  const counts = useMemo(
    () => ({
      all: alerts.length,
      advisory: alerts.filter((alert) => alert.severity === 'advisory').length,
      critical: alerts.filter((alert) => alert.severity === 'critical').length,
      info: alerts.filter((alert) => alert.severity === 'info').length,
      warning: alerts.filter((alert) => alert.severity === 'warning').length,
    }),
    [alerts],
  )

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') {
      return alerts
    }

    return alerts.filter((alert) => alert.severity === activeFilter)
  }, [activeFilter, alerts])

  const selectedAlert =
    alerts.find((alert) => alert.id === selectedAlertId) ??
    filteredAlerts[0] ??
    alerts[0] ??
    null
  const urgentAlert =
    alerts.find((alert) => alert.severity === 'critical') ?? alerts[0] ?? null

  function handleSelectAlert(alert: PublicAlert) {
    setSelectedAlertId(alert.id)
  }

  function handleFilterChange(filter: AlertFilter) {
    setActiveFilter(filter)
    const firstMatch =
      filter === 'all'
        ? alerts[0]
        : alerts.find((alert) => alert.severity === filter)
    setSelectedAlertId(firstMatch?.id ?? null)
  }

  return (
    <Stack gap="6" maxW="1440px" mx="auto">
      <Flex
        align={{ base: 'stretch', lg: 'end' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <HStack color="green.700" gap="2" mb="2">
            <Icon as={Bell} boxSize="5" />
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.12em">
              OFFICIAL BROADCASTS
            </Text>
          </HStack>
          <Heading color="gray.900" size="3xl">
            Alerts
          </Heading>
          <Text color="gray.600" mt="2">
            Live government advisories and zone announcements for public safety.
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'stretch', lg: 'auto' }}
          bg="green.600"
          color="white"
          onClick={() => void loadAlerts({ showLoading: true })}
          _hover={{ bg: 'green.700' }}
        >
          <Icon as={RefreshCcw} />
          Refresh
        </Button>
      </Flex>

      {urgentAlert && (
        <Flex
          align={{ base: 'start', lg: 'center' }}
          bg="orange.50"
          borderColor="orange.200"
          borderWidth="1px"
          direction={{ base: 'column', lg: 'row' }}
          gap="3"
          justify="space-between"
          p="4"
        >
          <HStack align="start" gap="3">
            <Icon as={ShieldAlert} boxSize="5" color="orange.600" mt="1" />
            <Box>
              <HStack gap="2" wrap="wrap">
                <Text color="orange.800" fontWeight="800">
                  {urgentAlert.title}
                </Text>
                <AlertSeverityBadge severity={urgentAlert.severity} />
              </HStack>
              <Text color="gray.600" fontSize="sm" mt="1">
                {urgentAlert.message}
              </Text>
            </Box>
          </HStack>
          <Button
            color="orange.800"
            flexShrink="0"
            size="sm"
            variant="ghost"
            onClick={() => handleSelectAlert(urgentAlert)}
          >
            View advisory
          </Button>
        </Flex>
      )}

      <AlertSummaryCards alerts={alerts} />

      <AlertFilterBar
        activeFilter={activeFilter}
        counts={counts}
        onChange={handleFilterChange}
      />

      <Box
        display="grid"
        gap="5"
        gridTemplateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 420px' }}
      >
        <Stack gap="3">
          {isLoading ? (
            <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
              <Text color="gray.500">Loading official broadcasts...</Text>
            </Box>
          ) : filteredAlerts.length === 0 ? (
            <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
              <Text color="gray.500">No public alerts match this filter.</Text>
            </Box>
          ) : (
            filteredAlerts.map((alert) => (
              <PublicAlertListItem
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert?.id === alert.id}
                onSelect={handleSelectAlert}
              />
            ))
          )}
        </Stack>

        {selectedAlert && <PublicAlertDetailPanel alert={selectedAlert} />}
      </Box>
    </Stack>
  )
}
