import {
  Info,
  Megaphone,
  TrainFront,
  TriangleAlert,
  Waves,
} from 'lucide-react'
import type { ElementType } from 'react'
import type { PublicAlert, PublicAlertSeverity } from '../types/alert'

export type AlertTone = {
  accent: string
  bg: string
  border: string
  color: string
  icon: ElementType
  label: string
}

export const severityTone: Record<PublicAlertSeverity, AlertTone> = {
  critical: {
    accent: 'red.500',
    bg: 'red.50',
    border: 'red.200',
    color: 'red.600',
    icon: TriangleAlert,
    label: 'Critical',
  },
  warning: {
    accent: 'orange.400',
    bg: 'orange.50',
    border: 'orange.200',
    color: 'orange.600',
    icon: Megaphone,
    label: 'Warning',
  },
  advisory: {
    accent: 'teal.500',
    bg: 'teal.50',
    border: 'teal.200',
    color: 'teal.600',
    icon: TriangleAlert,
    label: 'Advisory',
  },
  info: {
    accent: 'blue.700',
    bg: 'blue.50',
    border: 'blue.200',
    color: 'blue.700',
    icon: Info,
    label: 'Info',
  },
}

export function getAlertIcon(alert: PublicAlert) {
  const title = alert.title.toLowerCase()

  if (title.includes('flood')) {
    return Waves
  }

  if (title.includes('mrt') || title.includes('train')) {
    return TrainFront
  }

  return severityTone[alert.severity].icon
}

export function getAudienceLabel(alert: PublicAlert) {
  if (alert.audience === 'Zone' && alert.zone) {
    return `${alert.zone} zone`
  }

  return 'Public'
}
