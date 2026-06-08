import { Box, Text } from '../../../../components/chakra-ui'
import { BroadcastAudienceBox } from './BroadcastAudienceBox'
import type { BroadcastAudience } from '../types/broadcast'

type BroadcastAudienceSelectorProps = {
  selectedAudience: BroadcastAudience
  onSelectAudience: (audience: BroadcastAudience) => void
}

const audienceOptions: Array<{
  value: BroadcastAudience
  title: string
  description: string
}> = [
  {
    value: 'Public',
    title: 'Public',
    description: 'Citizens using the platform',
  },
  {
    value: 'Responders',
    title: 'Responders',
    description: 'Internal response teams',
  },
  {
    value: 'Zone',
    title: 'By Zone',
    description: 'Specific geographic zone',
  },
]

export function BroadcastAudienceSelector({
  selectedAudience,
  onSelectAudience,
}: BroadcastAudienceSelectorProps) {
  return (
    <Box>
      <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
        Audience
      </Text>

      <Box
        display="grid"
        gap="3"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
      >
        {audienceOptions.map((audience) => (
          <BroadcastAudienceBox
            key={audience.value}
            title={audience.title}
            description={audience.description}
            isActive={selectedAudience === audience.value}
            onClick={() => onSelectAudience(audience.value)}
          />
        ))}
      </Box>
    </Box>
  )
}