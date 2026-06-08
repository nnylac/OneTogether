import { Box, Flex, Stack, Text } from '../../../../components/chakra-ui'
import { CapacityBar } from './CapacityBar'
import { CapacityStatusBadge } from './CapacityStatusBadge'
import { ResourceMetricBox } from './ResourceMetricBox'
import type { Hospital } from '../types/organisation'
import {
  getAvailableCapacityPercentage,
  getHospitalCapacityStatus,
} from '../utils/hospitalCapacity'

type HospitalCardProps = {
  hospital: Hospital
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  const availablePercentage = getAvailableCapacityPercentage(
    hospital.availableBeds,
    hospital.totalBeds,
  )

  const capacityStatus = getHospitalCapacityStatus(
    hospital.availableBeds,
    hospital.totalBeds,
  )

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="4">
      <Stack gap="4">
        <Flex justify="space-between" align="start" gap="4">
          <Box>
            <Text color="gray.900" fontSize="lg" fontWeight="700">
              {hospital.name}
            </Text>

            <Text color="gray.500" fontSize="sm" mt="1">
              {hospital.address}
            </Text>
          </Box>

          <CapacityStatusBadge status={capacityStatus} />
        </Flex>

        <Box
          display="grid"
          gap="2"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
        >
          <ResourceMetricBox
            value={`${hospital.availableBeds}/${hospital.totalBeds}`}
            label="Available Beds"
          />

          <ResourceMetricBox
            value={hospital.icuAvailable}
            label="ICU Available"
          />

          <ResourceMetricBox
            value={hospital.traumaBays}
            label="Trauma Bays"
          />
        </Box>

        <Stack gap="2">
          <CapacityBar
            value={hospital.availableBeds}
            total={hospital.totalBeds}
            status={capacityStatus}
          />

          <Flex justify="space-between" gap="3">
            <Text color="gray.700" fontSize="xs">
              {availablePercentage}% capacity available
            </Text>

            <Text color="gray.700" fontSize="xs">
              updated {formatTime(hospital.lastUpdatedAt)}
            </Text>
          </Flex>
        </Stack>
      </Stack>
    </Box>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}