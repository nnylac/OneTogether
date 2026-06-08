import { Box } from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { VolunteerTaskUrgency } from '../types/organisation'

type UrgencyLabelProps = {
  urgency: VolunteerTaskUrgency
}

const urgencyTones: Record<VolunteerTaskUrgency, LabelBoxTone> = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
}

export function UrgencyLabel({ urgency }: UrgencyLabelProps) {
  return (
    <Box display="flex" justifyContent="flex-start" alignItems="center">
      <LabelBox tone={urgencyTones[urgency]}>
        {urgency.toUpperCase()}
      </LabelBox>
    </Box>
  )
}