import { Activity, Building2, Car, CheckCircle2, ChevronRight, FileText, Filter, Flame, Grid2X2, HeartPulse, Layers, List, Maximize2, Navigation, Plus, RefreshCw, Sparkles, Users, Waves, ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { Badge, Button, Card, DataTable, InfoCell, ProgressBar, SectionHeader, StatCard, Tbody, Td, Th, Thead, Tr, UnitCard } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Incident, TimelineCategory } from '../types';

const timelineCategoryConfig: Record<TimelineCategory, { label: string; cls: string }> = {
  INITIAL:   { label: 'Initial Report', cls: 'bg-blue-100 text-blue-800' },
  STATUS:    { label: 'Status Change',  cls: 'bg-purple-100 text-purple-800' },
  DEPLOY:    { label: 'Deployment',     cls: 'bg-orange-100 text-orange-800' },
  BROADCAST: { label: 'Broadcast',      cls: 'bg-amber-100 text-amber-800' },
  ASSESS:    { label: 'Assessment',     cls: 'bg-teal-100 text-teal-800' },
  COORD:     { label: 'Coordination',   cls: 'bg-indigo-100 text-indigo-800' },
  MEDICAL:   { label: 'Medical',        cls: 'bg-red-100 text-red-800' },
  VOLUNTEER: { label: 'Volunteer',      cls: 'bg-green-100 text-green-800' },
  NOTE:      { label: 'Note',           cls: 'bg-sgds-gray-100 text-sgds-gray-700' },
  CLOSE:     { label: 'Resolution',     cls: 'bg-emerald-100 text-emerald-800' },
};

const statusOrder: Incident['status'][] = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'];

export function OrganisationApp() {
  return (
    <SidebarLayout role="organisation">
      <Routes>
        <Route path="/" element={<OrgDashboard />} />
        <Route path="/incidents" element={<OrgIncidents />} />
        <Route path="/map" element={<OrgMap />} />
        <Route path="/resources" element={<OrgResources />} />
        <Route path="/notifications" element={<OrgNotifications />} />
        <Route path="/settings" element={<OrgSettings />} />
        <Route path="*" element={<Navigate to="/organisation" replace />} />
      </Routes>
    </SidebarLayout>
  );
}

