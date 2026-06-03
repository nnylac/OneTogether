import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { IncidentStatus } from '../types'

const statusTones: Record<IncidentStatus, LabelBoxTone> = {
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
    <LabelBox tone={statusTones[status]} minW="36">
      {status}
    </LabelBox>
  )
}
