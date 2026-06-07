import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { IncidentStatus } from '../types'

const statusTones: Record<IncidentStatus, LabelBoxTone> = {
  active: 'green',
  closed: 'gray',
  resolved: 'teal',
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <LabelBox tone={statusTones[status]} minW="36">
      {status}
    </LabelBox>
  )
}
