export type IncidentLogApiDto = {
  agencyId: string;
  content: string;
  createdAt: string;
  id: string;
};

export type IncidentDiscussionApiDto = {
  createdAt: string;
  id: string;
  title: string;
  updatedAt: string;
};

export type IncidentResourceApiDto = {
  agency: string;
  assignedAt: string;
  id: string;
  notes: string;
  organisationId?: string;
  status: string;
  type: string;
  unit: string;
};

export type IncidentSourceLinkApiDto = {
  externalTicketId: string;
  lastSyncedAt: string;
};

export type OrganisationApiDto = {
  id: string;
  orgName: string;
};

export type IncidentApiDto = {
  aiAnalysis?: {
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
  assignedOrgs: string[];
  agencyProgress?: Array<{
    agency: string;
    stage: string;
    updatedAt: string;
  }>;
  assignedResources?: IncidentResourceApiDto[];
  confidenceScore: number | null;
  createdAt: string;
  description: string | null;
  discussions?: IncidentDiscussionApiDto[];
  id: string;
  incidentCode: string;
  incidentType: string;
  location: string | null;
  logs?: IncidentLogApiDto[];
  report: string | null;
  resolvedAt: string | null;
  severity: number;
  sourceLinks?: IncidentSourceLinkApiDto[];
  status: string;
  title: string;
  updatedAt: string;
};
