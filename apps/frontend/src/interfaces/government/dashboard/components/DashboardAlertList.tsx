import { Stack } from '../../../../components/chakra-ui'
import type { GovernmentAlert } from '../../alerts/types/alert'
import { DashboardAlertBanner } from './DashboardAlertBanner'

type DashboardAlertListProps = {
  alerts: GovernmentAlert[]
}

export function DashboardAlertList({ alerts }: DashboardAlertListProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <Stack gap="3">
      {alerts.map((alert) => (
        <DashboardAlertBanner key={alert.id} alert={alert} />
      ))}
    </Stack>
  )
}
