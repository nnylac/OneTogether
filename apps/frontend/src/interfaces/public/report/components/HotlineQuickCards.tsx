import { Phone, Shield, Siren } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'

const quickCards = [
  {
    color: 'red.500',
    description: 'Fire, rescue, ambulance',
    icon: Siren,
    label: 'SCDF Emergency',
    value: '995',
  },
  {
    color: 'blue.900',
    description: 'Crime and security threats',
    icon: Shield,
    label: 'Police',
    value: '999',
  },
  {
    color: 'green.600',
    description: 'General health guidance',
    icon: Phone,
    label: 'MOH General Hotline',
    value: '6325 9220',
  },
]

export function HotlineQuickCards() {
  return (
    <Box
      display="grid"
      gap="3"
      gridTemplateColumns={{ base: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }}
    >
      {quickCards.map((card) => (
        <Flex
          key={card.label}
          align="center"
          bg="white"
          borderColor="gray.200"
          borderWidth="1px"
          gap="4"
          minH="104px"
          p="4"
        >
          <Flex align="center" bg={card.color} color="white" h="12" justify="center" w="12">
            <Icon as={card.icon} boxSize="6" />
          </Flex>
          <Stack gap="0" minW="0">
            <Text color="gray.900" fontWeight="800">
              {card.label}
            </Text>
            <Text color="gray.500" fontSize="sm">
              {card.description}
            </Text>
            <HStack gap="2" mt="2">
              <Icon as={Phone} boxSize="4" color="gray.500" />
              <Text color="gray.900" fontSize="xl" fontWeight="800">
                {card.value}
              </Text>
            </HStack>
          </Stack>
        </Flex>
      ))}
    </Box>
  )
}
