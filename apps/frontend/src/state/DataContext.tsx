import { createContext, useContext, useMemo, useState } from 'react';
import type { AiAdvisory, Broadcast, CommunityProgramme, Hospital, Incident, ResourceUnit, ThresholdAlert, TimelineCategory, TimelineUpdate, VolunteerTask } from '../types';

function makeTlEntry(category: TimelineCategory, organisation: string, text: string, actor?: string): TimelineUpdate {
  const now = new Date();
  const date = now.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  const hhmm = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: `${date}, ${hhmm}`, organisation, actor, category, text };
}
import * as seed from '../data/seed';

interface DataContextValue {
  users: typeof seed.users;
  organisations: typeof seed.organisations;
  notifications: typeof seed.notifications;
  incidents: Incident[];
  broadcasts: Broadcast[];
  volunteerTasks: VolunteerTask[];
  communityProgrammes: CommunityProgramme[];
  hospitals: Hospital[];
  thresholds: ThresholdAlert[];
  publicAlerts: Broadcast[];
  readAlertIds: Set<string>;
  units: ResourceUnit[];
  markAlertRead: (id: string) => void;
  publishBroadcast: (broadcast: Omit<Broadcast, 'id' | 'timestamp' | 'issuer' | 'icon'> & Partial<Pick<Broadcast, 'issuer' | 'icon'>>) => void;
  deleteBroadcast: (id: string) => void;
  makeIncidentPublic: (incidentId: string) => void;
  assignIncident: (incidentId: string, organisationId: string) => void;
  updateIncidentStatus: (incidentId: string, status: Incident['status']) => void;
  requestVolunteers: (incidentId: string) => void;
  resolveIncident: (incidentId: string) => void;
  updateHospital: (id: string, patch: Partial<Hospital>) => void;
  postVolunteerTask: (task: Omit<VolunteerTask, 'id' | 'slotsFilled' | 'status'>) => void;
  updateThreshold: (id: string, threshold: number) => void;
  registerProgramme: (id: string) => void;
  signUpTask: (id: string) => void;
  addTimelineUpdate: (incidentId: string, entry: { category: TimelineCategory; organisation: string; actor?: string; text: string }) => void;
  updateUnitStatus: (unitId: string, status: ResourceUnit['status'], assignedIncidentId?: string) => void;
  generateSitrep: (incidentId: string) => Promise<void>;
  advanceIncidentStatus: (incidentId: string, logEntry: { category: TimelineCategory; organisation: string; actor?: string; text: string }) => void;
  addRespondingOrg: (incidentId: string, orgName: string, status: string) => void;
  updateRespondingOrgStatus: (incidentId: string, orgName: string, newStatus: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState(seed.incidents);
  const [broadcasts, setBroadcasts] = useState(seed.broadcasts);
  const [volunteerTasks, setVolunteerTasks] = useState(seed.volunteerTasks);
  const [communityProgrammes, setCommunityProgrammes] = useState(seed.communityProgrammes);
  const [hospitals, setHospitals] = useState(seed.hospitals);
  const [thresholds, setThresholds] = useState(seed.thresholds);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [units, setUnits] = useState<ResourceUnit[]>(seed.units);

  const markAlertRead = (id: string) => {
    setReadAlertIds((prev) => new Set([...prev, id]));
  };

  const publicAlerts = useMemo(() => {
    const incidentAlerts: Broadcast[] = incidents
      .filter((incident) => incident.publicVisibility === 'Public')
      .map((incident) => ({
        id: `incident-${incident.id}`,
        title: incident.title,
        severity: incident.severity === 'Critical' ? 'CRITICAL' : 'NOTICE',
        audience: 'all',
        zone: incident.zone,
        message: incident.description,
        issuer: incident.createdBy.toUpperCase(),
        timestamp: incident.createdAt,
        icon: incident.type === 'Flood' ? 'Waves' : 'ShieldAlert',
        linkedIncidentId: incident.id
      }));
    const byId = new Map([...broadcasts, ...incidentAlerts].map((item) => [item.id, item]));
    return [...byId.values()];
  }, [broadcasts, incidents]);

  const publishBroadcast: DataContextValue['publishBroadcast'] = (broadcast) => {
    setBroadcasts((current) => [
      {
        ...broadcast,
        id: `b${Date.now()}`,
        issuer: broadcast.issuer ?? 'Raj Kumar',
        timestamp: '20 May 2026, 02:03 pm',
        icon: broadcast.icon ?? 'Megaphone'
      },
      ...current
    ]);
  };

  const deleteBroadcast = (id: string) => {
    setBroadcasts((current) => current.filter((broadcast) => broadcast.id !== id));
  };

  const makeIncidentPublic = (incidentId: string) => {
    setIncidents((current) => current.map((incident) => incident.id === incidentId ? { ...incident, publicVisibility: 'Public' } : incident));
  };

  const assignIncident = (incidentId: string, organisationId: string) => {
    setIncidents((current) => current.map((incident) => incident.id === incidentId && !incident.assignedOrganisations.includes(organisationId)
      ? { ...incident, assignedOrganisations: [...incident.assignedOrganisations, organisationId] }
      : incident));
  };

  const updateIncidentStatus = (incidentId: string, status: Incident['status']) => {
    setIncidents((current) => current.map((incident) => incident.id === incidentId ? { ...incident, status, timeline: [...incident.timeline, makeTlEntry('STATUS', 'OneTogether', `Status updated to ${status}.`)] } : incident));
  };

  const requestVolunteers = (incidentId: string) => {
    setIncidents((current) => current.map((incident) => incident.id === incidentId ? { ...incident, volunteerSupportNeeded: true, timeline: [...incident.timeline, makeTlEntry('VOLUNTEER', 'SCDF', 'Volunteer support requested via OneTogether platform.')] } : incident));
  };

  const resolveIncident = (incidentId: string) => updateIncidentStatus(incidentId, 'Closed');

  const addTimelineUpdate: DataContextValue['addTimelineUpdate'] = (incidentId, entry) => {
    setIncidents((current) => current.map((incident) => incident.id === incidentId
      ? { ...incident, timeline: [...incident.timeline, makeTlEntry(entry.category, entry.organisation, entry.text, entry.actor)] }
      : incident));
  };

  const updateHospital = (id: string, patch: Partial<Hospital>) => {
    setHospitals((current) => current.map((hospital) => hospital.id === id ? { ...hospital, ...patch, updatedAt: '02:04 pm' } : hospital));
  };

  const postVolunteerTask: DataContextValue['postVolunteerTask'] = (task) => {
    setVolunteerTasks((current) => [{ ...task, id: `vt${Date.now()}`, slotsFilled: 0, status: 'Open' }, ...current]);
  };

  const updateThreshold = (id: string, threshold: number) => {
    setThresholds((current) => current.map((alert) => alert.id === id ? { ...alert, threshold, status: alert.current >= threshold ? 'Critical' : 'Normal' } : alert));
  };

  const registerProgramme = (id: string) => {
    setCommunityProgrammes((current) => current.map((programme) => programme.id === id ? { ...programme, registered: Math.min(programme.capacity, programme.registered + 1) } : programme));
  };

  const signUpTask = (id: string) => {
    setVolunteerTasks((current) => current.map((task) => task.id === id ? { ...task, slotsFilled: Math.min(task.slotsTotal, task.slotsFilled + 1), status: task.slotsFilled + 1 >= task.slotsTotal ? 'Full' : 'Filling' } : task));
  };

  const updateUnitStatus: DataContextValue['updateUnitStatus'] = (unitId, status, assignedIncidentId) => {
    setUnits((current) => current.map((unit) => unit.id === unitId ? { ...unit, status, assignedIncidentId: assignedIncidentId ?? unit.assignedIncidentId } : unit));
    if (assignedIncidentId) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) {
        const action = status === 'En Route' ? `${unit.callSign} (${unit.type}) dispatched en route.` : status === 'On Scene' ? `${unit.callSign} (${unit.type}) arrived on scene.` : `${unit.callSign} status updated to ${status}.`;
        addTimelineUpdate(assignedIncidentId, { category: 'DEPLOY', organisation: unit.organisation, text: action });
      }
    }
  };

  const STATUS_ORDER: Incident['status'][] = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'];

  const advanceIncidentStatus: DataContextValue['advanceIncidentStatus'] = (incidentId, logEntry) => {
    setIncidents((current) => current.map((incident) => {
      if (incident.id !== incidentId) return incident;
      const idx = STATUS_ORDER.indexOf(incident.status);
      const next = idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : incident.status;
      const tlEntry = makeTlEntry(logEntry.category, logEntry.organisation, logEntry.text, logEntry.actor);
      const statusEntry = makeTlEntry('STATUS', 'OneTogether', `Status advanced to ${next}.`);
      return { ...incident, status: next, timeline: [...incident.timeline, tlEntry, statusEntry] };
    }));
  };

  const addRespondingOrg = (incidentId: string, orgName: string, status: string) => {
    setIncidents((current) => current.map((incident) =>
      incident.id === incidentId && !incident.respondingOrganisations.some((ro) => ro.organisation === orgName)
        ? { ...incident, respondingOrganisations: [...incident.respondingOrganisations, { organisation: orgName, status }] }
        : incident
    ));
  };

  const updateRespondingOrgStatus = (incidentId: string, orgName: string, newStatus: string) => {
    setIncidents((current) => current.map((incident) =>
      incident.id === incidentId
        ? { ...incident, respondingOrganisations: incident.respondingOrganisations.map((ro) => ro.organisation === orgName ? { ...ro, status: newStatus } : ro) }
        : incident
    ));
  };

  const generateSitrep: DataContextValue['generateSitrep'] = async (incidentId) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    let advisory: AiAdvisory;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      advisory = {
        generatedAt: data.generatedAt ?? new Date().toLocaleString('en-SG'),
        assessment: data.assessment ?? '',
        recommendations: data.recommendations ?? [],
        warnings: data.warnings ?? [],
      };
    } catch {
      advisory = {
        generatedAt: new Date().toLocaleString('en-SG'),
        assessment: `${incident.type} incident at ${incident.location} is currently ${incident.status}. Immediate coordination required across assigned agencies.`,
        recommendations: [
          { priority: 'High', action: 'Confirm resource sufficiency', detail: 'Verify current units are adequate and request reinforcements if needed.' },
          { priority: 'High', action: 'Establish clear command', detail: 'Ensure an incident commander is designated and all agencies are under unified command.' },
          { priority: 'Medium', action: 'Issue public advisory', detail: 'Communicate safety instructions to affected public via official channels.' },
        ],
        warnings: ['Monitor for escalation and adjust deployment accordingly.', 'Ensure inter-agency communications are functioning on all channels.'],
      };
    }

    setIncidents((current) => current.map((i) => i.id === incidentId ? { ...i, advisory } : i));
  };

  const value: DataContextValue = {
    users: seed.users,
    organisations: seed.organisations,
    notifications: seed.notifications,
    incidents,
    broadcasts,
    volunteerTasks,
    communityProgrammes,
    hospitals,
    thresholds,
    publicAlerts,
    readAlertIds,
    units,
    markAlertRead,
    publishBroadcast,
    deleteBroadcast,
    makeIncidentPublic,
    assignIncident,
    updateIncidentStatus,
    requestVolunteers,
    resolveIncident,
    updateHospital,
    postVolunteerTask,
    updateThreshold,
    registerProgramme,
    signUpTask,
    addTimelineUpdate,
    updateUnitStatus,
    generateSitrep,
    advanceIncidentStatus,
    addRespondingOrg,
    updateRespondingOrgStatus
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
