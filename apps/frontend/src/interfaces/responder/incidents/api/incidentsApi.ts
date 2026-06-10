import type {
  Incident,
  IncidentLogCategory,
  IncidentResourceStatus,
  IncidentStatus,
} from "../types";
import { getIncidentSeverity, isCriticalIncident } from "../utils/severity";
import type {
  IncidentApiDto,
  IncidentLogApiDto,
  OrganisationApiDto,
} from "./incidentsDto";

const validStatuses = new Set<IncidentStatus>([
  "reported",
  "triage",
  "responding",
  "on_scene",
  "stabilising",
  "monitoring",
  "resolved",
  "closed",
]);

const validResourceStatuses = new Set<IncidentResourceStatus>([
  "DISPATCHED",
  "ON SCENE",
  "COMPLETED",
]);

export async function fetchIncidents(
  filters: { organisationId?: string } = {},
) {
  const searchParams = new URLSearchParams();

  if (filters.organisationId) {
    searchParams.set("organisationId", filters.organisationId);
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/incidents${queryString ? `?${queryString}` : ""}`,
  );

  if (!response.ok) {
    throw new Error("Unable to load incidents");
  }

  const incidents = (await response.json()) as IncidentApiDto[];
  return incidents.map(mapIncidentFromApi);
}

export async function fetchIncident(id: string) {
  const response = await fetch(`/api/incidents/${id}`);

  if (!response.ok) {
    throw new Error("Unable to load incident");
  }

  const incident = (await response.json()) as IncidentApiDto;
  return mapIncidentFromApi(incident);
}

export async function updateIncident(
  id: string,
  updates: {
    title?: string;
    description?: string;
    report?: string;
    executiveSummary?: string;
    responsePlan?: string;
    entities?: string;
  },
) {
  const response = await fetch(`/api/incidents/${id}`, {
    body: JSON.stringify(updates),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Unable to save incident report"),
    );
  }
  return mapIncidentFromApi((await response.json()) as IncidentApiDto);
}

export async function regenerateFinalAnalysis(id: string) {
  const response = await fetch(`/api/incidents/${id}/final-analysis`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Unable to generate final analysis"),
    );
  }
  return response.json();
}

export async function fetchOrganisations() {
  const response = await fetch("/api/organisations");

  if (!response.ok) {
    throw new Error("Unable to load organisations");
  }

  return (await response.json()) as OrganisationApiDto[];
}

export async function assignOrganisationToIncident(
  incidentId: string,
  organisationId: string,
) {
  const response = await fetch(`/api/incidents/${incidentId}/organisations`, {
    body: JSON.stringify({ organisationId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to assign organisation");
  }

  const incident = (await response.json()) as IncidentApiDto;
  return mapIncidentFromApi(incident);
}

export async function updateIncidentAssignedOrganisation(
  incidentId: string,
  organisationId: string,
  updates: {
    notes?: string;
    status?: IncidentResourceStatus;
    unitName?: string;
  },
) {
  const response = await fetch(
    `/api/incidents/${incidentId}/organisations/${encodeURIComponent(organisationId)}`,
    {
      body: JSON.stringify(updates),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Unable to update assigned organisation",
      ),
    );
  }

  const incident = (await response.json()) as IncidentApiDto;
  return mapIncidentFromApi(incident);
}

async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string | string[];
      statusCode?: number;
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    if (message) {
      return message;
    }

    if (body?.error) {
      return body.error;
    }
  }

  const text = await response.text().catch(() => "");
  return text || fallbackMessage;
}

function mapIncidentFromApi(apiIncident: IncidentApiDto): Incident {
  const severity = getIncidentSeverity(apiIncident.severity);

  return {
    analysis: apiIncident.aiAnalysis,
    agencyProgress: apiIncident.agencyProgress?.map((progress) => ({
      ...progress,
      updatedAt: formatIncidentDate(progress.updatedAt),
    })),
    assignedOrgs: apiIncident.assignedOrgs,
    confidenceScore: apiIncident.confidenceScore ?? undefined,
    createdAt: formatIncidentDate(apiIncident.createdAt),
    createdAtRaw: apiIncident.createdAt,
    date: formatIncidentDate(apiIncident.createdAt),
    description: apiIncident.description ?? "",
    id: apiIncident.id,
    incidentCode: apiIncident.incidentCode,
    incidentType: apiIncident.incidentType,
    isCritical: isCriticalIncident(severity),
    lat: apiIncident.lat,
    lng: apiIncident.lng,
    location: apiIncident.location ?? "",
    logs: apiIncident.logs?.map(mapIncidentLogFromApi),
    report: apiIncident.report,
    resolvedAt: apiIncident.resolvedAt
      ? formatIncidentDate(apiIncident.resolvedAt)
      : undefined,
    resources: apiIncident.assignedResources?.map((resource) => ({
      agency: resource.agency,
      assignedAt: formatIncidentDate(resource.assignedAt),
      id: resource.id,
      notes: resource.notes,
      organisationId: resource.organisationId,
      status: getIncidentResourceStatus(resource.status),
      type: resource.type,
      unit: resource.unit,
    })),
    severity,
    sourceLinks: apiIncident.sourceLinks?.map((sourceLink) => ({
      externalTicketId: sourceLink.externalTicketId,
      lastSyncedAt: formatIncidentDate(sourceLink.lastSyncedAt),
    })),
    status: getIncidentStatus(apiIncident.status),
    title: apiIncident.title,
    updatedAt: formatIncidentDate(apiIncident.updatedAt),
    updatedAtRaw: apiIncident.updatedAt,
  };
}

function mapIncidentLogFromApi(log: IncidentLogApiDto) {
  return {
    agencyId: log.agencyId,
    author: log.agencyId,
    body: log.content,
    category: getIncidentLogCategory(log.content),
    id: log.id,
    source: log.agencyId,
    time: formatIncidentTime(log.createdAt),
  };
}

function getIncidentStatus(status: string): IncidentStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "active") {
    return "responding";
  }

  return validStatuses.has(normalizedStatus as IncidentStatus)
    ? (normalizedStatus as IncidentStatus)
    : "reported";
}

function getIncidentResourceStatus(status: string): IncidentResourceStatus {
  const normalizedStatus = status
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();

  return validResourceStatuses.has(normalizedStatus as IncidentResourceStatus)
    ? (normalizedStatus as IncidentResourceStatus)
    : "DISPATCHED";
}

function getIncidentLogCategory(content: string): IncidentLogCategory {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes("dispatch") || lowerContent.includes("assigned")) {
    return "deploy";
  }

  if (
    lowerContent.includes("status") ||
    lowerContent.includes("verified") ||
    lowerContent.includes("closed")
  ) {
    return "status";
  }

  if (
    lowerContent.includes("smoke") ||
    lowerContent.includes("medical") ||
    lowerContent.includes("casualt")
  ) {
    return "medical";
  }

  if (lowerContent.includes("reported") || lowerContent.includes("received")) {
    return "initial";
  }

  return "note";
}

function formatIncidentDate(date: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatIncidentTime(date: string) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
