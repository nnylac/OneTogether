import { Box } from '../../../../components/chakra-ui'
import type { HospitalCapacityStatus } from '../types/organisation'
import {
  getAvailableCapacityPercentage,
  getHospitalCapacityStatus,
  hospitalCapacityStatusColors,
} from '../utils/hospitalCapacity'

type CapacityBarProps = {
  value: number
  total: number
  status?: HospitalCapacityStatus
}

export function CapacityBar({ value, total, status }: CapacityBarProps) {
  const percentage = getAvailableCapacityPercentage(value, total)
  const derivedStatus = status ?? getHospitalCapacityStatus(value, total)

  return (
    <Box bg="gray.100" h="2" overflow="hidden">
      <Box
        bg={hospitalCapacityStatusColors[derivedStatus]}
        h="100%"
        transition="width 0.2s ease"
        width={`${Math.min(percentage, 100)}%`}
      />
    </Box>
  )
}