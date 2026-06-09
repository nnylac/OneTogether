export type IncidentMapResourceDto = {
  id: string;
  unitRef: string;
  agency: string;
  resourceKind: string;
  status: string;
  originStation: string | null;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  dispatchedAt: string;
  updatedAt: string;
  notes: string | null;
};

export type IncidentMapSummaryDto = {
  total: number;
  dispatched: number;
  enRoute: number;
  onScene: number;
  returning: number;
  unavailable: number;
  completed: number;
};

export type IncidentMapDto = {
  incident: {
    id: string;
    code: string;
    title: string;
    incidentType: string;
    severity: number;
    status: string;
    location: string | null;
    lat: number | null;
    lng: number | null;
  };
  resources: IncidentMapResourceDto[];
  summary: IncidentMapSummaryDto;
};
