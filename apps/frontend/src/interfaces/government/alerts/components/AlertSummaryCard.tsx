import { Box, Flex, Icon, Stack, Text } from '../../../../components/chakra-ui'
import type { LucideIcon } from 'lucide-react'

type AlertSummaryCardProps = {
  label: string
  value: number
  helper: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'orange' | 'red'
}

const toneStyles = {
  blue: {
    bg: 'blue.50',
    color: 'blue.700',
  },
  green: {
    bg: 'green.50',
    color: 'green.700',
  },
  orange: {
    bg: 'orange.50',
    color: 'orange.700',
  },
  red: {
    bg: 'red.50',
    color: 'red.700',
  },
}

export function AlertSummaryCard({
  label,
  value,
  helper,
  icon,
  tone = 'blue',
}: AlertSummaryCardProps) {
  const styles = toneStyles[tone]

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" flex="1" p="4">
      <Flex align="flex-start" justify="space-between" gap="4">
        <Stack gap="1">
          <Text color="gray.500" fontSize="sm" fontWeight="700">
            {label}
          </Text>
          <Text color="gray.900" fontSize="2xl" fontWeight="900">
            {value}
          </Text>
          <Text color="gray.500" fontSize="xs">
            {helper}
          </Text>
        </Stack>

        <Flex
          align="center"
          bg={styles.bg}
          borderRadius="full"
          color={styles.color}
          h="10"
          justify="center"
          w="10"
        >
          <Icon as={icon} boxSize="5" />
        </Flex>
      </Flex>
    </Box>
  )
}
