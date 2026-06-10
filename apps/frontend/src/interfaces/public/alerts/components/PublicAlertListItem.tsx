import { ArrowRight, Clock, MapPin } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { AlertSeverityBadge } from './AlertSeverityBadge'
import { getAlertIcon, getAudienceLabel, severityTone } from '../utils/alertDisplay'
import type { PublicAlert } from '../types/alert'

type PublicAlertListItemProps = {
  alert: PublicAlert
  isSelected: boolean
  onSelect: (alert: PublicAlert) => void
}

export function PublicAlertListItem({
  alert,
  isSelected,
  onSelect,
}: PublicAlertListItemProps) {
  const tone = severityTone[alert.severity]
  const alertIcon = getAlertIcon(alert)

  return (
    <Flex
      as="article"
      bg="white"
      borderColor={isSelected ? tone.border : 'gray.200'}
      borderLeftColor={tone.accent}
      borderLeftWidth="4px"
      borderWidth="1px"
      boxShadow={isSelected ? '0 8px 20px rgba(15, 23, 42, 0.08)' : 'none'}
      gap="4"
      p="5"
      role="button"
      tabIndex={0}
      transition="all 0.15s ease"
      onClick={() => onSelect(alert)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(alert)
        }
      }}
      _hover={{ borderColor: tone.border, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)' }}
    >
      <Flex align="center" bg={tone.bg} color={tone.color} h="12" justify="center" w="12">
        <Icon as={alertIcon} boxSize="6" />
      </Flex>

      <Stack gap="3" flex="1" minW="0">
        <Flex align="start" gap="3" justify="space-between">
          <Box minW="0">
            <Text color="gray.900" fontSize="lg" fontWeight="800">
              {alert.title}
            </Text>
            <HStack color="gray.500" fontSize="sm" gap="3" mt="1" wrap="wrap">
              <HStack gap="1">
                <Icon as={MapPin} boxSize="4" />
                <Text>{getAudienceLabel(alert)}</Text>
              </HStack>
              <HStack gap="1">
                <Icon as={Clock} boxSize="4" />
                <Text>{alert.createdAt}</Text>
              </HStack>
            </HStack>
          </Box>

          <AlertSeverityBadge severity={alert.severity} />
        </Flex>

        <Text color="gray.600" lineHeight="1.7">
          {alert.message}
        </Text>

        <Flex align="center" justify="space-between" gap="4">
          <Text color="gray.500" fontSize="sm" fontWeight="700">
            Issued by {alert.authorName}
          </Text>
          <Button
            color="green.700"
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(alert)
            }}
          >
            View advisory
            <Icon as={ArrowRight} />
          </Button>
        </Flex>
      </Stack>
    </Flex>
  )
}
