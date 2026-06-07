export const assignedOrganisationStatuses = [
  'DISPATCHED',
  'ON SCENE',
  'COMPLETED',
] as const;

export type AssignedOrganisationStatus =
  (typeof assignedOrganisationStatuses)[number];

export function toAssignedOrganisationStatus(
  status: string,
): AssignedOrganisationStatus | null {
  const normalizedStatus = status
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();

  return assignedOrganisationStatuses.includes(
    normalizedStatus as AssignedOrganisationStatus,
  )
    ? (normalizedStatus as AssignedOrganisationStatus)
    : null;
}
