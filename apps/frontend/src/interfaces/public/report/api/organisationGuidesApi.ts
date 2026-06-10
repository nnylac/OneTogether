import { sampleOrganisationGuides } from '../data/sampleOrganisationGuides'
import type { OrganisationGuide } from '../types/organisationGuide'

export async function fetchOrganisationGuides(): Promise<OrganisationGuide[]> {
  try {
    const response = await fetch('/api/organisations')

    if (!response.ok) {
      throw new Error('Unable to load organisation guides')
    }

    const organisations = (await response.json()) as OrganisationGuide[]
    const guides = organisations.filter(
      (organisation) =>
        Boolean(organisation.contactNumber || organisation.contactChannel) &&
        Boolean(organisation.serviceSummary || organisation.contactGuidance),
    )

    return guides.length > 0 ? sortGuides(guides) : sampleOrganisationGuides
  } catch {
    return sampleOrganisationGuides
  }
}

export function sortGuides(guides: OrganisationGuide[]) {
  const priority = new Map(
    [
      'SCDF',
      'SPF',
      'MOH',
      'SGH',
      'SINGHEALTH',
      'NUHS',
      'PUB',
      'NEA',
      'LTA',
      'HDB',
      'EMA',
      'TOWN_COUNCIL',
    ].map((name, index) => [name, index]),
  )

  return [...guides].sort((a, b) => {
    const aPriority = priority.get(a.orgName) ?? Number.MAX_SAFE_INTEGER
    const bPriority = priority.get(b.orgName) ?? Number.MAX_SAFE_INTEGER

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    return a.orgName.localeCompare(b.orgName)
  })
}
