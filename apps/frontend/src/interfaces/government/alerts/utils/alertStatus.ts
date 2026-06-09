import type { AlertCondition, AlertStatus, AlertUnit } from '../types/alert'

export function calculateAlertStatus(
  currentValue: number,
  thresholdValue: number,
  condition: AlertCondition,
): AlertStatus {
  if (thresholdValue <= 0) {
    return 'Normal'
  }

  if (condition === 'above') {
    if (currentValue >= thresholdValue) {
      return 'Critical'
    }

    if (currentValue >= thresholdValue * 0.8) {
      return 'Warning'
    }

    return 'Normal'
  }

  if (currentValue <= thresholdValue) {
    return 'Critical'
  }

  if (currentValue <= thresholdValue * 1.2) {
    return 'Warning'
  }

  return 'Normal'
}

export function formatAlertValue(value: number, unit: AlertUnit) {
  return unit === 'percent' ? `${value}%` : value.toString()
}