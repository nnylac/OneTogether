const BASE = import.meta.env.VITE_API_URL as string;

export interface DbIncident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  location: string;
  zone: string;
  publicVisibility: string;
  createdBy: string;
  incidentCommander?: string;
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
  assignedOrgIds: string[];
  latitude?: number;
  longitude?: number;
  boundaryGeoJson?: string;
  participantCount?: number;
  messageCount?: number;
  timeline?: DbTimelineEvent[];
  messages?: DbChatMessage[];
  resources?: DbResourceAssignment[];
  uploads?: DbUpload[];
  participants?: DbParticipant[];
  pois?: DbPOI[];
}

export interface DbPOI {
  id: string;
  incidentId: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: string;
  createdBy: string;
  createdAt: string;
}

export interface DbTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  actor?: string;
  organisation?: string;
  category: string;
  text: string;
  latitude?: number;
  longitude?: number;
}

export interface DbChatMessage {
  id: string;
  incidentId: string;
  senderId?: string;
  senderName: string;
  senderRole?: string;
  content: string;
  isAi: boolean;
  aiCommand?: string;
  createdAt: string;
}

export interface DbResourceAssignment {
  id: string;
  incidentId: string;
  unitId: string;
  status: string;
  assignedAt: string;
  notes?: string;
  unit?: {
    id: string;
    callSign: string;
    type: string;
    status: string;
    organisationId: string;
    lastKnownLat?: number;
    lastKnownLng?: number;
    organisation?: { id: string; name: string };
  };
}

export interface DbUpload {
  id: string;
  incidentId: string;
  uploadedBy: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface DbUnit {
  id: string;
  callSign: string;
  type: string;
  status: string;
  organisationId: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  organisation?: { id: string; name: string };
}

export interface DbParticipant {
  incidentId: string;
  userId: string;
  userName: string;
  joinedAt: string;
  lastSeenAt: string;
}


export async function fetchIncidents(): Promise<DbIncident[]> {
  const r = await fetch(`${BASE}/incidents`);
  return r.json() as Promise<DbIncident[]>;
}

export async function fetchIncident(id: string): Promise<DbIncident> {
  const r = await fetch(`${BASE}/incidents/${id}`);
  return r.json() as Promise<DbIncident>;
}

export async function fetchMessages(incidentId: string): Promise<DbChatMessage[]> {
  const r = await fetch(`${BASE}/incidents/${incidentId}/messages`);
  return r.json() as Promise<DbChatMessage[]>;
}

export async function fetchAvailableUnits(): Promise<DbUnit[]> {
  const r = await fetch(`${BASE}/units`);
  return r.json() as Promise<DbUnit[]>;
}

export async function assignUnit(incidentId: string, unitId: string): Promise<DbResourceAssignment> {
  const r = await fetch(`${BASE}/incidents/${incidentId}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitId }),
  });
  return r.json() as Promise<DbResourceAssignment>;
}

export async function unassignUnit(incidentId: string, unitId: string): Promise<void> {
  await fetch(`${BASE}/incidents/${incidentId}/resources/${unitId}`, { method: 'DELETE' });
}

export async function uploadFile(
  incidentId: string,
  file: File,
  uploadedBy: string,
  caption?: string,
): Promise<DbUpload> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('uploadedBy', uploadedBy);
  if (caption) fd.append('caption', caption);
  const r = await fetch(`${BASE}/incidents/${incidentId}/uploads`, { method: 'POST', body: fd });
  return r.json() as Promise<DbUpload>;
}

export async function getAuthToken(userId: string): Promise<{ token: string; user: { id: string; name: string; role: string; organisationId?: string } }> {
  const r = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return r.json() as Promise<{ token: string; user: { id: string; name: string; role: string; organisationId?: string } }>;
}
