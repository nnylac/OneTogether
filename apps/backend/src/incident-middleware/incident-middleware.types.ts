export type RawAgencyMessage = {
  message_kind?: string;
  sender?: {
    agency_id?: string;
    org_id?: string;
    system_id?: string;
    service_instance?: string;
  };
  external_incident_id?: string;
  trace_id?: string;
  incident?: {
    incident_id?: string;
    incident_type?: string;
    severity?: number;
    location?: {
      name?: string;
      area?: string;
      lat?: number;
      lng?: number;
      postal_code?: string;
    };
    description?: string;
    triggered_at?: string;
  };
  ticket?: {
    ticket_id?: string;
    status?: string;
    data?: Record<string, unknown>;
  };
  logs?: unknown[];
  handoff?: Record<string, unknown>;
  quality?: Record<string, unknown>;
};

export type NormalizedIncidentTicket = {
  agencyId: string;
  orgId: string;
  systemId: string;
  externalIncidentId: string;
  externalTicketId: string;
  status: string;
  title: string;
  description: string;
  incidentType: string;
  severity: number;
  priority: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  confidenceScore: number;
  rawMessage: RawAgencyMessage;
};
