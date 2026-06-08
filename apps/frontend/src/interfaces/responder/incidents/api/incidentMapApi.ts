import type { IncidentMapDto } from './incidentMapDto'

export async function fetchIncidentMap(incidentId: string): Promise<IncidentMapDto> {
  const response = await fetch(`/api/maps/incidents/${incidentId}`)

  if (!response.ok) {
    throw new Error('Unable to load incident map')
  }

  return (await response.json()) as IncidentMapDto
}
