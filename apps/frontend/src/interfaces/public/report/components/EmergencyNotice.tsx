import { Siren } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'

export function EmergencyNotice() {
  return (
    <Flex
      align="start"
      bg="red.50"
      borderColor="red.300"
      borderWidth="1px"
      gap="4"
      p="5"
    >
      <Flex align="center" bg="red.500" color="white" h="12" justify="center" w="12">
        <Icon as={Siren} boxSize="6" />
      </Flex>
      <Stack gap="2">
        <HStack gap="2" wrap="wrap">
          <Text color="red.700" fontSize="lg" fontWeight="800">
            Call 995 or 999 for life-threatening emergencies first.
          </Text>
        </HStack>
        <Text color="red.700" lineHeight="1.7">
          This page provides official contact guidance. It is not monitored in
          real time for emergency dispatch.
        </Text>
        <Box color="red.700" fontSize="sm" fontWeight="700">
          Use 995 for fire, ambulance, and rescue. Use 999 for police emergencies.
        </Box>
      </Stack>
    </Flex>
  )
}
