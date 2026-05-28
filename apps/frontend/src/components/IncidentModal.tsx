import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  Sparkles,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TimelineCategory } from '../types';
import { useData } from '../state/DataContext';
import { Badge, Button, InfoCell, ProgressBar } from './ui';

const STATUS_ORDER = [
  'Reported', 'Unverified', 'Verified', 'Dispatched',
  'On Scene', 'Contained', 'Recovery', 'Closed',
] as const;

const CATEGORY_CONFIG: Record<TimelineCategory, { label: string; cls: string }> = {
  INITIAL:   { label: 'Initial Report', cls: 'bg-blue-100 text-blue-800' },
  STATUS:    { label: 'Status Change',  cls: 'bg-purple-100 text-purple-800' },
  DEPLOY:    { label: 'Deployment',     cls: 'bg-orange-100 text-orange-800' },
  BROADCAST: { label: 'Broadcast',      cls: 'bg-amber-100 text-amber-800' },
  ASSESS:    { label: 'Assessment',     cls: 'bg-teal-100 text-teal-800' },
  COORD:     { label: 'Coordination',   cls: 'bg-indigo-100 text-indigo-800' },
  MEDICAL:   { label: 'Medical',        cls: 'bg-red-100 text-red-800' },
  VOLUNTEER: { label: 'Volunteer',      cls: 'bg-green-100 text-green-800' },
  NOTE:      { label: 'Note',           cls: 'bg-gray-100 text-gray-700' },
  CLOSE:     { label: 'Resolution',     cls: 'bg-emerald-100 text-emerald-800' },
};

const STAGE_SUGGESTIONS: Record<string, string[]> = {
  Reported:   ['Verify via secondary source (CCTV, dispatch feed, on-site call)', 'Assign Incident Commander before deploying units', 'Confirm exact coordinates and primary access route', 'Cross-check NEA / PUB / SMRT sensor feeds for corroboration'],
  Unverified: ['Contact source org directly to confirm report accuracy', 'Deploy single assessment unit to establish ground truth', 'Check for duplicate incidents within 500 m radius', 'Escalate to Verified or close within 15 min — unverified incidents waste resources'],
  Verified:   ['Issue dispatch orders to assigned organisations now', 'Pre-position hospital trauma bays if casualties expected', 'Activate ICS command structure for Critical incidents', 'Prepare public advisory draft for rapid release'],
  Dispatched: ['Confirm ETA for all dispatched units via dispatch system', 'Pre-position secondary units if primary ETA > 10 min', 'Notify receiving hospital of incoming patients', 'Allocate on-scene communications channel'],
  'On Scene': ['Request SITREP from Incident Commander every 15 min', 'Update public advisory if situation has evolved', 'Confirm casualty count and triage category breakdown', 'Monitor cascade risk — pre-position adjacent units'],
  Contained:  ['Begin phased stand-down of non-essential units', 'Draft after-action SITREP for coordinating agencies', 'Issue public update — incident contained, recovery underway', 'Initiate volunteer demobilisation if deployed'],
  Recovery:   ['Release first responders — retain one unit for scene safety', 'Coordinate displaced resident welfare with community orgs', 'Document all timeline entries for post-incident review', 'Close public advisory once scene is fully safe'],
  Closed:     [],
};

const TYPE_EXTRA: Record<string, string[]> = {
  Medical:        ['Confirm hospital bed allocation and patient tracking', 'Update casualty register with receiving hospital'],
  Flood:          ['Monitor water level readings every 30 min', 'Coordinate with PUB on drainage pump activation status'],
  Fire:           ['Conduct structural assessment before allowing re-entry', 'Verify gas and electrical isolation before demobilisation'],
  Infrastructure: ['Require specialist engineer sign-off before re-opening area', 'Notify utility providers of estimated impact duration'],
  Civil:          ['Maintain SPF presence until crowd fully dispersed', 'Document all use-of-force incidents for review'],
};

function aiSuggestions(type: string, severity: string, status: string): string[] {
  const base = STAGE_SUGGESTIONS[status] ?? [];
  const extra = TYPE_EXTRA[type];
  return extra && severity === 'Critical' ? [...base, ...extra.slice(0, 2)] : base;
}

