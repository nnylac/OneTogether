import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, LineChart, Plus, ShieldAlert, TriangleAlert } from 'lucide-react'
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
import { AlertFormPanel } from '../components/AlertFormPanel'
import { AlertList } from '../components/AlertList'
import { AlertSummaryCard } from '../components/AlertSummaryCard'
import {
  createGovernmentAlertRule,
  deleteGovernmentAlertRule,
  fetchGovernmentAlertMetricDefinitions,
  fetchGovernmentAlertRules,
  updateGovernmentAlertRuleThreshold,
} from '../api/governmentAlertRulesApi'
import type {
  AlertMetricDefinition,
  AlertFilter,
  GovernmentAlert,
  NewAlertInput,
} from '../types/alert'

const alertFilters: AlertFilter[] = ['All', 'Critical', 'Warning', 'Normal']

const alertFilterLabels: Record<AlertFilter, string> = {
  All: 'All',
  Critical: 'Critical',
  Warning: 'Warning',
  Normal: 'Normal',
}

function doesAlertMatchFilter(alert: GovernmentAlert, selectedFilter: AlertFilter) {
  if (selectedFilter === 'All') {
    return true
  }

  return alert.status === selectedFilter
}

function countAlertsForFilter(alerts: GovernmentAlert[], filter: AlertFilter) {
  return alerts.filter((alert) => doesAlertMatchFilter(alert, filter)).length
}

function getAlertListTitle(selectedFilter: AlertFilter) {
  if (selectedFilter === 'All') {
    return 'All Alert Rules'
  }

  return `${alertFilterLabels[selectedFilter]} Alert Rules`
}

export function GovernmentAlertsPage() {
  const [alerts, setAlerts] = useState<GovernmentAlert[]>([])
  const [metricDefinitions, setMetricDefinitions] = useState<
    AlertMetricDefinition[]
  >([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<AlertFilter>('All')
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)

  useEffect(() => {
    void loadAlerts({ showLoading: true })
  }, [])

  async function loadAlerts({ showLoading = false } = {}) {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      const [nextMetricDefinitions, nextAlerts] = await Promise.all([
        fetchGovernmentAlertMetricDefinitions(),
        fetchGovernmentAlertRules(),
      ])
      setMetricDefinitions(nextMetricDefinitions)
      setAlerts(nextAlerts)
      setLoadError(null)
    } catch {
      setLoadError('Unable to load alert rules from the backend.')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const filterOptions = useMemo(() => {
    return alertFilters.map((filter) => ({
      label: alertFilterLabels[filter],
      value: filter,
      count: countAlertsForFilter(alerts, filter),
    }))
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => doesAlertMatchFilter(alert, selectedFilter))
  }, [alerts, selectedFilter])

  const normalAlerts = alerts.filter((alert) => alert.status === 'Normal').length
  const warningAlerts = alerts.filter((alert) => alert.status === 'Warning').length
  const criticalAlerts = alerts.filter(
    (alert) => alert.status === 'Critical',
  ).length

  function handleCreateAlert(newAlert: NewAlertInput) {
    createGovernmentAlertRule(newAlert)
      .then((alert) => {
        setAlerts((currentAlerts) => [alert, ...currentAlerts])
        setSelectedFilter('All')
        setIsCreatePanelOpen(false)
        setLoadError(null)
      })
      .catch(() => setLoadError('Unable to create alert rule.'))
  }

  function handleUpdateAlertThreshold(alertId: string, thresholdValue: number) {
    updateGovernmentAlertRuleThreshold(alertId, thresholdValue)
      .then((updatedAlert) => {
        setAlerts((currentAlerts) =>
          currentAlerts.map((alert) =>
            alert.id === alertId ? updatedAlert : alert,
          ),
        )
        setLoadError(null)
      })
      .catch(() => setLoadError('Unable to update alert threshold.'))
  }

  function handleDeleteAlert(alertId: string) {
    deleteGovernmentAlertRule(alertId)
      .then(() => {
        setAlerts((currentAlerts) =>
          currentAlerts.filter((alert) => alert.id !== alertId),
        )
        setLoadError(null)
      })
      .catch(() => setLoadError('Unable to delete alert rule.'))
  }

  function handleRefreshAlerts() {
    void loadAlerts({ showLoading: true })
  }

  return (
    <Stack gap="6">
      <Flex
        align={{ base: 'stretch', lg: 'center' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading size="3xl" color="gray.900">
            Alerts / Thresholds
          </Heading>

          <Text color="gray.500" mt="1">
            Create threshold rules and notify government command when incident
            metrics exceed safe limits.
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'flex-start', lg: 'center' }}
          bg="blue.900"
          color="white"
          disabled={metricDefinitions.length === 0}
          onClick={() => setIsCreatePanelOpen((isOpen) => !isOpen)}
          _hover={{
            bg: 'blue.800',
          }}
        >
          <Icon as={Plus} />
          Create Alert
        </Button>
      </Flex>

      <Flex direction={{ base: 'column', xl: 'row' }} gap="4">
        <AlertSummaryCard
          label="Total Alerts"
          value={alerts.length}
          helper="Configured threshold alerts"
          icon={LineChart}
          tone="blue"
        />
        <AlertSummaryCard
          label="Normal"
          value={normalAlerts}
          helper="Rules below warning range"
          icon={CircleCheck}
          tone="green"
        />
        <AlertSummaryCard
          label="Warning"
          value={warningAlerts}
          helper="Rules near threshold limit"
          icon={TriangleAlert}
          tone="orange"
        />
        <AlertSummaryCard
          label="Critical"
          value={criticalAlerts}
          helper="Rules at or past threshold"
          icon={ShieldAlert}
          tone="red"
        />
      </Flex>

      <HStack gap="3" wrap="wrap">
        {filterOptions.map((filter) => {
          const isActive = selectedFilter === filter.value

          return (
            <Button
              key={filter.value}
              bg={isActive ? 'blue.900' : 'white'}
              borderColor={isActive ? 'blue.900' : 'gray.200'}
              color={isActive ? 'white' : 'gray.700'}
              size="sm"
              variant="outline"
              onClick={() => setSelectedFilter(filter.value)}
              _hover={{
                bg: isActive ? 'blue.900' : 'gray.50',
                borderColor: isActive ? 'blue.900' : 'gray.300',
              }}
            >
              {filter.label}
              <Text as="span" color={isActive ? 'blue.100' : 'gray.400'}>
                {filter.count}
              </Text>
            </Button>
          )
        })}
      </HStack>

      <AlertFormPanel
        metricDefinitions={metricDefinitions}
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        onCreateAlert={handleCreateAlert}
      />

      {loadError && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" p="4">
          <Text color="red.700" fontSize="sm" fontWeight="700">
            {loadError}
          </Text>
        </Box>
      )}

      {isLoading && (
        <Box bg="white" borderColor="gray.200" borderWidth="1px" p="4">
          <Text color="gray.500">Loading alert rules...</Text>
        </Box>
      )}

      {!isLoading && (
        <AlertList
          title={getAlertListTitle(selectedFilter)}
          alerts={filteredAlerts}
          onDelete={handleDeleteAlert}
          onRefresh={handleRefreshAlerts}
          onUpdateThreshold={handleUpdateAlertThreshold}
        />
      )}
    </Stack>
  )
}
