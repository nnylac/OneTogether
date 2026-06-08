import { Button, HStack, Text, Stack } from '../../../../components/chakra-ui'
import type { BroadcastZone } from '../types/broadcast'

type BroadcastZoneSelectorProps = {
  selectedZone: BroadcastZone
  onSelectZone: (zone: BroadcastZone) => void
}

const zoneOptions: BroadcastZone[] = [
  'Nationwide',
  'Central',
  'North',
  'South',
  'East',
  'West',
]

export function BroadcastZoneSelector({
  selectedZone,
  onSelectZone,
}: BroadcastZoneSelectorProps) {
  return (
    <Stack gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="800">
        Zone
      </Text>

      <HStack gap="3" wrap="wrap">
        {zoneOptions.map((zone) => {
          const isActive = selectedZone === zone

          return (
            <Button
              key={zone}
              size="sm"
              borderRadius="full"
              variant="outline"
              bg={isActive ? 'blue.900' : 'white'}
              color={isActive ? 'white' : 'gray.600'}
              borderColor={isActive ? 'blue.900' : 'gray.200'}
              px="5"
              minH="10"
              onClick={() => onSelectZone(zone)}
              _hover={{
                bg: isActive ? 'blue.900' : 'gray.50',
                borderColor: isActive ? 'blue.900' : 'gray.300',
              }}
            >
              {zone}
            </Button>
          )
        })}
      </HStack>
    </Stack>
  )
}