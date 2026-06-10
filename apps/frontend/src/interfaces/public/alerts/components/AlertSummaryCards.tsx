import { Bell, MapPinned, RadioTower, ShieldAlert } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import type { PublicAlert } from '../types/alert'

type AlertSummaryCardsProps = {
  alerts: PublicAlert[]
}

export function AlertSummaryCards({ alerts }: AlertSummaryCardsProps) {
  const criticalCount = alerts.filter(
    (alert) => alert.severity === 'critical',
  ).length
  const zoneCount = alerts.filter((alert) => alert.audience === 'Zone').length
  const publicCount = alerts.filter(
    (alert) => alert.audience === 'Public',
  ).length

  return (
    <Box
      display="grid"
      gap="3"
      gridTemplateColumns={{
        base: '1fr',
        md: 'repeat(2, minmax(0, 1fr))',
        xl: 'repeat(4, minmax(0, 1fr))',
      }}
    >
      <MetricCard icon={Bell} label="Official broadcasts" value={alerts.length} />
      <MetricCard icon={ShieldAlert} label="Critical alerts" value={criticalCount} />
      <MetricCard icon={MapPinned} label="Zone updates" value={zoneCount} />
      <MetricCard icon={RadioTower} label="Public advisories" value={publicCount} />
    </Box>
  )
}

type MetricCardProps = {
  icon: typeof Bell
  label: string
  value: number
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Flex
      align="center"
      bg="white"
      borderColor="gray.200"
      borderWidth="1px"
      gap="3"
      minH="94px"
      p="4"
    >
      <Flex
        align="center"
        bg="blue.50"
        color="blue.700"
        h="11"
        justify="center"
        w="11"
      >
        <Icon as={icon} boxSize="5" />
      </Flex>
      <Stack gap="0">
        <Text color="gray.500" fontSize="sm" fontWeight="700">
          {label}
        </Text>
        <HStack gap="2">
          <Text color="gray.900" fontSize="2xl" fontWeight="800">
            {value}
          </Text>
          <Text color="green.600" fontSize="xs" fontWeight="800">
            Live
          </Text>
        </HStack>
      </Stack>
    </Flex>
  )
}
