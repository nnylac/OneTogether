import { Badge } from '../../../../components/chakra-ui'
import type { IncidentStatus } from '../types'

const statusPalettes: Record<IncidentStatus, string> = {
  reported: 'gray',
  unverified: 'yellow',
  verified: 'blue',
  dispatched: 'purple',
  'on scene': 'green',
  contained: 'teal',
  recovery: 'orange',
  closed: 'gray',
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge
      colorPalette={statusPalettes[status]}
      justifyContent="center"
      minH="9"
      minW="36"
      px="4"
      variant="subtle"
    >
      {status}
    </Badge>
  )
}
