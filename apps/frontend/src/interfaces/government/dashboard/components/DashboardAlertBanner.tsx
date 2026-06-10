import { TriangleAlert } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import type { GovernmentAlert } from '../../alerts/types/alert'
import { formatAlertValue, formatLabel } from '../utils/dashboardMetrics'

type DashboardAlertBannerProps = {
  alert: GovernmentAlert
}

const toneStyles = {
  Critical: {
    bg: 'red.50',
    border: 'red.300',
    button: 'red.500',
    color: 'red.600',
    hover: 'red.600',
  },
  Warning: {
    bg: 'orange.50',
    border: 'orange.300',
    button: 'orange.400',
    color: 'orange.700',
    hover: 'orange.500',
  },
} as const

export function DashboardAlertBanner({ alert }: DashboardAlertBannerProps) {
  const styles =
    alert.status === 'Critical' ? toneStyles.Critical : toneStyles.Warning

  return (
    <Box bg={styles.bg} borderColor={styles.border} borderWidth="1px" px="4" py="4">
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap="4"
        justify="space-between"
      >
        <HStack align="flex-start" gap="3">
          <Icon as={TriangleAlert} boxSize="5" color={styles.color} mt="0.5" />
          <Stack gap="1">
            <Text color={styles.color} fontSize="md" fontWeight="900">
              {alert.status.toUpperCase()}: {getAlertTitle(alert)}
            </Text>
            <Text color={styles.color} fontSize="sm">
              Current: {formatAlertValue(alert.currentValue, alert.unit)} -
              Threshold: {formatAlertValue(alert.thresholdValue, alert.unit)}
            </Text>
          </Stack>
        </HStack>

        <Button
          alignSelf={{ base: 'flex-start', md: 'center' }}
          bg={styles.button}
          color="white"
          size="sm"
          type="button"
          onClick={() => undefined}
          _hover={{ bg: styles.hover }}
        >
          AI Suggestion
        </Button>
      </Flex>
    </Box>
  )
}

function getAlertTitle(alert: GovernmentAlert) {
  const name = alert.name.replace(/\s*threshold\s*$/i, '').trim()
  return name || formatLabel(alert.metric)
}
