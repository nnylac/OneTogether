export type IncidentStatus =
  | "reported"
  | "triage"
  | "responding"
  | "on_scene"
  | "stabilising"
  | "monitoring"
  | "resolved"
  | "closed";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";

export type Incident = {
  assignedOrgs?: string[];
  agencyProgress?: Array<{
    agency: string;
    stage: string;
    updatedAt: string;
  }>;
  confidenceScore?: number;
  analysis?: {
    category: string | null;
    urgency: string | null;
    severityEstimate: number | null;
    confidence: number | null;
    finalAnalysis: {
      status: string;
      executiveSummary: string | null;
      responsePlan: string | null;
      entities: string | null;
      finalizedAt: string | null;
    };
  };
  createdAt?: string;
  createdAtRaw?: string;
  discussions?: Array<{
    createdAt: string;
    id: string;
    title: string;
    updatedAt: string;
  }>;
  incidentCode?: string;
  incidentCommander?: string;
  incidentType?: string;
  id: string;
  title: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  description: string;
  logs?: IncidentLogEntry[];
  report?: string | null;
  resolvedAt?: string;
  resources?: IncidentResource[];
  severity?: IncidentSeverity;
  sourceLinks?: Array<{
    externalTicketId: string;
    lastSyncedAt: string;
  }>;
  status: IncidentStatus;
  updatedAt?: string;
  updatedAtRaw?: string;
  zone?: string;
  isCritical: boolean;
  date: string;
};

export type IncidentLogCategory =
  | "initial"
  | "status"
  | "deploy"
  | "medical"
  | "note";

export type IncidentLogEntry = {
  id: string;
  category: IncidentLogCategory;
  source: string;
  author: string;
  body: string;
  agencyId: string;
  time: string;
};

export type IncidentReportDraft = {
  incidentName: string;
  incidentDate: string;
  incidentDescription: string;
  executiveSummary: string;
  responsePlan: string;
  entities: string;
};

export type IncidentResourceStatus = "DISPATCHED" | "ON SCENE" | "COMPLETED";

export type IncidentResource = {
  id: string;
  organisationId?: string;
  unit: string;
  agency: string;
  type: string;
  assignedAt: string;
  status: IncidentResourceStatus;
  notes: string;
};
