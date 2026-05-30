import { createContext, useContext, useMemo, useState } from 'react';
import type { Broadcast, CommunityProgramme, Hospital, Incident, IncidentSource, IncidentType, ResourceUnit, SITREP, ThresholdAlert, TimelineCategory, TimelineUpdate, VolunteerTask } from '../types';

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

// Fire-and-forget — backend is a write-through store; UI updates instantly from local state
function apiPost(path: string, body?: unknown) {
  fetch(`${API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }).catch(() => null);
}
function apiPatch(path: string, body: unknown) {
  fetch(`${API}/${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
}
function apiDelete(path: string) {
  fetch(`${API}/${path}`, { method: 'DELETE' }).catch(() => null);
}
async function aiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API}/ai/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('AI error', err); return null; }
    return await res.json() as T;
  } catch (e) { console.error('AI fetch failed', e); return null; }
}

function makeTlEntry(category: TimelineCategory, organisation: string, text: string, actor?: string): TimelineUpdate {
  const now = new Date();
  const date = now.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  const hhmm = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: `${date}, ${hhmm}`, organisation, actor, category, text };
}

import * as seed from '../data/seed';

export interface AiTaskSuggestion {
  organisation: string;
  task: string;
  rationale: string;
  urgency: 'Critical' | 'High' | 'Medium';
}

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
  publishBroadcast: (b: Omit<Broadcast, 'id' | 'timestamp' | 'issuer' | 'icon'> & Partial<Pick<Broadcast, 'issuer' | 'icon'>>) => void;
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
  submitCitizenReport: (report: { type: IncidentType; location: string; zone: string; description: string; estimatedAffected?: number }) => string;
  verifyIncident: (incidentId: string) => void;
  generateBroadcastDraft: (ctx: { incidentType: string; location: string; severity: string; description: string; audience: string }) => Promise<{ title: string; message: string } | null>;
  suggestTaskAssignments: () => Promise<AiTaskSuggestion[] | null>;
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

  const publicAlerts = useMemo(() => {
    const incidentAlerts: Broadcast[] = incidents
      .filter((i) => i.publicVisibility === 'Public')
      .map((i) => ({
        id: `incident-${i.id}`, title: i.title,
        severity: i.severity === 'Critical' ? 'CRITICAL' : 'NOTICE',
        audience: 'all', zone: i.zone, message: i.description,
        issuer: i.createdBy.toUpperCase(), timestamp: i.createdAt,
        icon: i.type === 'Flood' ? 'Waves' : 'ShieldAlert', linkedIncidentId: i.id,
      }));
    const byId = new Map([...broadcasts, ...incidentAlerts].map((b) => [b.id, b]));
    return [...byId.values()];
  }, [broadcasts, incidents]);

  const markAlertRead = (id: string) => setReadAlertIds((p) => new Set([...p, id]));

  const publishBroadcast: DataContextValue['publishBroadcast'] = (b) => {
    const now = new Date();
    const newB: Broadcast = {
      ...b, id: `b${Date.now()}`,
      issuer: b.issuer ?? 'Raj Kumar',
      timestamp: now.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true }),
      icon: b.icon ?? 'Megaphone',
    };
    setBroadcasts((cur) => [newB, ...cur]);
    apiPost('broadcasts', newB);
  };

  const deleteBroadcast = (id: string) => {
    setBroadcasts((cur) => cur.filter((b) => b.id !== id));
    apiDelete(`broadcasts/${id}`);
  };

  const makeIncidentPublic = (id: string) => {
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, publicVisibility: 'Public' } : i));
    apiPost(`incidents/${id}/make-public`);
  };

  const assignIncident = (id: string, orgId: string) => {
    setIncidents((cur) => cur.map((i) => i.id === id && !i.assignedOrganisations.includes(orgId) ? { ...i, assignedOrganisations: [...i.assignedOrganisations, orgId] } : i));
    apiPost(`incidents/${id}/assign`, { organisationId: orgId });
  };

  const updateIncidentStatus = (id: string, status: Incident['status']) => {
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, status, timeline: [...i.timeline, makeTlEntry('STATUS', 'OneTogether', `Status updated to ${status}.`)] } : i));
    apiPatch(`incidents/${id}`, { status });
  };

  const requestVolunteers = (id: string) => {
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, volunteerSupportNeeded: true, timeline: [...i.timeline, makeTlEntry('VOLUNTEER', 'SCDF', 'Volunteer support requested via OneTogether platform.')] } : i));
    apiPatch(`incidents/${id}`, { volunteerSupportNeeded: true });
  };

  const resolveIncident = (id: string) => updateIncidentStatus(id, 'Closed');

  const addTimelineUpdate: DataContextValue['addTimelineUpdate'] = (id, entry) => {
    const tl = makeTlEntry(entry.category, entry.organisation, entry.text, entry.actor);
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, timeline: [...i.timeline, tl] } : i));
    apiPost(`incidents/${id}/timeline`, tl);
  };

  const updateHospital = (id: string, patch: Partial<Hospital>) => {
    setHospitals((cur) => cur.map((h) => h.id === id ? { ...h, ...patch, updatedAt: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true }) } : h));
    apiPatch(`hospitals/${id}`, patch);
  };

  const postVolunteerTask: DataContextValue['postVolunteerTask'] = (task) => {
    const newTask = { ...task, id: `vt${Date.now()}`, slotsFilled: 0, status: 'Open' as const };
    setVolunteerTasks((cur) => [newTask, ...cur]);
    apiPost('volunteer-tasks', newTask);
  };

  const updateThreshold = (id: string, threshold: number) => {
    setThresholds((cur) => cur.map((t) => t.id === id ? { ...t, threshold, status: t.current >= threshold ? 'Critical' : 'Normal' } : t));
    apiPatch(`thresholds/${id}`, { threshold });
  };

  const registerProgramme = (id: string) => {
    setCommunityProgrammes((cur) => cur.map((p) => p.id === id ? { ...p, registered: Math.min(p.capacity, p.registered + 1) } : p));
    apiPost(`community-programmes/${id}/register`);
  };

  const signUpTask = (id: string) => {
    setVolunteerTasks((cur) => cur.map((t) => t.id === id ? { ...t, slotsFilled: Math.min(t.slotsTotal, t.slotsFilled + 1), status: t.slotsFilled + 1 >= t.slotsTotal ? 'Full' : 'Filling' } : t));
    apiPost(`volunteer-tasks/${id}/signup`);
  };

  const updateUnitStatus: DataContextValue['updateUnitStatus'] = (unitId, status, assignedIncidentId) => {
    setUnits((cur) => cur.map((u) => u.id === unitId ? { ...u, status, assignedIncidentId: assignedIncidentId ?? u.assignedIncidentId } : u));
    apiPatch(`units/${unitId}`, { status, assignedIncidentId });
    if (assignedIncidentId) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) {
        const text = status === 'En Route' ? `${unit.callSign} (${unit.type}) dispatched en route.` : status === 'On Scene' ? `${unit.callSign} (${unit.type}) arrived on scene.` : `${unit.callSign} status updated to ${status}.`;
        addTimelineUpdate(assignedIncidentId, { category: 'DEPLOY', organisation: unit.organisation, text });
      }
    }
  };

  const STATUS_ORDER: Incident['status'][] = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'];

  const advanceIncidentStatus: DataContextValue['advanceIncidentStatus'] = (id, logEntry) => {
    setIncidents((cur) => cur.map((i) => {
      if (i.id !== id) return i;
      const next = STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(i.status) + 1, STATUS_ORDER.length - 1)];
      const tl1 = makeTlEntry(logEntry.category, logEntry.organisation, logEntry.text, logEntry.actor);
      const tl2 = makeTlEntry('STATUS', 'OneTogether', `Status advanced to ${next}.`);
      return { ...i, status: next, timeline: [...i.timeline, tl1, tl2] };
    }));
    apiPost(`incidents/${id}/advance-status`, logEntry);
  };

  const addRespondingOrg = (id: string, orgName: string, status: string) => {
    setIncidents((cur) => cur.map((i) => i.id === id && !i.respondingOrganisations.some((r) => r.organisation === orgName) ? { ...i, respondingOrganisations: [...i.respondingOrganisations, { organisation: orgName, status }] } : i));
  };

  const updateRespondingOrgStatus = (id: string, orgName: string, newStatus: string) => {
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, respondingOrganisations: i.respondingOrganisations.map((r) => r.organisation === orgName ? { ...r, status: newStatus } : r) } : i));
  };

  const submitCitizenReport: DataContextValue['submitCitizenReport'] = (report) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const id = `INC-2026-${String(Date.now()).slice(-4)}`;
    const incident: Incident = {
      id, title: `${report.type} Incident — ${report.location.split(',')[0]}`,
      type: report.type, severity: 'Medium', status: 'Reported',
      source: 'citizen_report' as IncidentSource,
      createdBy: 'citizen', createdAt: `${dateStr}, ${timeStr}`,
      location: report.location, zone: report.zone, description: report.description,
      assignedOrganisations: [], respondingOrganisations: [],
      volunteerSupportNeeded: false, publicVisibility: 'Private',
      unitsResponded: 0, volunteersResponded: report.estimatedAffected ?? 0, confidenceScore: 20,
      timeline: [makeTlEntry('INITIAL', 'OneTogether', `Citizen report submitted. ${report.description}${report.estimatedAffected ? ` Est. ${report.estimatedAffected} affected.` : ''} Pending verification.`)],
    };
    setIncidents((cur) => [incident, ...cur]);
    apiPost('incidents', incident);
    return id;
  };

  const verifyIncident = (id: string) => {
    const tl = makeTlEntry('STATUS', 'SCDF', 'Incident verified by duty officer. Status advanced to Verified. Triage and dispatch pending.');
    setIncidents((cur) => cur.map((i) => i.id !== id ? i : { ...i, status: 'Verified', confidenceScore: 75, verifiedAt: new Date().toLocaleString('en-SG'), timeline: [...i.timeline, tl] }));
    apiPatch(`incidents/${id}`, { status: 'Verified', confidenceScore: 75 });
  };

  const generateSitrep: DataContextValue['generateSitrep'] = async (id) => {
    const incident = incidents.find((i) => i.id === id);
    if (!incident) return;
    const pending = makeTlEntry('NOTE', 'OneTogether', 'SITREP generation requested…');
    setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, timeline: [...i.timeline, pending] } : i));

    const result = await aiPost<SITREP>('sitrep', incident);
    if (result) {
      const done = makeTlEntry('NOTE', 'OneTogether', 'AI SITREP generated by Gemini.');
      setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, sitrep: result, timeline: [...i.timeline, done] } : i));
    } else {
      const fallback: SITREP = {
        generatedAt: new Date().toLocaleString('en-SG'),
        situation: `${incident.type} at ${incident.location}. Severity: ${incident.severity}. Status: ${incident.status}. ${incident.description}`,
        currentActions: incident.timeline.slice(-3).map((e) => e.text),
        nextActions: incident.suggestedSteps?.slice(0, 3) ?? ['Continue monitoring.', 'Await further assessment.'],
        resourceStatus: `${incident.unitsResponded} units, ${incident.volunteersResponded} volunteers mobilised.`,
        casualties: incident.type === 'Medical' ? 'Casualty count pending medical assessment.' : undefined,
      };
      const fallbackTl = makeTlEntry('NOTE', 'OneTogether', 'SITREP generated from timeline (AI offline).');
      setIncidents((cur) => cur.map((i) => i.id === id ? { ...i, sitrep: fallback, timeline: [...i.timeline, fallbackTl] } : i));
    }
  };

  const generateBroadcastDraft: DataContextValue['generateBroadcastDraft'] = (ctx) =>
    aiPost<{ title: string; message: string }>('broadcast-draft', ctx);

  const suggestTaskAssignments: DataContextValue['suggestTaskAssignments'] = async () => {
    const result = await aiPost<{ suggestions: AiTaskSuggestion[] }>('suggest-tasks', {
      incidents: incidents.filter((i) => i.status !== 'Closed'),
      organisations: seed.organisations,
    });
    return result?.suggestions ?? null;
  };

  return (
    <DataContext.Provider value={{
      users: seed.users, organisations: seed.organisations, notifications: seed.notifications,
      incidents, broadcasts, volunteerTasks, communityProgrammes, hospitals, thresholds,
      publicAlerts, readAlertIds, units,
      markAlertRead, publishBroadcast, deleteBroadcast, makeIncidentPublic, assignIncident,
      updateIncidentStatus, requestVolunteers, resolveIncident, updateHospital, postVolunteerTask,
      updateThreshold, registerProgramme, signUpTask, addTimelineUpdate, updateUnitStatus,
      generateSitrep, advanceIncidentStatus, addRespondingOrg, updateRespondingOrgStatus,
      submitCitizenReport, verifyIncident, generateBroadcastDraft, suggestTaskAssignments,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
