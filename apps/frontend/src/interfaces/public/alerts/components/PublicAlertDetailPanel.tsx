import { CheckCircle2, MapPin } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { AlertSeverityBadge } from './AlertSeverityBadge'
import { getAudienceLabel, severityTone } from '../utils/alertDisplay'
import type { PublicAlert } from '../types/alert'

type PublicAlertDetailPanelProps = {
  alert: PublicAlert
}

export function PublicAlertDetailPanel({ alert }: PublicAlertDetailPanelProps) {
  const tone = severityTone[alert.severity]

  return (
    <Stack
      as="aside"
      bg="white"
      borderColor="gray.200"
      borderWidth="1px"
      gap="0"
      position={{ xl: 'sticky' }}
      top={{ xl: '6' }}
    >
      <Box bg="blue.950" color="white" p="5">
        <HStack gap="2" mb="3" wrap="wrap">
          <AlertSeverityBadge severity={alert.severity} />
          <Box
            borderColor="blue.700"
            borderWidth="1px"
            color="blue.100"
            fontSize="xs"
            fontWeight="800"
            px="3"
            py="1"
            textTransform="uppercase"
          >
            {alert.audience}
          </Box>
        </HStack>

        <Text fontSize="2xl" fontWeight="800" lineHeight="1.2">
          {alert.title}
        </Text>
        <Text color="blue.100" fontSize="sm" fontWeight="700" mt="2">
          Issued by {alert.authorName} - {alert.createdAt}
        </Text>
      </Box>

      <Stack gap="5" p="5">
        <Box bg={tone.bg} borderColor={tone.border} borderWidth="1px" p="4">
          <Text color="gray.700" lineHeight="1.7">
            {alert.message}
          </Text>
          <HStack color={tone.color} fontSize="sm" fontWeight="800" mt="3">
            <Icon as={MapPin} boxSize="4" />
            <Text>{getAudienceLabel(alert)}</Text>
          </HStack>
        </Box>

        <HStack color="gray.600" gap="2">
          <Icon as={CheckCircle2} boxSize="5" color="green.600" />
          <Text fontSize="xs" fontWeight="800" letterSpacing="0.12em">
            WHAT YOU SHOULD DO
          </Text>
        </HStack>

        <Stack gap="5">
          {alert.recommendations.map((recommendation, index) => (
            <Flex key={recommendation.title} align="start" gap="4">
              <Flex
                align="center"
                bg="blue.950"
                color="white"
                flexShrink="0"
                fontSize="sm"
                fontWeight="800"
                h="9"
                justify="center"
                rounded="full"
                w="9"
              >
                {index + 1}
              </Flex>
              <Stack gap="1">
                <Text color="gray.900" fontWeight="800">
                  {recommendation.title}
                </Text>
                <Text color="gray.600" fontSize="sm" lineHeight="1.7">
                  {recommendation.body}
                </Text>
              </Stack>
            </Flex>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}
