import type { LucideIcon } from 'lucide-react'
import { Box, Flex, Icon, Stack, Text } from '../../../../components/chakra-ui'
import type { DashboardSummaryMetric } from '../utils/dashboardMetrics'

type DashboardSummaryCardProps = {
  icon: LucideIcon
  metric: DashboardSummaryMetric
}

const toneStyles = {
  blue: { color: 'blue.700' },
  green: { color: 'green.600' },
  orange: { color: 'orange.500' },
  red: { color: 'red.500' },
}

export function DashboardSummaryCard({
  icon,
  metric,
}: DashboardSummaryCardProps) {
  const styles = toneStyles[metric.tone]

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" minH="34" p="4">
      <Flex align="flex-start" justify="space-between" gap="4">
        <Stack gap="2">
          <Flex align="center" color="gray.700" gap="2">
            <Icon as={icon} boxSize="4" color={styles.color} />
            <Text fontSize="sm" fontWeight="800">
              {metric.label}
            </Text>
          </Flex>
          <Text color="gray.900" fontSize="3xl" fontWeight="900" lineHeight="1">
            {metric.value}
          </Text>
          <Text color="gray.500" fontSize="sm">
            {metric.detail}
          </Text>
          <Text color={styles.color} fontSize="sm">
            - {metric.helper}
          </Text>
        </Stack>
      </Flex>
    </Box>
  )
}
