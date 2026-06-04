import { Card, Heading, Stack, Text } from '../../../../components/chakra-ui'
import type { DashboardMetric } from '../types'

type DashboardMetricCardProps = {
  metric: DashboardMetric
}

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderWidth="1px" borderRadius="sm" flex="1" minW="48">
      <Card.Body>
        <Stack gap="2">
          <Text color="gray.500" fontSize="sm">
            {metric.label}
          </Text>
          <Heading size="3xl" color="gray.900">
            {metric.value.toLocaleString()}
          </Heading>
          <Text color="gray.500" fontSize="sm">
            {metric.detail}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
