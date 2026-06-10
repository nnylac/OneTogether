import { Info, Phone } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import type { OrganisationGuide } from '../types/organisationGuide'
import {
  formatOrganisationName,
  getOrganisationTone,
} from '../utils/organisationDisplay'

type OrganisationGuideDetailProps = {
  guide: OrganisationGuide
}

export function OrganisationGuideDetail({ guide }: OrganisationGuideDetailProps) {
  const tone = getOrganisationTone(guide.orgName)
  const contact = guide.contactNumber ?? guide.contactChannel ?? 'Refer to official channels'

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
        <HStack gap="3" mb="4">
          <Flex align="center" bg="whiteAlpha.200" h="12" justify="center" w="12">
            <Icon as={tone.icon} boxSize="6" />
          </Flex>
          <Box>
            <Text color="blue.100" fontSize="sm" fontWeight="800">
              {tone.label}
            </Text>
            <Text fontSize="2xl" fontWeight="800">
              {formatOrganisationName(guide.orgName)}
            </Text>
          </Box>
        </HStack>
        <Text color="blue.100" lineHeight="1.7">
          {guide.serviceSummary}
        </Text>
      </Box>

      <Stack gap="5" p="5">
        <Box bg={tone.bg} borderColor={tone.border} borderWidth="1px" p="4">
          <Text color="gray.500" fontSize="sm" fontWeight="800" mb="1">
            CONTACT CHANNEL
          </Text>
          <HStack color="gray.900" fontSize="2xl" fontWeight="800" gap="3">
            <Icon as={Phone} boxSize="5" color={tone.color} />
            <Text>{contact}</Text>
          </HStack>
          {guide.contactChannel && (
            <Text color={tone.color} fontSize="sm" fontWeight="800" mt="2">
              {guide.contactChannel}
            </Text>
          )}
        </Box>

        <Stack gap="3">
          <HStack color="gray.600" gap="2">
            <Icon as={Info} boxSize="5" color="green.600" />
            <Text fontSize="xs" fontWeight="800" letterSpacing="0.12em">
              WHEN TO USE THIS CONTACT
            </Text>
          </HStack>
          <Text color="gray.700" lineHeight="1.8">
            {guide.contactGuidance}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