const RECOMMENDED_ORGS: Record<string, { id: string; name: string; role: string }[]> = {
  Medical:        [{ id: 'sgh', name: 'Singapore General Hospital', role: 'Trauma & medical care' }, { id: 'stjohn', name: 'St John Ambulance', role: 'First-aid support' }, { id: 'hsa', name: 'Health Sciences Authority', role: 'Blood supply & lab support' }],
  Fire:           [{ id: 'scdf', name: 'SCDF', role: 'Fire suppression & rescue' }, { id: 'spf', name: 'Singapore Police Force', role: 'Perimeter & traffic' }, { id: 'redcross', name: 'Singapore Red Cross', role: 'Displaced resident support' }],
  Flood:          [{ id: 'scdf', name: 'SCDF', role: 'Pumping & water rescue' }, { id: 'pa-jurong', name: "People's Association", role: 'Community outreach' }, { id: 'redcross', name: 'Singapore Red Cross', role: 'Relief operations' }, { id: 'spf', name: 'Singapore Police Force', role: 'Traffic & perimeter' }],
  Road:           [{ id: 'scdf', name: 'SCDF', role: 'Rescue & medical' }, { id: 'spf', name: 'Singapore Police Force', role: 'Traffic management' }, { id: 'sgh', name: 'Singapore General Hospital', role: 'Receiving casualties' }],
  Infrastructure: [{ id: 'scdf', name: 'SCDF', role: 'Scene safety & rescue' }, { id: 'spf', name: 'Singapore Police Force', role: 'Exclusion zone' }, { id: 'sgh', name: 'Singapore General Hospital', role: 'Casualty reception' }, { id: 'redcross', name: 'Singapore Red Cross', role: 'Resident welfare' }],
  Civil:          [{ id: 'spf', name: 'Singapore Police Force', role: 'Crowd control' }, { id: 'scdf', name: 'SCDF', role: 'Medical standby' }, { id: 'pa-jurong', name: "People's Association", role: 'Community liaison' }],
  Other:          [{ id: 'scdf', name: 'SCDF', role: 'Primary response' }, { id: 'spf', name: 'Singapore Police Force', role: 'Security' }],
};

