import {
  Ambulance,
  Building2,
  Bus,
  Droplets,
  Flame,
  HeartPulse,
  Home,
  Leaf,
  Phone,
  Shield,
  Zap,
} from 'lucide-react'
import type { ElementType } from 'react'

export type OrganisationTone = {
  bg: string
  border: string
  color: string
  icon: ElementType
  label: string
}

export function getOrganisationTone(orgName: string): OrganisationTone {
  const tones: Record<string, OrganisationTone> = {
    SCDF: {
      bg: 'red.50',
      border: 'red.200',
      color: 'red.600',
      icon: Flame,
      label: 'Emergency',
    },
    SPF: {
      bg: 'blue.50',
      border: 'blue.200',
      color: 'blue.700',
      icon: Shield,
      label: 'Police',
    },
    MOH: {
      bg: 'green.50',
      border: 'green.200',
      color: 'green.700',
      icon: HeartPulse,
      label: 'Health',
    },
    SGH: {
      bg: 'green.50',
      border: 'green.200',
      color: 'green.700',
      icon: Ambulance,
      label: 'Hospital',
    },
    SINGHEALTH: {
      bg: 'green.50',
      border: 'green.200',
      color: 'green.700',
      icon: HeartPulse,
      label: 'Healthcare',
    },
    NUHS: {
      bg: 'green.50',
      border: 'green.200',
      color: 'green.700',
      icon: HeartPulse,
      label: 'Healthcare',
    },
    PUB: {
      bg: 'cyan.50',
      border: 'cyan.200',
      color: 'cyan.700',
      icon: Droplets,
      label: 'Water',
    },
    NEA: {
      bg: 'teal.50',
      border: 'teal.200',
      color: 'teal.700',
      icon: Leaf,
      label: 'Environment',
    },
    LTA: {
      bg: 'orange.50',
      border: 'orange.200',
      color: 'orange.600',
      icon: Bus,
      label: 'Transport',
    },
    HDB: {
      bg: 'purple.50',
      border: 'purple.200',
      color: 'purple.700',
      icon: Home,
      label: 'Housing',
    },
    EMA: {
      bg: 'yellow.50',
      border: 'yellow.200',
      color: 'yellow.700',
      icon: Zap,
      label: 'Energy',
    },
    TOWN_COUNCIL: {
      bg: 'gray.50',
      border: 'gray.200',
      color: 'gray.700',
      icon: Building2,
      label: 'Municipal',
    },
  }

  return (
    tones[orgName] ?? {
      bg: 'gray.50',
      border: 'gray.200',
      color: 'gray.700',
      icon: Phone,
      label: 'Service',
    }
  )
}

export function formatOrganisationName(orgName: string) {
  if (orgName === 'TOWN_COUNCIL') {
    return 'Town Council'
  }

  if (orgName === 'SINGHEALTH') {
    return 'SingHealth'
  }

  return orgName
}
