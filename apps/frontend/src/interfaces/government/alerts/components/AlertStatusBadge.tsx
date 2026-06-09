import { Badge } from '../../../../components/chakra-ui'
import type { AlertStatus } from '../types/alert'

type AlertStatusBadgeProps = {
  status: AlertStatus
}

const statusStyles: Record<
  AlertStatus,
  {
    bg: string
    color: string
    borderColor: string
  }
> = {
  Normal: {
    bg: 'green.50',
    color: 'green.700',
    borderColor: 'green.200',
  },
  Warning: {
    bg: 'orange.50',
    color: 'orange.700',
    borderColor: 'orange.200',
  },
  Critical: {
    bg: 'red.50',
    color: 'red.700',
    borderColor: 'red.200',
  },
}

export function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  const styles = statusStyles[status]

  return (
    <Badge
      bg={styles.bg}
      borderColor={styles.borderColor}
      borderWidth="1px"
      color={styles.color}
      px="2"
      py="1"
      textTransform="uppercase"
    >
      {status}
    </Badge>
  )
}
