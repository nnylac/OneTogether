import { Button, HStack, Text, Stack } from '../../../../components/chakra-ui'
import type { BroadcastSeverity } from '../types/broadcast'

type BroadcastSeveritySelectorProps = {
  selectedSeverity: BroadcastSeverity
  onSelectSeverity: (severity: BroadcastSeverity) => void
}

const severityOptions: BroadcastSeverity[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
]

const severityStyles: Record<
  BroadcastSeverity,
  {
    bg: string
    borderColor: string
    color: string
    activeBg: string
    activeColor: string
  }
> = {
  Low: {
    bg: 'green.50',
    borderColor: 'green.200',
    color: 'green.700',
    activeBg: 'green.600',
    activeColor: 'white',
  },
  Medium: {
    bg: 'yellow.50',
    borderColor: 'yellow.200',
    color: 'yellow.800',
    activeBg: 'yellow.500',
    activeColor: 'white',
  },
  High: {
    bg: 'orange.50',
    borderColor: 'orange.200',
    color: 'orange.700',
    activeBg: 'orange.500',
    activeColor: 'white',
  },
  Critical: {
    bg: 'red.50',
    borderColor: 'red.200',
    color: 'red.700',
    activeBg: 'red.600',
    activeColor: 'white',
  },
}

export function BroadcastSeveritySelector({
  selectedSeverity,
  onSelectSeverity,
}: BroadcastSeveritySelectorProps) {
  return (
    <Stack gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="800">
        Severity
      </Text>

      <HStack gap="3" wrap="wrap">
        {severityOptions.map((severity) => {
          const isActive = selectedSeverity === severity
          const styles = severityStyles[severity]

          return (
            <Button
              key={severity}
              size="sm"
              borderRadius="sm"
              variant="outline"
              bg={isActive ? styles.activeBg : styles.bg}
              color={isActive ? styles.activeColor : styles.color}
              borderColor={isActive ? styles.activeBg : styles.borderColor}
              px="4"
              minH="9"
              textTransform="uppercase"
              onClick={() => onSelectSeverity(severity)}
              _hover={{
                bg: isActive ? styles.activeBg : styles.bg,
                borderColor: isActive ? styles.activeBg : styles.borderColor,
              }}
            >
              {severity}
            </Button>
          )
        })}
      </HStack>
    </Stack>
  )
}