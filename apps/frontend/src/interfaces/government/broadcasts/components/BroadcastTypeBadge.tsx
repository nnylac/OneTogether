import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { BroadcastAudience, BroadcastZone } from '../types/broadcast'

type BroadcastTypeBadgeProps = {
  label: BroadcastAudience | BroadcastZone
}

const badgeTones: Record<string, LabelBoxTone> = {
  Public: 'blue',
  Responders: 'green',
  Zone: 'yellow',
  Nationwide: 'gray',
  Central: 'gray',
  East: 'gray',
  West: 'gray',
  North: 'gray',
  South: 'gray',
}

export function BroadcastTypeBadge({ label }: BroadcastTypeBadgeProps) {
  return (
    <LabelBox tone={badgeTones[label] ?? 'gray'}>
      {label.toUpperCase()}
    </LabelBox>
  )
}