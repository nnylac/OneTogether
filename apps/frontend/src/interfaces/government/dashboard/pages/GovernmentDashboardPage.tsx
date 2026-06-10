import { Box, Stack, Text } from '../../../../components/chakra-ui'
import { DashboardAlertList } from '../components/DashboardAlertList'
import { DashboardHeader } from '../components/DashboardHeader'
import { DashboardNotice } from '../components/DashboardNotice'
import { DashboardSummaryGrid } from '../components/DashboardSummaryGrid'
import { SituationSummaryPanel } from '../components/SituationSummaryPanel'
import { IncidentsByTypeSummary } from '../components/IncidentsByTypeSummary'
import { SeverityDistributionChart } from '../components/SeverityDistributionChart'
import { useGovernmentDashboard } from '../hooks/useGovernmentDashboard'
import {
  getActiveDashboardAlerts,
  getDashboardSummaryMetrics,
  getIncidentsByType,
  getSeverityDistribution,
} from '../utils/dashboardMetrics'

export function GovernmentDashboardPage() {
  const { data, error, isLoading, isRefreshing, refresh } =
    useGovernmentDashboard()

  const activeAlerts = data ? getActiveDashboardAlerts(data.alerts) : []
  const summaryMetrics = data ? getDashboardSummaryMetrics(data) : []
  const incidentsByType = data ? getIncidentsByType(data) : []
  const severityDistribution = data ? getSeverityDistribution(data) : []

  return (
    <Stack gap="6">
      <DashboardHeader isRefreshing={isRefreshing} onRefresh={refresh} />

      {error && <DashboardNotice message={error} tone="red" />}
      {isLoading && <DashboardNotice message="Loading command dashboard data..." />}

      {data && (
        <>
          <DashboardAlertList alerts={activeAlerts} />
          <SituationSummaryPanel />
          <DashboardSummaryGrid metrics={summaryMetrics} />

          <Box
            display="grid"
            gap="4"
            gridTemplateColumns={{ base: '1fr', xl: '1fr 1fr' }}
          >
            <IncidentsByTypeSummary incidentsByType={incidentsByType} />
            <SeverityDistributionChart
              severityDistribution={severityDistribution}
            />
          </Box>

          <Text color="gray.400" fontSize="xs">
            Last updated {new Date(data.generatedAt).toLocaleString('en-SG')}
          </Text>
        </>
      )}
    </Stack>
  )
}
