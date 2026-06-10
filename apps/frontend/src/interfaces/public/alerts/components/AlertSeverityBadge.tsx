import { Badge } from '../../../../components/chakra-ui'
import { severityTone } from '../utils/alertDisplay'
import type { PublicAlertSeverity } from '../types/alert'

type AlertSeverityBadgeProps = {
  severity: PublicAlertSeverity
}

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  const tone = severityTone[severity]

  return (
    <Badge
      bg={tone.color}
      color="white"
      fontSize="xs"
      letterSpacing="0"
      px="3"
      py="1"
      textTransform="uppercase"
    >
      {tone.label}
    </Badge>
  )
}
