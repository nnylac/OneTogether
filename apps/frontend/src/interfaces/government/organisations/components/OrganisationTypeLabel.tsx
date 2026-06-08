import { LabelBox } from '../../../../components/ui/LabelBox'
import type { LabelBoxTone } from '../../../../components/ui/LabelBox'
import type { CommunityOrganisationType } from '../types/organisation'

type OrganisationTypeLabelProps = {
  type: CommunityOrganisationType
}

const typeTones: Record<CommunityOrganisationType, LabelBoxTone> = {
  Government: 'blue',
  Healthcare: 'teal',
  NGO: 'purple',
  Grassroots: 'gray',
}

export function OrganisationTypeLabel({ type }: OrganisationTypeLabelProps) {
  return <LabelBox tone={typeTones[type]}>{type.toUpperCase()}</LabelBox>
}