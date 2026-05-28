export type Role = 'citizen' | 'organisation' | 'government';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Notice' | 'Info';
export type IncidentStatus = 'Reported' | 'Unverified' | 'Verified' | 'Dispatched' | 'On Scene' | 'Contained' | 'Recovery' | 'Closed';
export type IncidentType = 'Medical' | 'Fire' | 'Flood' | 'Road' | 'Infrastructure' | 'Civil' | 'Other';
export type Audience = 'all' | 'responders' | 'zone';

export interface ICSSection {
  commander: string;
  operations?: string;
  planning?: string;
  logistics?: string;
  pio?: string;
}

export interface SITREP {
  generatedAt: string;
  situation: string;
  currentActions: string[];
  nextActions: string[];
  resourceStatus: string;
  casualties?: string;
}

export interface ResourceUnit {
  id: string;
  callSign: string;
  type: 'Ambulance' | 'Fire Engine' | 'Police' | 'Boat' | 'Drone' | 'CERT Team' | 'Medical Team';
  status: 'Available' | 'Assigned' | 'En Route' | 'On Scene' | 'Engaged' | 'Offline';
  organisation: string;
  assignedIncidentId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organisationId?: string;
}

export interface Organisation {
  id: string;
  name: string;
  type: 'Government' | 'Healthcare' | 'NGO' | 'Grassroots';
  address: string;
  verified: boolean;
  volunteersAvailable: number;
  volunteersTotal: number;
  activeTasks: number;
  status: 'active' | 'deployed';
}

export type TimelineCategory =
  | 'INITIAL'
  | 'STATUS'
  | 'DEPLOY'
  | 'BROADCAST'
  | 'ASSESS'
  | 'COORD'
  | 'MEDICAL'
  | 'VOLUNTEER'
  | 'NOTE'
  | 'CLOSE';

export interface TimelineUpdate {
  id: string;
  timestamp: string;
  organisation: string;
  actor?: string;
  category: TimelineCategory;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: Exclude<Severity, 'Notice' | 'Info'>;
  status: IncidentStatus;
  createdBy: string;
  createdAt: string;
  location: string;
  zone: string;
  description: string;
  assignedOrganisations: string[];
  respondingOrganisations: { organisation: string; status: string }[];
  volunteerSupportNeeded: boolean;
  publicVisibility: 'Private' | 'Public';
  unitsResponded: number;
  volunteersResponded: number;
  timeline: TimelineUpdate[];
  suggestedSteps?: string[];
  resourceInsights?: { type: string; available: number; total: number; recommended: boolean }[];
  incidentCommander?: string;
  icsSection?: ICSSection;
  confidenceScore?: number;
  verifiedAt?: string;
  sitrep?: SITREP;
}

export interface Broadcast {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'NOTICE' | 'INFO';
  audience: Audience;
  zone?: string;
  message: string;
  issuer: string;
  timestamp: string;
  icon: string;
  linkedIncidentId?: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  organisation: string;
  location: string;
  time: string;
  urgency: 'Critical' | 'High' | 'Medium';
  skills: string[];
  slotsFilled: number;
  slotsTotal: number;
  status: 'Open' | 'Filling' | 'Full';
  description: string;
}

export interface CommunityProgramme {
  id: string;
  title: string;
  organisation: string;
  location: string;
  time: string;
  category: 'Preparedness' | 'Relief' | 'Training' | 'Awareness';
  tags: string[];
  registered: number;
  capacity: number;
  description: string;
  contact: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  availableBeds: number;
  totalBeds: number;
  icuAvailable: number;
  traumaBays: number;
  status: 'Normal' | 'Limited' | 'Critical';
  updatedAt: string;
}

export interface ThresholdAlert {
  id: string;
  title: string;
  current: number;
  threshold: number;
  unit?: string;
  status: 'Normal' | 'Warning' | 'Critical';
  recommendation: string;
}

export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  type: 'assignment' | 'update' | 'broadcast';
}
