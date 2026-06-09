import { Box, Stack, Text } from '../../../../components/chakra-ui'
import { CapacityBar } from './CapacityBar'
import { UrgencyLabel } from './UrgencyLabel'
import type { VolunteerTask } from '../types/organisation'

type VolunteerTaskRowProps = {
  task: VolunteerTask
}

export function VolunteerTaskRow({ task }: VolunteerTaskRowProps) {
  return (
    <Box
      borderTopColor="gray.100"
      borderTopWidth="1px"
      px="4"
      py="4"
    >
      <Box
        display="grid"
        gap="4"
        gridTemplateColumns={{
          base: '1fr',
          xl: '2fr 1.4fr 1.4fr 0.8fr 1.2fr',
        }}
        alignItems="center"
      >
        <Stack gap="1">
          <Text color="gray.900" fontWeight="900">
            {task.title}
          </Text>
          <Text color="gray.500" fontSize="sm">
            {task.location}
          </Text>
        </Stack>

        <Text color="gray.700" fontSize="sm">
          {task.organisation}
        </Text>

        <Text color="gray.700" fontSize="sm">
          {task.dateTime}
        </Text>

        <UrgencyLabel urgency={task.urgency} />

        <Stack gap="2">
          <CapacityBar
            value={task.slotsFilled}
            total={task.slotsTotal}
            status={task.urgency === 'Critical' ? 'critical' : 'limited'}
          />

          <Text color="gray.700" fontSize="sm" textAlign="right">
            {task.slotsFilled} of {task.slotsTotal} slots filled
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}