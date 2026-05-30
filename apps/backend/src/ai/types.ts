export interface TimelineEntry {
  timestamp: string;
  organisation: string;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  description: string;
  unitsResponded: number;
  volunteersResponded: number;
  assignedOrganisations: string[];
  timeline?: TimelineEntry[];
}
