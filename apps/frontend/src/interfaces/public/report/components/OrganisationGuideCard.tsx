import { Phone } from 'lucide-react'
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

type OrganisationGuideCardProps = {
  guide: OrganisationGuide
}

export function OrganisationGuideCard({ guide }: OrganisationGuideCardProps) {
  const tone = getOrganisationTone(guide.orgName)
  const contact = guide.contactNumber ?? guide.contactChannel ?? 'Guide'

  return (
    <Flex
      as="article"
      bg="white"
      borderColor="gray.200"
      borderLeftColor={tone.color}
      borderLeftWidth="4px"
      borderWidth="1px"
      gap="4"
      p="4"
      transition="all 0.15s ease"
      _hover={{ borderColor: tone.border, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)' }}
    >
      <Flex align="center" bg={tone.bg} color={tone.color} flexShrink="0" h="12" justify="center" w="12">
        <Icon as={tone.icon} boxSize="6" />
      </Flex>

      <Stack gap="2" minW="0" flex="1">
        <Flex align="start" direction="column" gap="2">
          <Box minW="0">
            <Text color="gray.900" fontSize="lg" fontWeight="800" wordBreak="normal">
              {formatOrganisationName(guide.orgName)}
            </Text>
            <Text color="gray.500" fontSize="sm" fontWeight="700">
              {tone.label}
            </Text>
          </Box>

          <Box
            bg={tone.bg}
            borderColor={tone.border}
            borderWidth="1px"
            color={tone.color}
            fontSize="xs"
            fontWeight="800"
            maxW="100%"
            px="2"
            py="1"
            textTransform="uppercase"
          >
            {guide.contactChannel ?? 'Contact'}
          </Box>
        </Flex>

        <Text color="gray.600" fontSize="sm" lineHeight="1.6">
          {guide.serviceSummary}
        </Text>

        <HStack color="gray.900" fontWeight="800" gap="2">
          <Icon as={Phone} boxSize="4" color={tone.color} />
          <Text>{contact}</Text>
        </HStack>
      </Stack>
    </Flex>
  )
}