function OrgDashboard() {
  const { incidents, broadcasts, notifications, organisations, hospitals } = useData();
  const assigned = incidents.filter((i) => i.assignedOrganisations.includes('scdf') || i.createdBy === 'scdf');
  const resources = organisations.reduce((s, o) => s + o.volunteersAvailable, 0);
  const volunteerTotal = organisations.reduce((s, o) => s + o.volunteersTotal, 0);
  const availableBeds = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const totalBeds = hospitals.reduce((s, h) => s + h.totalBeds, 0);

  return (
    <section>
      <SectionHeader
        title="SCDF Operations Dashboard"
        subtitle="Shared incident tickets from source systems and partner organisations."
        action={<Button variant="outline"><RefreshCw size={14} /> Refresh</Button>}
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <StatCard label="Active assigned" value={assigned.filter((i) => i.status !== 'Closed').length} sub="visible to SCDF" />
        <StatCard label="New source tickets" value={2} sub="from dispatch feeds" tone="orange" />
        <StatCard label="Awaiting assignment" value={incidents.filter((i) => i.assignedOrganisations.length === 1).length} sub="triage queue" />
        <StatCard label="Public alerts created" value={broadcasts.length} sub="last 24 hours" tone="green" />
        <StatCard label="Responders available" value={resources} sub="across partner orgs" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Assigned Incident Tickets</h2>
          <div className="mt-4 space-y-3">{assigned.map((i) => <IncidentRow key={i.id} incident={i} />)}</div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Notifications</h2>
          <div className="mt-4 divide-y divide-sgds-gray-100">
            {notifications.map((item) => (
              <div key={item.id} className="py-3 text-sm">
                <div className="font-semibold text-sgds-gray-900">{item.text}</div>
                <div className="mt-0.5 text-xs text-sgds-gray-500">{item.time}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-sgds-gray-900">Resource Snapshot</h2>
            <p className="mt-1 text-sm text-sgds-gray-500">Operational capacity available to support assigned incidents.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" />Live
          </span>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div>
            <div className="mb-1.5 flex justify-between text-sm text-sgds-gray-700"><span>Hospital beds available</span><strong>{availableBeds}/{totalBeds}</strong></div>
            <ProgressBar value={availableBeds} max={totalBeds} tone="bg-warning" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm text-sgds-gray-700"><span>Volunteer responders</span><strong>{resources}/{volunteerTotal}</strong></div>
            <ProgressBar value={resources} max={volunteerTotal} tone="bg-safe" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <InfoCell label="Ambulances" value="42" />
            <InfoCell label="Flood pumps" value="18" />
            <InfoCell label="Relief kits" value="1,840" />
          </div>
        </div>
      </Card>
    </section>
  );
}

function OrgIncidents() {
  const { incidents, makeIncidentPublic, assignIncident, updateIncidentStatus, requestVolunteers, resolveIncident, addTimelineUpdate, advanceIncidentStatus, generateSitrep } = useData();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = incidents.filter((i) => i.createdBy === 'scdf' || i.assignedOrganisations.includes('scdf'));
  const actions = { assignIncident, updateIncidentStatus, makeIncidentPublic, requestVolunteers, resolveIncident, addTimelineUpdate, advanceIncidentStatus, generateSitrep };

  return (
    <section>
      <SectionHeader
        title="Incident Tickets"
        subtitle="Tickets are synced from source systems. Assignment and response actions are managed here."
        action={
          <div className="flex border border-sgds-gray-200">
            <button onClick={() => setView('list')} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${view === 'list' ? 'bg-navy-950 text-white' : 'text-sgds-gray-600 hover:bg-sgds-gray-50'}`}><List size={15} /> List</button>
            <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${view === 'grid' ? 'bg-navy-950 text-white' : 'text-sgds-gray-600 hover:bg-sgds-gray-50'}`}><Grid2X2 size={15} /> Grid</button>
          </div>
        }
      />
      {view === 'list' ? (
        <div className="mt-6 space-y-4">{visible.map((i) => <IncidentDetailCard key={i.id} incident={i} {...actions} />)}</div>
      ) : (
        <div className="mt-6 grid auto-rows-max gap-4 xl:grid-cols-2">
          {visible.map((i) => expandedId === i.id ? (
            <div key={i.id} className="xl:col-span-2">
              <IncidentDetailCard incident={i} onCollapse={() => setExpandedId(null)} {...actions} />
            </div>
          ) : (
            <IncidentSummaryCard key={i.id} incident={i} onClick={() => setExpandedId(i.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

interface IncidentActions {
  assignIncident: (incidentId: string, organisationId: string) => void;
  updateIncidentStatus: (incidentId: string, status: Incident['status']) => void;
  makeIncidentPublic: (incidentId: string) => void;
  requestVolunteers: (incidentId: string) => void;
  resolveIncident: (incidentId: string) => void;
  addTimelineUpdate: (incidentId: string, entry: { category: TimelineCategory; organisation: string; actor?: string; text: string }) => void;
  advanceIncidentStatus: (incidentId: string, entry: { category: TimelineCategory; organisation: string; actor?: string; text: string }) => void;
  generateSitrep: (incidentId: string) => void;
}

function StatusStepper({ incident, onAdvance }: { incident: Incident; onAdvance: (text: string) => void }) {
  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceText, setAdvanceText] = useState('');
  const currentIdx = statusOrder.indexOf(incident.status);
  const nextStatus = currentIdx < statusOrder.length - 1 ? statusOrder[currentIdx + 1] : null;

  const submit = () => {
    if (!advanceText.trim()) return;
    onAdvance(advanceText);
    setAdvanceText('');
    setShowAdvance(false);
  };

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-sgds-gray-500">
        <span>Operational phase</span>
        <span>{currentIdx + 1}/{statusOrder.length}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {statusOrder.map((s, i) => (
          <div key={s} title={s} className={`h-1.5 flex-1 rounded-sm ${i < currentIdx ? 'bg-sgds-purple' : i === currentIdx ? 'bg-sgds-purple opacity-60' : 'bg-sgds-gray-200'}`} />
        ))}
      </div>
      <div className="mt-1.5 text-xs font-semibold text-sgds-purple">{incident.status}</div>
      {nextStatus && (
        <div className="mt-2">
          {showAdvance ? (
            <div className="border border-sgds-gray-200 bg-sgds-gray-50 p-2">
              <textarea
                className="w-full border border-sgds-gray-300 p-2 text-xs focus:outline focus:outline-2 focus:outline-sgds-purple resize-none"
                rows={2}
                placeholder={`Log entry for → ${nextStatus}`}
                value={advanceText}
                onChange={(e) => setAdvanceText(e.target.value)}
              />
              <div className="mt-1.5 flex gap-1.5">
                <Button variant="outline" className="flex-1 py-1 text-xs" onClick={() => setShowAdvance(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1 py-1 text-xs" disabled={!advanceText.trim()} onClick={submit}>
                  → {nextStatus}
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdvance(true)} className="flex w-full items-center justify-center gap-1 border border-sgds-purple px-3 py-2 text-xs font-semibold text-sgds-purple hover:bg-sgds-purple-light">
              <ChevronRight size={13} /> Advance to {nextStatus}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentDetailCard({ incident, onCollapse, assignIncident, makeIncidentPublic, requestVolunteers, resolveIncident, addTimelineUpdate, advanceIncidentStatus, generateSitrep }: { incident: Incident; onCollapse?: () => void } & IncidentActions) {
  const [showTlForm, setShowTlForm] = useState(false);
  const [tlForm, setTlForm] = useState<{ category: TimelineCategory; actor: string; text: string }>({ category: 'NOTE', actor: '', text: '' });
  const [showSitrep, setShowSitrep] = useState(false);
  const inputCls = 'w-full border border-sgds-gray-300 p-2 text-xs focus:outline focus:outline-2 focus:outline-sgds-purple';
  const canGenerateSitrep = ['On Scene', 'Contained', 'Recovery'].includes(incident.status);

  const submitTlEntry = () => {
    if (!tlForm.text.trim()) return;
    addTimelineUpdate(incident.id, { category: tlForm.category, organisation: 'SCDF', actor: tlForm.actor || undefined, text: tlForm.text });
    setTlForm({ category: 'NOTE', actor: '', text: '' });
    setShowTlForm(false);
  };

  const handleAdvance = (text: string) => {
    advanceIncidentStatus(incident.id, { category: 'STATUS', organisation: 'SCDF', actor: 'Chen Xiao Ling', text });
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-l-4 border-critical bg-sgds-gray-50 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-sgds-gray-500">{incident.id}</span>
          <Badge>{incident.severity}</Badge>
          <Badge>{incident.status}</Badge>
          <Badge>{incident.publicVisibility}</Badge>
          {incident.confidenceScore !== undefined && (
            <span className="border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              CONF {incident.confidenceScore}%
            </span>
          )}
        </div>
        <h2 className="mt-1 text-lg font-bold text-sgds-gray-900">{incident.title}</h2>
        <div className="mt-0.5 text-xs text-sgds-gray-500">{incident.type} · Created by {incident.createdBy.toUpperCase()} · {incident.createdAt}</div>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm leading-6 text-sgds-gray-700">{incident.description}</p>

          {/* ICS Command Structure */}
          {(incident.incidentCommander || incident.icsSection) && (
            <div className="mt-4 border border-navy-100 bg-navy-50 p-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-700">ICS Command Structure</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {incident.incidentCommander && <InfoCell label="Incident Commander" value={incident.incidentCommander} />}
                {incident.icsSection?.operations && <InfoCell label="Operations" value={incident.icsSection.operations} />}
                {incident.icsSection?.planning && <InfoCell label="Planning" value={incident.icsSection.planning} />}
                {incident.icsSection?.logistics && <InfoCell label="Logistics" value={incident.icsSection.logistics} />}
                {incident.icsSection?.pio && <InfoCell label="PIO" value={incident.icsSection.pio} />}
              </div>
            </div>
          )}

          {/* SITREP */}
          {incident.sitrep && showSitrep && (
            <div className="mt-4 border border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-800">SITREP — {incident.sitrep.generatedAt}</h3>
                <button onClick={() => setShowSitrep(false)} className="text-xs text-indigo-500 hover:text-indigo-700">Close</button>
              </div>
              <p className="text-xs text-indigo-900 leading-5">{incident.sitrep.situation}</p>
              {incident.sitrep.casualties && <p className="mt-1 text-xs font-semibold text-red-700">{incident.sitrep.casualties}</p>}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Current Actions</div>
                  <ul className="mt-1 space-y-0.5">{incident.sitrep.currentActions.map((a, i) => <li key={i} className="text-xs text-indigo-800">· {a}</li>)}</ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Next Actions</div>
                  <ul className="mt-1 space-y-0.5">{incident.sitrep.nextActions.map((a, i) => <li key={i} className="text-xs text-indigo-800">· {a}</li>)}</ul>
                </div>
              </div>
              <p className="mt-2 text-xs text-indigo-700">{incident.sitrep.resourceStatus}</p>
            </div>
          )}

          {incident.suggestedSteps && incident.suggestedSteps.length > 0 && (
            <div className="mt-4 rounded border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <h3 className="text-xs font-semibold text-purple-800">AI-suggested coordination steps</h3>
              </div>
              <ul className="space-y-1">
                {incident.suggestedSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-sgds-gray-700">
                    <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-safe" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {incident.resourceInsights && incident.resourceInsights.length > 0 && (
            <div className="mt-3 rounded border border-sgds-gray-200 bg-sgds-gray-50 p-3">
              <h3 className="mb-2 text-xs font-semibold text-sgds-gray-800">Resource availability snapshot (at creation)</h3>
              <div className="flex flex-wrap gap-2">
                {incident.resourceInsights.map((insight, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${insight.recommended ? 'bg-purple-100 text-purple-700' : 'bg-sgds-gray-100 text-sgds-gray-600'}`}>
                    {insight.type}: <strong>{insight.available}/{insight.total}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoCell label="Location" value={incident.location} />
            <InfoCell label="Assigned organisations" value={incident.assignedOrganisations.join(', ').toUpperCase()} />
            <InfoCell label="Units / volunteers" value={`${incident.unitsResponded} units, ${incident.volunteersResponded} volunteers`} />
            <InfoCell label="Volunteer support" value={incident.volunteerSupportNeeded ? 'Needed' : 'Not requested'} />
          </div>
          <h3 className="mt-5 text-sm font-bold text-sgds-gray-900">Responding Organisations</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {incident.respondingOrganisations.map((org) => (
              <div key={org.organisation} className="border border-sgds-gray-200 p-3 text-sm">
                <strong className="text-sgds-gray-900">{org.organisation}</strong>
                <div className="text-sgds-gray-500">{org.status}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-sgds-gray-900">Incident Log</h3>
            <button onClick={() => setShowTlForm((v) => !v)} className="flex items-center gap-1 border border-sgds-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-sgds-gray-700 hover:bg-sgds-gray-50">
              <Plus size={12} /> Log entry
            </button>
          </div>

          {showTlForm && (
            <div className="mt-2 border border-sgds-gray-200 bg-sgds-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold text-sgds-gray-700">New log entry</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-500">Category</label>
                  <select className={inputCls} value={tlForm.category} onChange={(e) => setTlForm((p) => ({ ...p, category: e.target.value as TimelineCategory }))}>
                    {(Object.keys(timelineCategoryConfig) as TimelineCategory[]).map((k) => (
                      <option key={k} value={k}>{timelineCategoryConfig[k].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-500">Officer / Actor</label>
                  <input className={inputCls} placeholder="e.g. Chen Xiao Ling" value={tlForm.actor} onChange={(e) => setTlForm((p) => ({ ...p, actor: e.target.value }))} />
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-sgds-gray-500">Details <span className="text-critical">*</span></label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Describe the update…" value={tlForm.text} onChange={(e) => setTlForm((p) => ({ ...p, text: e.target.value }))} />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" className="py-1 text-xs" onClick={() => setShowTlForm(false)}>Cancel</Button>
                <Button variant="primary" className="py-1 text-xs" disabled={!tlForm.text.trim()} onClick={submitTlEntry}>Submit entry</Button>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-0">
            {incident.timeline.map((item, index) => {
              const cfg = timelineCategoryConfig[item.category];
              return (
                <div key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < incident.timeline.length - 1 && (
                    <div className="absolute left-[9px] top-5 bottom-0 w-px bg-sgds-gray-200" />
                  )}
                  <div className="relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-sgds-purple bg-white" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>{cfg.label}</span>
                      <span className="text-xs font-semibold text-sgds-gray-800">{item.organisation}</span>
                      {item.actor && <span className="text-xs text-sgds-gray-500">· {item.actor}</span>}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-sgds-gray-400">{item.timestamp}</div>
                    <div className="mt-1 text-sm leading-5 text-sgds-gray-700">{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <StatusStepper incident={incident} onAdvance={handleAdvance} />
          <select onChange={(e) => assignIncident(incident.id, e.target.value)} className="w-full border border-sgds-gray-300 p-2.5 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" defaultValue="">
            <option value="" disabled>Assign organisation</option>
            <option value="sgh">Singapore General Hospital</option>
            <option value="redcross">Singapore Red Cross</option>
            <option value="spf">SPF</option>
          </select>
          <Button variant="primary" className="w-full" onClick={() => makeIncidentPublic(incident.id)}>Make public</Button>
          <Button variant="success" className="w-full" onClick={() => requestVolunteers(incident.id)}>Request volunteers</Button>
          {canGenerateSitrep && (
            <Button variant="outline" className="w-full" onClick={() => { generateSitrep(incident.id); setShowSitrep(true); }}>
              <FileText size={14} /> {incident.sitrep ? 'Refresh SITREP' : 'Generate SITREP'}
            </Button>
          )}
          {incident.sitrep && !showSitrep && (
            <button onClick={() => setShowSitrep(true)} className="w-full text-left text-xs font-semibold text-indigo-600 hover:underline">View SITREP →</button>
          )}
          <Button variant="danger" className="w-full" onClick={() => resolveIncident(incident.id)}>Close incident</Button>
          {onCollapse && <Button variant="outline" className="w-full" onClick={onCollapse}>Collapse</Button>}
        </div>
      </div>
    </Card>
  );
}

function IncidentSummaryCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full text-left">
      <Card className="h-full p-5 transition-colors hover:border-sgds-purple">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-sgds-gray-500">{incident.id}</div>
            <h2 className="mt-1 text-base font-bold leading-snug text-sgds-gray-900">{incident.title}</h2>
          </div>
          <Badge>{incident.status}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5"><Badge>{incident.severity}</Badge><Badge>{incident.type}</Badge><Badge>{incident.publicVisibility}</Badge></div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-sgds-gray-600">{incident.description}</p>
        <div className="mt-4 space-y-2">
          <ProgressBar value={statusOrder.indexOf(incident.status) + 1} max={8} tone="bg-sgds-purple" />
          <InfoCell label="Location" value={incident.location} />
        </div>
        <div className="mt-3 text-xs font-semibold text-sgds-purple">Click to expand →</div>
      </Card>
    </button>
  );
}

function OrgMap() {
  const { incidents } = useData();
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 });
  const [dragging, setDragging] = useState(false);
  const [show, setShow] = useState('All');
  const [severity, setSeverity] = useState('All');
  const markers = [
    { x: 19, y: 31, type: 'group', value: '18', color: 'bg-warning text-white', icon: Users },
    { x: 25, y: 34, type: 'medical', color: 'border-critical text-critical bg-white', icon: HeartPulse },
    { x: 42, y: 35, type: 'fire', color: 'border-orange-500 text-orange-500 bg-white', icon: Flame },
    { x: 51, y: 34, type: 'hospital', color: 'border-warning text-warning bg-white', icon: Activity },
    { x: 56, y: 35, type: 'road', color: 'border-critical text-critical bg-white', icon: Car },
    { x: 63, y: 35, type: 'medical', color: 'border-critical text-critical bg-white', icon: HeartPulse },
    { x: 71, y: 34, type: 'infrastructure', color: 'border-orange-500 text-orange-500 bg-white', icon: Building2 },
    { x: 80, y: 33, type: 'fire', color: 'border-critical text-critical bg-white', icon: Flame },
    { x: 55, y: 39, type: 'group', value: '3', color: 'bg-warning text-white', icon: Users },
    { x: 23, y: 45, type: 'group', value: '7', color: 'bg-safe text-white', icon: Users },
    { x: 44, y: 46, type: 'hospital', color: 'border-warning text-warning bg-white', icon: Activity },
    { x: 68, y: 56, type: 'fire', color: 'border-critical text-critical bg-white', icon: Flame },
    { x: 80, y: 55, type: 'medical', color: 'border-critical text-critical bg-white', icon: HeartPulse },
    { x: 38, y: 70, type: 'critical', value: '12', color: 'bg-critical text-white', icon: Users },
    { x: 74, y: 64, type: 'critical', value: '4', color: 'bg-critical text-white', icon: Users },
    { x: 78, y: 30, type: 'group', value: '143', color: 'bg-warning text-white', icon: Users }
  ];
  const startDrag = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, left: mapRef.current.scrollLeft, top: mapRef.current.scrollTop };
    setDragging(true);
  };
  const moveDrag = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !mapRef.current) return;
    mapRef.current.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x);
    mapRef.current.scrollTop = dragRef.current.top - (e.clientY - dragRef.current.y);
  };
  const stopDrag = () => { dragRef.current.active = false; setDragging(false); };

  return (
    <section>
      <SectionHeader title="Incident & Resource Map" subtitle="Incidents · Hospitals · Volunteer Groups"
        action={<><Button variant="primary"><RefreshCw size={14} /> Refresh</Button><Button variant="outline"><Maximize2 size={14} /> Fullscreen</Button></>}
      />
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <Filter size={15} className="text-sgds-gray-500" />
        <span className="font-semibold text-sgds-gray-700">Show:</span>
        {['All', 'Incidents (16)', 'Hospitals (6)', 'Volunteer Groups (6)'].map((item) => (
          <button key={item} onClick={() => setShow(item)} className={`border px-3 py-1.5 text-sm font-semibold ${show === item ? 'border-navy-950 bg-navy-950 text-white' : 'border-sgds-gray-200 bg-white text-sgds-gray-700 hover:bg-sgds-gray-50'}`}>{item}</button>
        ))}
        <span className="ml-2 font-semibold text-sgds-gray-700">Severity:</span>
        {['All', 'Critical', 'High', 'Medium'].map((item) => (
          <button key={item} onClick={() => setSeverity(item)} className={`px-3 py-1.5 text-sm ${severity === item ? 'border border-sgds-purple bg-sgds-purple-light font-semibold text-sgds-purple' : 'text-sgds-gray-500 hover:text-sgds-gray-800'}`}>{item}</button>
        ))}
      </div>
      <div className="relative mt-4 h-[580px] overflow-hidden border border-sgds-gray-300 bg-sgds-gray-100">
        <div ref={mapRef} className={`h-full w-full overflow-auto ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={startDrag} onMouseMove={moveDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
          <div className="relative min-h-[820px] min-w-[1280px] select-none">
            <img src="/singapore-map.png" alt="Singapore map" className="absolute inset-0 h-full w-full object-cover opacity-75" draggable={false} />
            <div className="absolute inset-0 bg-blue-50/25" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
            {markers.map((marker, index) => {
              const Icon = marker.icon;
              const isCluster = Boolean(marker.value);
              return (
                <button key={`${marker.type}-${index}`} className={`absolute grid place-items-center rounded-full shadow-card ${isCluster ? `h-10 w-10 ${marker.color}` : `h-9 w-9 border-2 ${marker.color}`}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} title={marker.type}>
                  <Icon size={isCluster ? 13 : 16} />
                  {marker.value && <span className="text-[10px] font-bold leading-none">{marker.value}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <Card className="absolute left-4 top-4 p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-sgds-gray-500">Active Volunteer Groups</div>
          <div className="mt-1 text-sm font-bold"><span className="text-critical">2 Critical</span> <span className="text-warning">3 Urgent</span> <span className="text-safe">1 Needed</span></div>
          <div className="text-xs text-sgds-gray-500">187 volunteers deployed</div>
        </Card>
        <Card className="absolute bottom-4 left-4 p-3 text-sm">
          <div className="mb-2 flex items-center gap-2 font-bold text-sgds-gray-900"><Layers size={15} /> Legend</div>
          {[['Medical', HeartPulse, 'text-critical'], ['Fire', Flame, 'text-orange-500'], ['Flood', Waves, 'text-blue-500'], ['Road', Car, 'text-warning'], ['Hospital', Activity, 'text-safe']].map(([label, Icon, color]) => (
            <div key={label as string} className="mt-1.5 flex items-center gap-2 text-xs"><span className={color as string}><Icon size={12} /></span><span>{label as string}</span></div>
          ))}
        </Card>
        <div className="absolute right-4 top-4 grid gap-2">
          {[ZoomIn, ZoomOut, Navigation].map((Icon, i) => <button key={i} className="grid h-10 w-10 place-items-center border border-sgds-gray-200 bg-white shadow-card hover:bg-sgds-gray-50"><Icon size={17} /></button>)}
        </div>
        <div className="absolute bottom-4 right-4 border border-sgds-gray-200 bg-white px-3 py-1.5 text-xs text-sgds-gray-500">Zoom 12</div>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="text-base font-bold text-sgds-gray-900">Area incidents</h2>
        <div className="mt-4 space-y-2">{incidents.map((i) => <IncidentRow key={i.id} incident={i} />)}</div>
      </Card>
    </section>
  );
}

function OrgResources() {
  const { hospitals, organisations, units, updateUnitStatus, incidents } = useData();
  const [tab, setTab] = useState<'units' | 'hospitals' | 'orgs'>('units');
  const scdfUnits = units.filter((u) => u.organisation === 'SCDF');

  const handleDispatch = (unitId: string) => {
    const inc = incidents.find((i) => i.status === 'Dispatched' || i.status === 'On Scene');
    if (inc) updateUnitStatus(unitId, 'En Route', inc.id);
    else updateUnitStatus(unitId, 'Assigned');
  };

  const handleReturn = (unitId: string) => {
    updateUnitStatus(unitId, 'Available', undefined);
  };

  return (
    <section>
      <SectionHeader title="SCDF Resources" subtitle="Unit status, hospital capacities, and partner organisations." />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <StatCard label="SCDF Units Available" value={scdfUnits.filter((u) => u.status === 'Available').length} sub={`of ${scdfUnits.length} total`} tone="green" />
        <StatCard label="Units Deployed" value={scdfUnits.filter((u) => u.status !== 'Available' && u.status !== 'Offline').length} sub="en route / on scene" tone="orange" />
        <StatCard label="Hospital Beds Available" value={hospitals.reduce((s, h) => s + h.availableBeds, 0)} sub={`of ${hospitals.reduce((s, h) => s + h.totalBeds, 0)} total`} />
      </div>
      <div className="mt-5 flex border-b border-sgds-gray-200">
        {[['units', 'Unit Status Board'], ['hospitals', 'Hospitals'], ['orgs', 'Organisations']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)} className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === id ? 'border-sgds-purple text-sgds-purple' : 'border-transparent text-sgds-gray-600 hover:text-sgds-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'units' && (
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {(['Available', 'Assigned', 'En Route', 'On Scene', 'Engaged', 'Offline'] as const).map((s) => {
              const count = scdfUnits.filter((u) => u.status === s).length;
              return <span key={s} className="border border-sgds-gray-200 px-3 py-1.5 text-xs font-semibold text-sgds-gray-700"><span className="mr-1.5 font-bold text-sgds-gray-900">{count}</span>{s}</span>;
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {scdfUnits.map((unit) => (
              <UnitCard key={unit.id} unit={unit} onDispatch={() => handleDispatch(unit.id)} onReturn={() => handleReturn(unit.id)} />
            ))}
          </div>
        </div>
      )}

      {tab === 'hospitals' && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {hospitals.map((h) => (
            <Card key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-sm font-bold text-sgds-gray-900">{h.name}</div><div className="text-xs text-sgds-gray-500">{h.address}</div></div>
                <Badge>{h.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-sgds-gray-50 p-2 text-center"><div className="text-lg font-bold text-sgds-gray-900">{h.availableBeds}</div><div className="text-[10px] text-sgds-gray-500">Avail beds</div></div>
                <div className="bg-sgds-gray-50 p-2 text-center"><div className="text-lg font-bold text-sgds-gray-900">{h.icuAvailable}</div><div className="text-[10px] text-sgds-gray-500">ICU</div></div>
                <div className="bg-sgds-gray-50 p-2 text-center"><div className="text-lg font-bold text-sgds-gray-900">{h.traumaBays}</div><div className="text-[10px] text-sgds-gray-500">Trauma</div></div>
              </div>
              <div className="mt-3">
                <ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" />
                <div className="mt-1 text-right text-xs text-sgds-gray-500">{Math.round((h.availableBeds / h.totalBeds) * 100)}% available</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'orgs' && (
        <Card className="mt-5">
          <DataTable>
            <Thead><tr><Th>Organisation</Th><Th>Type</Th><Th>Volunteers</Th><Th>Active tasks</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {organisations.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-semibold">{o.name}</Td>
                  <Td><Badge>{o.type}</Badge></Td>
                  <Td>{o.volunteersAvailable}/{o.volunteersTotal}</Td>
                  <Td>{o.activeTasks}</Td>
                  <Td><Badge>{o.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </DataTable>
        </Card>
      )}
    </section>
  );
}

function OrgNotifications() {
  const { notifications } = useData();
  return (
    <section>
      <SectionHeader title="Notifications" />
      <div className="mt-6 space-y-3">
        {notifications.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="font-semibold text-sgds-gray-900">{item.text}</div>
            <div className="mt-1 text-xs text-sgds-gray-500">{item.time}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function OrgSettings() {
  return (
    <section>
      <SectionHeader title="Settings" />
      <Card className="mt-6 p-5">
        <h2 className="text-base font-bold text-sgds-gray-900">Auto-publication rules</h2>
        <p className="mt-1 text-sm text-sgds-gray-500">Select incident types that are automatically made public when created.</p>
        <div className="mt-4 space-y-2">
          {['Cardiac Arrest', 'Flood', 'Major Fire', 'Minor Injury'].map((item, index) => (
            <label key={item} className="flex items-center justify-between border border-sgds-gray-200 p-3 hover:bg-sgds-gray-50">
              <span className="text-sm text-sgds-gray-800">{item}</span>
              <input type="checkbox" defaultChecked={index < 3} className="h-4 w-4 accent-sgds-purple" />
            </label>
          ))}
        </div>
      </Card>
    </section>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  return (
    <div className="border border-sgds-gray-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-sgds-gray-900">{incident.title}</strong>
        <Badge>{incident.status}</Badge>
      </div>
      <div className="mt-1 text-xs text-sgds-gray-500">{incident.location} · {incident.type} · {incident.severity}</div>
    </div>
  );
}
