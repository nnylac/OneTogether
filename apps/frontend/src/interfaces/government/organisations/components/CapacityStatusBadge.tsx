import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { HospitalCapacityStatus } from '../types/organisation'
import { getHospitalCapacityStatusLabel } from '../utils/hospitalCapacity'

type CapacityStatusBadgeProps = {
  status: HospitalCapacityStatus
}

const statusTones: Record<HospitalCapacityStatus, LabelBoxTone> = {
  normal: 'green',
  limited: 'yellow',
  critical: 'red',
}

export function CapacityStatusBadge({ status }: CapacityStatusBadgeProps) {
  return (
    <LabelBox tone={statusTones[status]}>
      {getHospitalCapacityStatusLabel(status).toUpperCase()}
    </LabelBox>
  )
}