export function IncidentModal({ incidentId, onClose }: { incidentId: string; onClose: () => void }) {
  const {
    incidents, units, broadcasts, organisations,
    addTimelineUpdate, advanceIncidentStatus, generateSitrep,
    makeIncidentPublic, requestVolunteers, resolveIncident,
    assignIncident, updateUnitStatus, addRespondingOrg,
    updateRespondingOrgStatus, publishBroadcast,
  } = useData();

  const [tab, setTab] = useState<'overview' | 'timeline' | 'coordination' | 'sitrep'>('overview');
  const [tlForm, setTlForm] = useState<{ category: TimelineCategory; actor: string; text: string }>({ category: 'NOTE', actor: '', text: '' });
  const [showTlForm, setShowTlForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiList, setAiList] = useState<string[] | null>(null);
  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceText, setAdvanceText] = useState('');
  const [orgStatusEdit, setOrgStatusEdit] = useState<string | null>(null);
  const [orgStatusValue, setOrgStatusValue] = useState('');
  const [addOrgId, setAddOrgId] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) return null;

  const assignedUnits = units.filter((u) => u.assignedIncidentId === incident.id);
  const availableUnits = units.filter((u) => u.status === 'Available');
  const linkedBroadcasts = broadcasts.filter((b) => b.linkedIncidentId === incident.id);
  const currentIdx = STATUS_ORDER.indexOf(incident.status as typeof STATUS_ORDER[number]);
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;
  const canSitrep = ['On Scene', 'Contained', 'Recovery'].includes(incident.status);
  const recommendedOrgs = (RECOMMENDED_ORGS[incident.type] ?? RECOMMENDED_ORGS.Other)
    .filter((ro) => !incident.assignedOrganisations.includes(ro.id));
  const unassignedOrgs = organisations.filter((o) => !incident.assignedOrganisations.includes(o.id));

  const inputCls = 'w-full border border-sgds-gray-300 p-2 text-xs focus:outline focus:outline-2 focus:outline-sgds-purple';

  const submitTl = () => {
    if (!tlForm.text.trim()) return;
    addTimelineUpdate(incident.id, { ...tlForm, organisation: 'SCDF', actor: tlForm.actor || undefined });
    setTlForm({ category: 'NOTE', actor: '', text: '' });
    setShowTlForm(false);
  };

  const handleAdvance = () => {
    if (!advanceText.trim()) return;
    advanceIncidentStatus(incident.id, { category: 'STATUS', organisation: 'SCDF', actor: 'Chen Xiao Ling', text: advanceText });
    setAdvanceText('');
    setShowAdvance(false);
  };

  const handleAddOrg = () => {
    if (!addOrgId) return;
    const org = organisations.find((o) => o.id === addOrgId);
    if (!org) return;
    assignIncident(incident.id, addOrgId);
    addRespondingOrg(incident.id, org.name, 'Assigned');
    addTimelineUpdate(incident.id, { category: 'COORD', organisation: 'SCDF', actor: 'Chen Xiao Ling', text: `${org.name} assigned to incident.` });
    setAddOrgId('');
  };

  const handleUpdateOrgStatus = (orgName: string) => {
    if (!orgStatusValue.trim()) return;
    updateRespondingOrgStatus(incident.id, orgName, orgStatusValue);
    addTimelineUpdate(incident.id, { category: 'COORD', organisation: orgName, text: `Status updated: ${orgStatusValue}` });
    setOrgStatusEdit(null);
    setOrgStatusValue('');
  };

  const handleAssignRecommended = (ro: { id: string; name: string }) => {
    assignIncident(incident.id, ro.id);
    addRespondingOrg(incident.id, ro.name, 'Assigned');
    addTimelineUpdate(incident.id, { category: 'COORD', organisation: 'SCDF', actor: 'Chen Xiao Ling', text: `${ro.name} assigned (AI recommendation).` });
  };

  const handleDispatch = (unitId: string) => updateUnitStatus(unitId, 'En Route', incident.id);
  const handleReturn = (unitId: string) => updateUnitStatus(unitId, 'Available', undefined);

  const handleBroadcast = () => {
    publishBroadcast({
      title: `Update: ${incident.title}`,
      message: `Incident ${incident.id} — ${incident.location}. Status: ${incident.status}. ${incident.description.split('.')[0]}.`,
      audience: incident.publicVisibility === 'Public' ? 'all' : 'responders',
      severity: incident.severity === 'Critical' ? 'CRITICAL' : 'NOTICE',
      linkedIncidentId: incident.id,
    });
  };

  const handleGenerateAI = () => {
    setAiLoading(true);
    setTimeout(() => { setAiList(aiSuggestions(incident.type, incident.severity, incident.status)); setAiLoading(false); }, 600);
  };

  const severityBorder: Record<string, string> = { Critical: 'border-l-critical', High: 'border-l-warning', Medium: 'border-l-yellow-400', Low: 'border-l-safe' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-sgds-gray-50" role="dialog" aria-modal="true" aria-label={incident.title}>
      {/* ── Header ── */}
      <div className={`flex shrink-0 items-center gap-3 border-b-4 ${severityBorder[incident.severity] ?? 'border-l-sgds-gray-300'} border-b border-sgds-gray-200 bg-white px-6 py-3`}>
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-sgds-gray-400">{incident.id}</span>
        <div className="h-4 w-px bg-sgds-gray-200" />
        <h1 className="flex-1 truncate text-base font-bold text-sgds-gray-900">{incident.title}</h1>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Badge>{incident.severity}</Badge>
          <Badge>{incident.status}</Badge>
          <Badge>{incident.type}</Badge>
          <Badge>{incident.publicVisibility}</Badge>
          {incident.confidenceScore !== undefined && (
            <span className="border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              CONF {incident.confidenceScore}%
            </span>
          )}
        </div>
        <button onClick={onClose} className="ml-2 grid h-8 w-8 shrink-0 place-items-center text-sgds-gray-400 hover:bg-sgds-gray-100 hover:text-sgds-gray-700" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Main panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-sgds-gray-200 bg-white px-6">
            {([
              ['overview',     'Overview'],
              ['timeline',     `Timeline (${incident.timeline.length})`],
              ['coordination', `Coordination (${incident.respondingOrganisations.length} orgs · ${assignedUnits.length} units)`],
              ['sitrep',       'SITREP'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === id ? 'border-sgds-purple text-sgds-purple' : 'border-transparent text-sgds-gray-500 hover:text-sgds-gray-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Description</div>
                  <p className="text-sm leading-6 text-sgds-gray-700">{incident.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoCell label="Location" value={incident.location} />
                  <InfoCell label="Zone" value={incident.zone} />
                  <InfoCell label="Created" value={incident.createdAt} />
                  <InfoCell label="Reported by" value={incident.createdBy.toUpperCase()} />
                  <InfoCell label="Units responded" value={String(incident.unitsResponded)} />
                  <InfoCell label="Volunteers" value={String(incident.volunteersResponded)} />
                </div>

                {(incident.incidentCommander || incident.icsSection) && (
                  <div className="border border-navy-100 bg-navy-50 p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-navy-700">ICS Command Structure</div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {incident.incidentCommander && <InfoCell label="Incident Commander" value={incident.incidentCommander} />}
                      {incident.icsSection?.operations && <InfoCell label="Operations" value={incident.icsSection.operations} />}
                      {incident.icsSection?.planning && <InfoCell label="Planning" value={incident.icsSection.planning} />}
                      {incident.icsSection?.logistics && <InfoCell label="Logistics" value={incident.icsSection.logistics} />}
                      {incident.icsSection?.pio && <InfoCell label="PIO / Media" value={incident.icsSection.pio} />}
                    </div>
                  </div>
                )}

                {linkedBroadcasts.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Linked Broadcasts ({linkedBroadcasts.length})</div>
                    <div className="space-y-2">
                      {linkedBroadcasts.map((b) => (
                        <div key={b.id} className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-3">
                          <Megaphone size={14} className="mt-0.5 shrink-0 text-amber-600" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-amber-900">{b.title}<Badge>{b.severity}</Badge><Badge>{b.audience}</Badge></div>
                            <p className="mt-0.5 text-xs text-amber-800">{b.message}</p>
                            <div className="mt-0.5 text-[10px] text-amber-600">{b.issuer} · {b.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {incident.suggestedSteps && incident.suggestedSteps.length > 0 && (
                  <div className="border border-purple-200 bg-purple-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles size={13} className="text-purple-600" />
                      <span className="text-xs font-bold text-purple-800">AI coordination steps (set at creation)</span>
                    </div>
                    <ul className="space-y-1.5">
                      {incident.suggestedSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-sgds-gray-700">
                          <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-safe" />{step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {incident.resourceInsights && incident.resourceInsights.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Resource snapshot at creation</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {incident.resourceInsights.map((r, i) => (
                        <div key={i} className={`border p-3 ${r.recommended ? 'border-purple-200 bg-purple-50' : 'border-sgds-gray-200 bg-white'}`}>
                          <div className={`text-xs font-semibold ${r.recommended ? 'text-purple-800' : 'text-sgds-gray-700'}`}>{r.type}</div>
                          <div className={`mt-1 text-2xl font-bold ${r.recommended ? 'text-purple-700' : 'text-sgds-gray-800'}`}>
                            {r.available}<span className="text-sm font-normal text-sgds-gray-500">/{r.total}</span>
                          </div>
                          <ProgressBar value={r.available} max={r.total} tone={r.recommended ? 'bg-purple-500' : 'bg-sgds-gray-400'} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TIMELINE ── */}
            {tab === 'timeline' && (
              <div className="max-w-2xl">
                <div className="mb-4">
                  {showTlForm ? (
                    <div className="border border-sgds-gray-200 bg-white p-4">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sgds-gray-500">New Log Entry</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-400">Category</label>
                          <select className={inputCls} value={tlForm.category} onChange={(e) => setTlForm((p) => ({ ...p, category: e.target.value as TimelineCategory }))}>
                            {(Object.keys(CATEGORY_CONFIG) as TimelineCategory[]).map((k) => (
                              <option key={k} value={k}>{CATEGORY_CONFIG[k].label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-400">Officer / Actor</label>
                          <input className={inputCls} placeholder="e.g. Chen Xiao Ling" value={tlForm.actor} onChange={(e) => setTlForm((p) => ({ ...p, actor: e.target.value }))} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-400">Details *</label>
                        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe the update…" value={tlForm.text} onChange={(e) => setTlForm((p) => ({ ...p, text: e.target.value }))} />
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="outline" className="py-1 text-xs" onClick={() => setShowTlForm(false)}>Cancel</Button>
                        <Button variant="primary" className="py-1 text-xs" disabled={!tlForm.text.trim()} onClick={submitTl}>Submit entry</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setShowTlForm(true)}><Plus size={13} /> Add log entry</Button>
                  )}
                </div>

                <div className="space-y-0">
                  {[...incident.timeline].reverse().map((item, index, arr) => {
                    const cfg = CATEGORY_CONFIG[item.category];
                    return (
                      <div key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < arr.length - 1 && <div className="absolute bottom-0 left-[9px] top-5 w-px bg-sgds-gray-200" />}
                        <div className="relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-sgds-purple bg-white" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>{cfg.label}</span>
                            <span className="text-xs font-semibold text-sgds-gray-800">{item.organisation}</span>
                            {item.actor && <span className="text-xs text-sgds-gray-500">· {item.actor}</span>}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-sgds-gray-400">{item.timestamp}</div>
                          <p className="mt-1 text-sm leading-5 text-sgds-gray-700">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── COORDINATION ── */}
            {tab === 'coordination' && (
              <div className="max-w-3xl space-y-8">
                {/* Responding orgs */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-sgds-gray-900">Responding Organisations</h2>
                    <span className="text-xs text-sgds-gray-500">{incident.respondingOrganisations.length} active</span>
                  </div>

                  {incident.respondingOrganisations.length === 0 ? (
                    <div className="border border-dashed border-sgds-gray-300 p-6 text-center text-xs text-sgds-gray-400">No organisations responding yet — assign one below</div>
                  ) : (
                    <div className="space-y-2">
                      {incident.respondingOrganisations.map((ro) => (
                        <div key={ro.organisation} className="flex items-center gap-3 border border-sgds-gray-200 bg-white p-3">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-safe" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-sgds-gray-900">{ro.organisation}</div>
                            {orgStatusEdit === ro.organisation ? (
                              <div className="mt-1.5 flex items-center gap-2">
                                <input
                                  className="flex-1 border border-sgds-gray-300 p-1.5 text-xs focus:outline focus:outline-2 focus:outline-sgds-purple"
                                  value={orgStatusValue}
                                  onChange={(e) => setOrgStatusValue(e.target.value)}
                                  placeholder="New status…"
                                  autoFocus
                                />
                                <Button variant="primary" className="shrink-0 py-1 text-xs" onClick={() => handleUpdateOrgStatus(ro.organisation)}>Save</Button>
                                <Button variant="outline" className="shrink-0 py-1 text-xs" onClick={() => setOrgStatusEdit(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-sgds-gray-500">{ro.status}</span>
                                <button
                                  onClick={() => { setOrgStatusEdit(ro.organisation); setOrgStatusValue(ro.status); }}
                                  className="text-[10px] font-semibold text-sgds-purple hover:underline"
                                >
                                  Update status
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <select
                      className="flex-1 border border-sgds-gray-300 p-2 text-xs focus:outline focus:outline-2 focus:outline-sgds-purple"
                      value={addOrgId}
                      onChange={(e) => setAddOrgId(e.target.value)}
                    >
                      <option value="">— Add organisation to response —</option>
                      {unassignedOrgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name} · {o.volunteersAvailable} available</option>
                      ))}
                    </select>
                    <Button variant="primary" className="shrink-0 py-2 text-xs" onClick={handleAddOrg} disabled={!addOrgId}>
                      <Plus size={12} /> Assign
                    </Button>
                  </div>
                </div>

                {/* AI-recommended orgs */}
                {recommendedOrgs.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={13} className="text-purple-600" />
                      <span className="text-xs font-bold uppercase tracking-wide text-purple-800">AI-recommended for {incident.type} incidents</span>
                    </div>
                    <div className="space-y-2">
                      {recommendedOrgs.map((ro) => (
                        <div key={ro.id} className="flex items-center justify-between border border-purple-100 bg-purple-50 p-3">
                          <div>
                            <div className="text-sm font-semibold text-purple-900">{ro.name}</div>
                            <div className="text-xs text-purple-600">{ro.role}</div>
                          </div>
                          <Button variant="outline" className="py-1 text-xs" onClick={() => handleAssignRecommended(ro)}>
                            <Plus size={11} /> Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Units on this incident */}
                <div>
                  <h2 className="mb-3 text-sm font-bold text-sgds-gray-900">Units Assigned to This Incident</h2>

                  {assignedUnits.length === 0 ? (
                    <div className="border border-dashed border-sgds-gray-300 p-6 text-center text-xs text-sgds-gray-400">No units assigned — dispatch from available units below</div>
                  ) : (
                    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {assignedUnits.map((unit) => (
                        <div key={unit.id} className="flex items-center gap-2 border border-sgds-gray-200 bg-white p-3">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${unit.status === 'On Scene' || unit.status === 'Engaged' ? 'bg-orange-500' : unit.status === 'En Route' ? 'bg-blue-500' : 'bg-sgds-gray-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-sgds-gray-900">{unit.callSign}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-sgds-gray-500">
                              {unit.type} · <Badge>{unit.status}</Badge>
                            </div>
                          </div>
                          <button onClick={() => handleReturn(unit.id)} className="shrink-0 text-[10px] font-semibold text-sgds-gray-400 hover:text-critical">Return</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableUnits.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sgds-gray-400">Available units — click to dispatch en route</div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {availableUnits.slice(0, 12).map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => handleDispatch(unit.id)}
                            className="flex items-center gap-2 border border-sgds-gray-200 bg-white p-3 text-left transition-colors hover:border-sgds-purple hover:bg-sgds-purple-light"
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-sgds-gray-900">{unit.callSign}</div>
                              <div className="text-[10px] text-sgds-gray-500">{unit.type} · {unit.organisation}</div>
                            </div>
                            <Zap size={11} className="shrink-0 text-sgds-purple" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SITREP ── */}
            {tab === 'sitrep' && (
              <div className="max-w-2xl">
                {canSitrep && (
                  <div className="mb-4 flex items-center gap-3">
                    <Button variant="primary" onClick={() => { generateSitrep(incident.id); }}>
                      <FileText size={14} /> {incident.sitrep ? 'Refresh SITREP' : 'Generate SITREP'}
                    </Button>
                    {incident.sitrep && <span className="text-xs text-sgds-gray-500">Last generated: {incident.sitrep.generatedAt}</span>}
                  </div>
                )}

                {incident.sitrep ? (
                  <div className="border border-indigo-200 bg-indigo-50 p-5">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">Situation Report — {incident.sitrep.generatedAt}</div>
                    <p className="text-sm leading-6 text-indigo-900">{incident.sitrep.situation}</p>
                    {incident.sitrep.casualties && (
                      <div className="mt-3 border border-red-200 bg-red-50 p-3">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-red-700">Casualties</div>
                        <p className="text-sm text-red-800">{incident.sitrep.casualties}</p>
                      </div>
                    )}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600">Current Actions</div>
                        <ul className="space-y-1.5">
                          {incident.sitrep.currentActions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-indigo-800">
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600">Next Actions</div>
                        <ul className="space-y-1.5">
                          {incident.sitrep.nextActions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-indigo-800">
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-indigo-700">{incident.sitrep.resourceStatus}</p>
                  </div>
                ) : (
                  <div className="border border-dashed border-sgds-gray-300 p-10 text-center text-sm text-sgds-gray-400">
                    {canSitrep
                      ? 'Click "Generate SITREP" to create a situation report from the incident timeline.'
                      : 'SITREP becomes available once the incident reaches On Scene status.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-sgds-gray-200 bg-white">
          <div className="divide-y divide-sgds-gray-100">

            {/* Status stepper */}
            <div className="p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Operational Status</div>
              <div className="mb-2 flex items-center gap-0.5">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} title={s} className={`h-1.5 flex-1 rounded-sm ${i < currentIdx ? 'bg-sgds-purple' : i === currentIdx ? 'bg-sgds-purple opacity-50' : 'bg-sgds-gray-200'}`} />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sgds-purple">{incident.status}</span>
                <span className="text-sgds-gray-400">{currentIdx + 1}/{STATUS_ORDER.length}</span>
              </div>
              {nextStatus && (
                showAdvance ? (
                  <div className="mt-3">
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={2}
                      placeholder={`Log entry for → ${nextStatus}`}
                      value={advanceText}
                      onChange={(e) => setAdvanceText(e.target.value)}
                    />
                    <div className="mt-1.5 flex gap-1.5">
                      <Button variant="outline" className="flex-1 py-1 text-xs" onClick={() => setShowAdvance(false)}>Cancel</Button>
                      <Button variant="primary" className="flex-1 py-1 text-xs" disabled={!advanceText.trim()} onClick={handleAdvance}>
                        → {nextStatus}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdvance(true)}
                    className="mt-3 flex w-full items-center justify-center gap-1 border border-sgds-purple px-3 py-2 text-xs font-semibold text-sgds-purple hover:bg-sgds-purple-light"
                  >
                    <ChevronRight size={12} /> Advance to {nextStatus}
                  </button>
                )
              )}
            </div>

            {/* AI assistant */}
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={13} className="text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wide text-purple-800">AI Situation Assistant</span>
              </div>
              <Button variant="outline" className="w-full py-2 text-xs" onClick={handleGenerateAI} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {aiLoading ? 'Analysing…' : `Suggest next steps (${incident.status})`}
              </Button>
              {aiList && (
                <div className="mt-3">
                  <ul className="space-y-2">
                    {aiList.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-sgds-gray-700">
                        <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-purple-500" />{s}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setAiList(null)} className="mt-2 text-[10px] text-sgds-gray-400 hover:text-sgds-gray-600">Dismiss</button>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Quick Actions</div>
              <div className="space-y-2">
                {incident.publicVisibility === 'Private' && (
                  <Button variant="outline" className="w-full py-2 text-xs" onClick={() => makeIncidentPublic(incident.id)}>
                    <Users size={12} /> Make Public
                  </Button>
                )}
                {incident.volunteerSupportNeeded ? (
                  <div className="flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-safe">
                    <CheckCircle2 size={12} /> Volunteer support requested
                  </div>
                ) : (
                  <Button variant="success" className="w-full py-2 text-xs" onClick={() => requestVolunteers(incident.id)}>
                    <Users size={12} /> Request Volunteers
                  </Button>
                )}
                <Button variant="outline" className="w-full py-2 text-xs" onClick={handleBroadcast}>
                  <Megaphone size={12} /> Issue Broadcast Update
                </Button>
                {canSitrep && (
                  <Button variant="outline" className="w-full py-2 text-xs" onClick={() => { generateSitrep(incident.id); setTab('sitrep'); }}>
                    <FileText size={12} /> {incident.sitrep ? 'Refresh SITREP' : 'Generate SITREP'}
                  </Button>
                )}
                {incident.status !== 'Closed' && (
                  <Button variant="danger" className="w-full py-2 text-xs" onClick={() => { resolveIncident(incident.id); onClose(); }}>
                    Close Incident
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sgds-gray-400">Incident Metadata</div>
              <dl className="space-y-2">
                {[
                  ['ID',          incident.id],
                  ['Type',        incident.type],
                  ['Zone',        incident.zone],
                  ['Verified at', incident.verifiedAt ?? '—'],
                  ['Confidence',  incident.confidenceScore !== undefined ? `${incident.confidenceScore}%` : '—'],
                  ['Commander',   incident.incidentCommander ?? '—'],
                ] .map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <dt className="text-sgds-gray-500">{label}</dt>
                    <dd className="font-semibold text-sgds-gray-800 text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
