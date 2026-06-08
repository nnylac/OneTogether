import type { HospitalCapacityStatus } from '../types/organisation'

export const hospitalCapacityThresholds = {
  normalMinimumPercentage: 25,
  limitedMinimumPercentage: 10,
}

export const hospitalCapacityStatusColors: Record<
  HospitalCapacityStatus,
  string
> = {
  normal: 'green.500',
  limited: 'orange.400',
  critical: 'red.500',
}

export function getAvailableCapacityPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((value / total) * 100)
}

export function getHospitalCapacityStatus(
  availableBeds: number,
  totalBeds: number,
): HospitalCapacityStatus {
  const availablePercentage = getAvailableCapacityPercentage(
    availableBeds,
    totalBeds,
  )

  if (availablePercentage < hospitalCapacityThresholds.limitedMinimumPercentage) {
    return 'critical'
  }

  if (availablePercentage < hospitalCapacityThresholds.normalMinimumPercentage) {
    return 'limited'
  }

  return 'normal'
}

export function getHospitalCapacityStatusLabel(
  status: HospitalCapacityStatus,
) {
  if (status === 'normal') {
    return 'Normal'
  }

  if (status === 'limited') {
    return 'Limited'
  }

  return 'Critical'
}