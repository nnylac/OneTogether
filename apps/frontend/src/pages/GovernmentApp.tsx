import { Activity, AlertCircle, AlertTriangle, BarChart3, Bell, Building2, Car, CheckCircle2, Edit, Filter, Flame, HeartPulse, Layers, Maximize2, Megaphone, Minus, MoreVertical, Navigation, Plus, RefreshCw, Shield, Trash2, TrendingUp, Users, Waves, ZoomIn, ZoomOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { AlertBanner, Badge, Button, Card, DataTable, InfoCell, Modal, ProgressBar, SectionHeader, StatCard, Tbody, Td, Th, Thead, Tr } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Audience, Broadcast, Hospital, VolunteerTask } from '../types';

type DashboardLine = { text: string; tone?: 'red'; icon?: LucideIcon };

export function GovernmentApp() {
  return (
    <SidebarLayout role="government">
      <Routes>
        <Route path="/" element={<GovDashboard />} />
        <Route path="/incidents" element={<GovIncidents />} />
        <Route path="/resources" element={<GovResources />} />
        <Route path="/broadcasts" element={<GovBroadcasts />} />
        <Route path="/analytics" element={<GovAnalytics />} />
        <Route path="/map" element={<GovMap />} />
        <Route path="/thresholds" element={<GovThresholds />} />
        <Route path="/settings" element={<GovSettings />} />
        <Route path="*" element={<Navigate to="/government" replace />} />
      </Routes>
    </SidebarLayout>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function GovDashboard() {
  const { incidents, hospitals, volunteerTasks, broadcasts, organisations, thresholds } = useData();
  const totalBeds = hospitals.reduce((s, h) => s + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const occupancy = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);
  const active = incidents.filter((i) => i.status !== 'Resolved').length + 9;

  const metrics = [
    { label: 'Total Incidents', value: 17, icon: AlertTriangle, iconColor: 'text-warning', lines: [{ text: `${active} active` }, { text: '13 open', tone: 'red' as const }] },
    { label: 'Critical Cases', value: 10, icon: AlertCircle, iconColor: 'text-critical', lines: [{ text: 'severity level 1' }, { text: 'Needs attention', tone: 'red' as const }] },
    { label: 'Hospital Beds', value: availableBeds, icon: BarChart3, iconColor: 'text-safe', lines: [{ text: `${occupancy}% occupancy` }, { text: `${totalBeds} total` }] },
    { label: 'Resolved Today', value: 4, icon: CheckCircle2, iconColor: 'text-safe', lines: [{ text: 'of 17 total' }, { text: '24% resolution rate', icon: Minus }] },
    { label: 'Avg Response', value: '4.2m', icon: TrendingUp, iconColor: 'text-navy-800', lines: [{ text: 'vs 5min target' }, { text: 'Within SLA', icon: Minus }] },
    { label: 'Volunteers', value: 20, icon: Users, iconColor: 'text-safe', lines: [{ text: 'of 20 registered' }, { text: 'Ready to deploy', icon: Minus }] },
    { label: 'Broadcasts', value: broadcasts.length, icon: Megaphone, iconColor: 'text-navy-800', lines: [{ text: 'last 24 hours' }, { text: 'Public comms', icon: Minus }] },
    { label: 'Agencies Active', value: organisations.length, icon: Shield, iconColor: 'text-navy-800', lines: [{ text: 'coordinating now' }, { text: 'SCDF, SPF, MOH', icon: Minus }] }
  ];

  return (
    <section>
      <SectionHeader
        title="Command Dashboard"
        subtitle="Real-time national emergency overview"
        action={
          <>
            <Button variant="outline"><Bell size={14} /> Thresholds</Button>
            <Button variant="primary"><RefreshCw size={14} /> Refresh</Button>
          </>
        }
      />
      <div className="mt-5 space-y-2">
        {thresholds.filter((t) => t.status !== 'Normal').slice(0, 3).map((alert) => (
          <AlertBanner
            key={alert.id}
            status={alert.status === 'Critical' ? 'Critical' : 'Warning'}
            title={`${alert.status.toUpperCase()}: ${alert.title.replace(' threshold', '')}`}
            detail={`Current: ${alert.current}${alert.unit ?? ''} — threshold: ${alert.threshold}${alert.unit ?? ''}`}
            action={
              <Button variant={alert.status === 'Critical' ? 'danger' : 'outline'} className="shrink-0 py-1.5 text-xs">
                AI Suggestion
              </Button>
            }
          />
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ProgressPanel title="Incidents by Type" rows={[['Medical', 5], ['Flood', 2], ['Fire', 3], ['Road', 2], ['Infrastructure', 3], ['Civil', 2]]} max={17} />
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Severity Distribution</h2>
          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            <Bar label="Critical" value={10} color="bg-critical" />
            <Bar label="High" value={6} color="bg-warning" />
            <Bar label="Medium" value={1} color="bg-safe" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Mini label="Open" value={6} />
            <Mini label="Dispatched" value={5} />
            <Mini label="Resolved" value={4} />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Hospital Capacity</h2>
          <div className="mt-4 space-y-4">
            {hospitals.slice(0, 4).map((h) => (
              <div key={h.id}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-sgds-gray-700">{h.name}</span><strong className="text-sgds-gray-900">{h.availableBeds}/{h.totalBeds}</strong></div>
                <ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Resource Summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatCard label="Volunteers Available" value={20} sub="of 20 total" tone="green" />
            <StatCard label="Hospitals Active" value={6} sub="of 6 total" />
          </div>
          <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-sgds-gray-500">Recent broadcasts</h3>
          <div className="mt-3 space-y-2">
            {broadcasts.slice(0, 3).map((b) => (
              <div key={b.id} className="flex justify-between gap-3 text-sm">
                <span className="text-sgds-gray-800">{b.title}<br /><small className="text-sgds-gray-500">{b.issuer}</small></span>
                <Badge>{b.audience}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon, iconColor, lines, outline = false, dot = false }: { label: string; value: string | number; icon: LucideIcon; iconColor: string; lines: DashboardLine[]; outline?: boolean; dot?: boolean }) {
  return (
    <Card className={`relative p-4 ${outline ? 'border-t-2 border-t-critical' : 'border-t-2 border-t-sgds-gray-200'}`}>
      {dot && <span className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-critical" />}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sgds-gray-500">
        <Icon size={14} className={iconColor} /><span>{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-sgds-gray-900">{value}</div>
      <div className="mt-1.5 space-y-0.5 text-xs">
        {lines.map((line) => {
          const LineIcon = line.icon;
          return (
            <div key={line.text} className={`flex items-center gap-1 ${line.tone === 'red' ? 'text-critical' : 'text-sgds-gray-500'}`}>
              {LineIcon && <LineIcon size={11} />}<span>{line.text}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Incidents ────────────────────────────────────────────────────────────────

function GovIncidents() {
  const { incidents } = useData();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Critical', 'High', 'Medium', 'Low', 'Open', 'Triage', 'Dispatched', 'In Progress', 'Resolved', 'Public', 'Private'];
  const filtered = filter === 'All'
    ? incidents
    : incidents.filter((i) => i.severity === filter || i.status === filter || i.publicVisibility === filter || i.type === filter);

  return (
    <section>
      <SectionHeader title="National Incidents" subtitle="Filter by incident attributes to scan national tickets quickly." />
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`border px-3 py-1.5 text-sm font-semibold transition-colors ${filter === item ? 'border-sgds-purple bg-sgds-purple text-white' : 'border-sgds-gray-200 bg-white text-sgds-gray-600 hover:bg-sgds-gray-50'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {filtered.map((incident) => (
          <Card key={incident.id} className="overflow-hidden">
            <div className="border-l-4 border-critical px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-sgds-gray-500">{incident.id}</div>
                  <h2 className="mt-0.5 text-base font-bold leading-snug text-sgds-gray-900">{incident.title}</h2>
                </div>
                <Badge>{incident.status}</Badge>
              </div>
            </div>
            <div className="px-4 pb-4 pt-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge>{incident.severity}</Badge><Badge>{incident.type}</Badge><Badge>{incident.publicVisibility}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-sgds-gray-600">{incident.description}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <InfoCell label="Location" value={incident.location} />
                <InfoCell label="Created" value={incident.createdAt} />
                <InfoCell label="Assigned" value={incident.assignedOrganisations.join(', ').toUpperCase()} />
                <InfoCell label="Responding" value={`${incident.unitsResponded} units · ${incident.volunteersResponded} volunteers`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ─── Resources ────────────────────────────────────────────────────────────────

function GovResources() {
  const { organisations, hospitals, volunteerTasks, updateHospital, postVolunteerTask } = useData();
  const [tab, setTab] = useState<'orgs' | 'hospitals' | 'tasks'>('orgs');
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [posting, setPosting] = useState(false);
  const available = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const total = hospitals.reduce((s, h) => s + h.totalBeds, 0);

  return (
    <section>
      <SectionHeader
        title="Resource Management"
        subtitle="Manage community organisations, hospital capacity, and volunteer tasks."
        action={<Button variant="primary"><RefreshCw size={14} /> Refresh All</Button>}
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <StatCard label="Community Organisations" value={organisations.length} sub="4 active · 1 deployed" />
        <StatCard label="Total Volunteer Pool" value="317/603" sub="29 currently deployed" tone="green" />
        <StatCard label="Hospital Capacity" value={`${available}/${total}`} sub="0 hospitals critically low" />
        <StatCard label="Open Volunteer Tasks" value={volunteerTasks.length} sub="2 critical urgency" tone="orange" />
      </div>
      <div className="mt-5 flex border-b border-sgds-gray-200">
        {[['orgs', 'Community Orgs'], ['hospitals', 'Hospitals'], ['tasks', 'Volunteer Tasks']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)} className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${tab === id ? 'border-sgds-purple text-sgds-purple' : 'border-transparent text-sgds-gray-600 hover:text-sgds-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'orgs' && (
        <Card className="mt-4">
          {['Government', 'Healthcare', 'NGO', 'Grassroots'].map((type) => (
            <div key={type} className="border-b border-sgds-gray-100 p-5 last:border-0">
              <div className="flex items-center gap-2">
                <Badge>{type}</Badge>
                <span className="text-xs text-sgds-gray-500">{organisations.filter((o) => o.type === type).length} organisation{organisations.filter((o) => o.type === type).length !== 1 ? 's' : ''}</span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {organisations.filter((o) => o.type === type).map((org) => (
                  <div key={org.id} className="flex items-center justify-between border border-sgds-gray-200 p-3">
                    <div>
                      <div className="text-sm font-semibold text-sgds-gray-900">{org.name}</div>
                      <div className="text-xs text-sgds-gray-500">{org.address}</div>
                    </div>
                    <div className="text-right text-xs">
                      <strong className="text-sgds-gray-900">{org.volunteersAvailable}/{org.volunteersTotal}</strong>
                      <div className="mt-0.5 text-sgds-gray-500">{org.activeTasks} tasks · <Badge>{org.status}</Badge></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'hospitals' && (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {hospitals.map((h) => (
            <Card key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-sgds-gray-900">{h.name}</div>
                  <div className="text-xs text-sgds-gray-500">{h.address}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{h.status}</Badge>
                  <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => setEditing(h)}><Edit size={11} /> Edit</Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Avail/Total" value={`${h.availableBeds}/${h.totalBeds}`} />
                <Mini label="ICU" value={h.icuAvailable} />
                <Mini label="Trauma" value={h.traumaBays} />
              </div>
              <div className="mt-3">
                <ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" />
                <div className="mt-1 text-right text-xs text-sgds-gray-500">{Math.round((h.availableBeds / h.totalBeds) * 100)}% available · {h.updatedAt}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        <Card className="mt-4">
          <div className="flex items-center justify-between border-b border-sgds-gray-200 px-5 py-4">
            <p className="text-sm text-sgds-gray-500">{volunteerTasks.length} tasks on the public volunteer board.</p>
            <Button variant="success" onClick={() => setPosting(true)}><Plus size={14} /> Post New Task</Button>
          </div>
          <DataTable>
            <Thead><tr><Th>Task</Th><Th>Organisation</Th><Th>Date / Time</Th><Th>Slots</Th><Th>Urgency</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {volunteerTasks.map((task) => (
                <Tr key={task.id}>
                  <Td className="font-semibold">{task.title}<br /><span className="text-xs font-normal text-sgds-gray-500">{task.location}</span></Td>
                  <Td>{task.organisation}</Td>
                  <Td>{task.time}</Td>
                  <Td>{task.slotsFilled}/{task.slotsTotal}</Td>
                  <Td><Badge>{task.urgency}</Badge></Td>
                  <Td><Badge>{task.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </DataTable>
        </Card>
      )}

      {editing && <HospitalModal hospital={editing} onClose={() => setEditing(null)} onSave={(patch) => { updateHospital(editing.id, patch); setEditing(null); }} />}
      {posting && <TaskPostModal onClose={() => setPosting(false)} onSave={(task) => { postVolunteerTask(task); setPosting(false); }} />}
    </section>
  );
}

function HospitalModal({ hospital, onClose, onSave }: { hospital: Hospital; onClose: () => void; onSave: (patch: Partial<Hospital>) => void }) {
  const [beds, setBeds] = useState(hospital.availableBeds);
  const [icu, setIcu] = useState(hospital.icuAvailable);
  return (
    <Modal title={`Edit ${hospital.name}`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <label className="block text-sm font-semibold text-sgds-gray-800">Available beds<input type="number" className="mt-1.5 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" value={beds} onChange={(e) => setBeds(Number(e.target.value))} /></label>
        <label className="block text-sm font-semibold text-sgds-gray-800">ICU available<input type="number" className="mt-1.5 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" value={icu} onChange={(e) => setIcu(Number(e.target.value))} /></label>
        <Button variant="success" className="w-full" onClick={() => onSave({ availableBeds: beds, icuAvailable: icu })}>Save changes</Button>
      </div>
    </Modal>
  );
}

function TaskPostModal({ onClose, onSave }: { onClose: () => void; onSave: (task: Omit<VolunteerTask, 'id' | 'slotsFilled' | 'status'>) => void }) {
  const [title, setTitle] = useState('Community Check-in Support');
  return (
    <Modal title="Post New Task" onClose={onClose}>
      <div className="space-y-4 p-5">
        <label className="block text-sm font-semibold text-sgds-gray-800">Task title<input className="mt-1.5 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <Button variant="success" className="w-full" onClick={() => onSave({ title, organisation: "People's Association", location: 'Jurong West Community Club', time: 'Tomorrow 9:00 AM – 1:00 PM', urgency: 'Medium', skills: ['Community support'], slotsTotal: 12, description: 'Support resident welfare checks and guide residents to official services.' })}>Post Task</Button>
      </div>
    </Modal>
  );
}

// ─── Broadcasts ───────────────────────────────────────────────────────────────

function GovBroadcasts() {
  const { broadcasts, publishBroadcast, deleteBroadcast } = useData();
  const [compose, setCompose] = useState(false);
  const [preview, setPreview] = useState<Partial<Broadcast> | null>(null);
  const counts = { all: broadcasts.filter((b) => b.audience === 'all').length, responders: broadcasts.filter((b) => b.audience === 'responders').length, zone: broadcasts.filter((b) => b.audience === 'zone').length };
  const publish = () => {
    if (preview?.title && preview.message && preview.audience) {
      publishBroadcast({ title: preview.title, message: preview.message, audience: preview.audience as Audience, zone: preview.zone, severity: 'NOTICE' });
      setPreview(null);
    }
  };
  return (
    <section>
      <SectionHeader title="Broadcast Management" subtitle="Create, manage, and publish emergency communications." action={<Button variant="primary" onClick={() => setCompose(true)}><Plus size={14} /> New Broadcast</Button>} />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <StatCard label="Public Broadcasts" value={counts.all} />
        <StatCard label="Responder Broadcasts" value={counts.responders} tone="green" />
        <StatCard label="Zone Broadcasts" value={counts.zone} tone="orange" />
      </div>
      <Card className="mt-5">
        <div className="flex items-center justify-between border-b border-sgds-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-sgds-gray-900">All Broadcasts</h2>
          <button className="text-sm font-semibold text-sgds-purple hover:underline">Refresh</button>
        </div>
        {broadcasts.map((b) => (
          <div key={b.id} className="flex items-center gap-4 border-b border-sgds-gray-100 px-5 py-4 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2"><strong className="text-sm text-sgds-gray-900">{b.title}</strong><Badge>{b.audience}</Badge>{b.zone && <Badge>{b.zone}</Badge>}</div>
              <p className="mt-1 line-clamp-1 text-xs text-sgds-gray-500">{b.message}</p>
              <div className="mt-1 text-xs text-sgds-gray-400">{b.issuer} · {b.timestamp}</div>
            </div>
            <button onClick={() => deleteBroadcast(b.id)} className="p-2 text-sgds-gray-400 hover:bg-red-50 hover:text-critical" aria-label={`Delete ${b.title}`}><Trash2 size={15} /></button>
          </div>
        ))}
      </Card>
      {compose && <ComposeModal onClose={() => setCompose(false)} onPreview={(draft) => { setPreview(draft); setCompose(false); }} />}
      {preview && <PreviewModal draft={preview} onClose={() => setPreview(null)} onEdit={() => { setCompose(true); setPreview(null); }} onPublish={publish} />}
    </section>
  );
}

function ComposeModal({ onClose, onPreview }: { onClose: () => void; onPreview: (draft: Partial<Broadcast>) => void }) {
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('Emergency Advisory — Immediate Action Required');
  const [message, setMessage] = useState('General emergency broadcast for the public.\n\nMembers of the public are advised to remain vigilant and follow all official instructions. Emergency services are on-site and coordinating the response. Call 995 for emergencies or 999 for police emergencies.');
  return (
    <Modal title="Compose Broadcast" onClose={onClose} width="max-w-2xl">
      <div className="space-y-4 p-5">
        <div>
          <div className="mb-2 text-sm font-semibold text-sgds-gray-800">Audience</div>
          <div className="grid grid-cols-3 gap-3">
            {(['all', 'responders', 'zone'] as Audience[]).map((item) => (
              <button key={item} onClick={() => setAudience(item)} className={`border p-3 text-left text-sm transition-colors ${audience === item ? 'border-sgds-purple bg-sgds-purple-light text-sgds-purple' : 'border-sgds-gray-200 hover:bg-sgds-gray-50'}`}>
                <strong className="block">{item === 'all' ? 'Everyone' : item === 'zone' ? 'By Zone' : 'Responders'}</strong>
                <small className="text-sgds-gray-500">{item === 'all' ? 'All platform users' : item === 'zone' ? 'Specific geographic zone' : 'Internal responder teams'}</small>
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm font-semibold text-sgds-gray-800">Link to Incident (optional)<select className="mt-1.5 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple"><option>No linked incident</option><option>INC-2026-0520 — Flooding at Orchard Road</option></select></label>
        <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 p-3">
          <div><strong className="text-sm text-emerald-800">AI Draft Assistant</strong><small className="block text-xs text-emerald-700">Generate a general emergency broadcast template.</small></div>
          <Button variant="success"><RefreshCw size={13} /> Regenerate</Button>
        </div>
        <label className="block text-sm font-semibold text-sgds-gray-800">Title<input className="mt-1.5 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-sgds-gray-800">Message<textarea className="mt-1.5 h-36 w-full border border-sgds-gray-300 p-3 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onPreview({ title, message, audience })}>Preview →</Button></div>
      </div>
    </Modal>
  );
}

function PreviewModal({ draft, onClose, onEdit, onPublish }: { draft: Partial<Broadcast>; onClose: () => void; onEdit: () => void; onPublish: () => void }) {
  return (
    <Modal title="Preview & Publish" onClose={onClose} width="max-w-xl">
      <div className="space-y-4 p-5">
        <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Review before publishing.</strong> Once published, this broadcast will be visible to the selected audience immediately.</div>
        <Card>
          <div className="flex items-center justify-between bg-navy-950 p-3 text-white"><strong className="text-sm">Broadcast Preview</strong><Badge>{draft.audience}</Badge></div>
          <div className="p-4"><h3 className="font-bold text-sgds-gray-900">{draft.title}</h3><p className="mt-2 whitespace-pre-line text-sm text-sgds-gray-700">{draft.message}</p></div>
        </Card>
        <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={onEdit}>Edit</Button><Button variant="success" onClick={onPublish}>Publish Now</Button></div>
      </div>
    </Modal>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function GovAnalytics() {
  return (
    <section>
      <SectionHeader title="Analytics Dashboard" subtitle="System-wide performance statistics — last 30 days." />
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <StatCard label="Total Incidents (30d)" value="1,247" sub="+12% vs last period" />
        <StatCard label="Avg Response Time" value="4.2m" sub="-0.3m vs last period" tone="green" />
        <StatCard label="Resolution Rate" value="94%" sub="+2% vs last period" tone="green" />
        <StatCard label="Active Users" value="847" sub="+5% vs last period" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ProgressPanel title="Incidents by Type" rows={[['Medical', 512], ['Road Accident', 298], ['Fire', 187], ['Flood', 150], ['Infrastructure', 62], ['Civil', 38]]} max={1247} />
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Performance by Planning Zone</h2>
          <DataTable className="mt-4">
            <Thead><tr><Th>Zone</Th><Th>Incidents</Th><Th>Avg Response</Th><Th>Vs Target</Th></tr></Thead>
            <Tbody>
              {[['Jurong / West', 312, '4.1m', true], ['Central / City', 287, '3.8m', true], ['North / Woodlands', 198, '5.2m', false], ['East / Tampines', 241, '4.6m', true], ['North-East / Punggol', 209, '4.9m', true]].map((r) => (
                <Tr key={r[0] as string}>
                  <Td className="font-semibold">{r[0] as string}</Td>
                  <Td>{r[1] as number}</Td>
                  <Td className="font-bold">{r[2] as string}</Td>
                  <Td className={r[3] ? 'font-semibold text-safe' : 'font-semibold text-critical'}>{r[3] ? 'On target' : 'Over target'}</Td>
                </Tr>
              ))}
            </Tbody>
          </DataTable>
        </Card>
      </div>
      <Card className="mt-5 p-5">
        <h2 className="text-base font-bold text-sgds-gray-900">Incident Volume by Hour (24h average)</h2>
        <div className="mt-6 flex h-36 items-end justify-between border-b border-sgds-gray-200">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-8 bg-sgds-purple opacity-80" style={{ height: `${20 + ((i * 17) % 90)}px` }} />)}
        </div>
        <p className="mt-2 text-xs text-sgds-gray-500">Peak hours: 17:00–21:00. Lowest: 02:00–05:00.</p>
      </Card>
    </section>
  );
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

function GovThresholds() {
  const { thresholds, updateThreshold, publishBroadcast, postVolunteerTask } = useData();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <section>
      <SectionHeader title="Alerts / Thresholds" subtitle="Set health and disaster thresholds, then generate guidance when cases exceed limits." />
      <Card className="mt-5 overflow-visible">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_1.5fr_48px] border-b border-sgds-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-sgds-gray-500">
          <div>Threshold</div><div>Current</div><div>Limit</div><div>Status</div><div>AI recommendation</div><div />
        </div>
        <div className="divide-y divide-sgds-gray-100">
          {thresholds.map((alert) => (
            <div key={alert.id} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_1.5fr_48px] items-center gap-4 px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-sgds-gray-900">{alert.title}</div>
                <div className="mt-2"><ProgressBar value={alert.current} max={Math.max(alert.current, alert.threshold)} tone={alert.status === 'Critical' ? 'bg-critical' : alert.status === 'Warning' ? 'bg-warning' : 'bg-safe'} /></div>
              </div>
              <div className="text-xl font-bold text-sgds-gray-800">{alert.current}{alert.unit}</div>
              <div>
                {editingId === alert.id ? (
                  <input type="number" className="w-24 border border-sgds-gray-300 p-2 text-sm focus:outline focus:outline-2 focus:outline-sgds-purple" defaultValue={alert.threshold} onBlur={(e) => { updateThreshold(alert.id, Number(e.target.value)); setEditingId(null); }} autoFocus />
                ) : (
                  <span className="text-sm font-medium text-sgds-gray-700">{alert.threshold}{alert.unit}</span>
                )}
              </div>
              <Badge>{alert.status}</Badge>
              <div className="text-xs leading-5 text-sgds-gray-600">{alert.recommendation}</div>
              <div className="relative flex justify-end">
                <button onClick={() => setOpenMenu(openMenu === alert.id ? null : alert.id)} className="grid h-8 w-8 place-items-center border border-sgds-gray-200 bg-white hover:bg-sgds-gray-50" aria-label={`Actions for ${alert.title}`}><MoreVertical size={15} /></button>
                {openMenu === alert.id && (
                  <div className="absolute right-0 top-9 z-20 w-52 border border-sgds-gray-200 bg-white shadow-soft">
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-sgds-gray-50" onClick={() => { setEditingId(alert.id); setOpenMenu(null); }}><Edit size={13} /> Edit threshold</button>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-sgds-gray-50" onClick={() => { publishBroadcast({ title: `Advisory: ${alert.title}`, message: alert.recommendation, audience: 'all', severity: 'NOTICE' }); setOpenMenu(null); }}><Megaphone size={13} /> Generate broadcast</button>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-sgds-gray-50" onClick={() => { postVolunteerTask({ title: alert.recommendation, organisation: 'Singapore Red Cross', location: 'Affected zones', time: 'Today', urgency: alert.status === 'Critical' ? 'Critical' : 'High', skills: ['Rapid response'], slotsTotal: 20, description: alert.recommendation }); setOpenMenu(null); }}><Plus size={13} /> Create volunteer task</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function GovMap() {
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
    { x: 58, y: 49, type: 'hospital', color: 'border-warning text-warning bg-white', icon: Activity },
    { x: 68, y: 56, type: 'fire', color: 'border-critical text-critical bg-white', icon: Flame },
    { x: 80, y: 55, type: 'medical', color: 'border-critical text-critical bg-white', icon: HeartPulse },
    { x: 86, y: 55, type: 'road', color: 'border-critical text-critical bg-white', icon: Car },
    { x: 38, y: 70, type: 'critical', value: '12', color: 'bg-critical text-white', icon: Users },
    { x: 74, y: 64, type: 'critical', value: '4', color: 'bg-critical text-white', icon: Users },
    { x: 78, y: 30, type: 'group', value: '143', color: 'bg-warning text-white', icon: Users }
  ];
  const startDrag = (e: MouseEvent<HTMLDivElement>) => { if (!mapRef.current) return; dragRef.current = { active: true, x: e.clientX, y: e.clientY, left: mapRef.current.scrollLeft, top: mapRef.current.scrollTop }; setDragging(true); };
  const moveDrag = (e: MouseEvent<HTMLDivElement>) => { if (!dragRef.current.active || !mapRef.current) return; mapRef.current.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x); mapRef.current.scrollTop = dragRef.current.top - (e.clientY - dragRef.current.y); };
  const stopDrag = () => { dragRef.current.active = false; setDragging(false); };

  return (
    <section>
      <SectionHeader title="Incident & Resource Map" subtitle="Incidents · Hospitals · Volunteer Group Activities"
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
          <button key={item} onClick={() => setSeverity(item)} className={`px-3 py-1.5 text-sm ${severity === item ? 'border border-sgds-purple bg-sgds-purple-light font-semibold text-sgds-purple' : 'text-sgds-gray-500 hover:text-sgds-gray-900'}`}>{item}</button>
        ))}
      </div>
      <div className="relative mt-4 h-[650px] overflow-hidden border border-sgds-gray-300 bg-sgds-gray-100">
        <div ref={mapRef} className={`h-full w-full overflow-auto ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={startDrag} onMouseMove={moveDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
          <div className="relative min-h-[820px] min-w-[1280px] select-none">
            <img src="/singapore-map.png" alt="Singapore map" className="absolute inset-0 h-full w-full object-cover opacity-75" draggable={false} />
            <div className="absolute inset-0 bg-blue-50/25" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
            {markers.map((marker, index) => {
              const Icon = marker.icon;
              const isCluster = Boolean(marker.value);
              return <button key={`${marker.type}-${index}`} className={`absolute grid place-items-center rounded-full shadow-card ${isCluster ? `h-10 w-10 ${marker.color}` : `h-9 w-9 border-2 ${marker.color}`}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} title={marker.type}><Icon size={isCluster ? 13 : 16} />{marker.value && <span className="text-[10px] font-bold leading-none">{marker.value}</span>}</button>;
            })}
          </div>
        </div>
        <Card className="absolute left-4 top-4 p-3"><div className="text-xs font-bold uppercase tracking-wide text-sgds-gray-500">Active Volunteer Groups</div><div className="mt-1 text-sm font-bold"><span className="text-critical">2 Critical</span> <span className="text-warning">3 Urgent</span> <span className="text-safe">1 Needed</span></div><div className="text-xs text-sgds-gray-500">187 volunteers deployed</div></Card>
        <Card className="absolute bottom-6 left-4 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-bold text-sgds-gray-900"><Layers size={15} /> Legend</div>
          {[['Medical', HeartPulse, 'text-critical'], ['Fire', Flame, 'text-orange-500'], ['Flood', Waves, 'text-blue-500'], ['Road', Car, 'text-warning'], ['Infrastructure', Building2, 'text-purple-500'], ['Hospital', Activity, 'text-safe'], ['Volunteer Group', Users, 'text-safe']].map(([label, Icon, color]) => (
            <div key={label as string} className="mt-1.5 flex items-center gap-2 text-xs"><span className={color as string}><Icon size={12} /></span><span>{label as string}</span></div>
          ))}
        </Card>
        <div className="absolute right-4 top-4 grid gap-2">{[ZoomIn, ZoomOut, Navigation].map((Icon, i) => <button key={i} className="grid h-10 w-10 place-items-center border border-sgds-gray-200 bg-white shadow-card hover:bg-sgds-gray-50"><Icon size={17} /></button>)}</div>
        <div className="absolute bottom-6 right-4 border border-sgds-gray-200 bg-white px-3 py-1.5 text-xs text-sgds-gray-500">Zoom 12</div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Map Detail Features</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><InfoCell label="Active incident markers" value="16" /><InfoCell label="Hospitals visible" value="6" /><InfoCell label="Volunteer groups" value="6" /></div>
          <p className="mt-4 text-sm text-sgds-gray-500">Drag the map surface to pan. Filters above switch between incidents, hospitals, and volunteer group activities.</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-bold text-sgds-gray-900">Area incidents</h2>
          <div className="mt-4 space-y-2">{incidents.map((incident) => (<div key={incident.id} className="border border-sgds-gray-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-sgds-gray-900">{incident.title}</strong><Badge>{incident.severity}</Badge></div><div className="mt-1 text-xs text-sgds-gray-500">{incident.location}</div></div>))}</div>
        </Card>
      </div>
    </section>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function GovSettings() {
  return (
    <section>
      <SectionHeader title="Settings" />
      <Card className="mt-5 p-5">
        <h2 className="text-base font-bold text-sgds-gray-900">Command profile</h2>
        <p className="mt-2 text-sm text-sgds-gray-500">Raj Kumar · gov_admin · OneTogether Command Centre</p>
      </Card>
    </section>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ProgressPanel({ title, rows, max }: { title: string; rows: [string, number][]; max: number }) {
  const colors = ['bg-critical', 'bg-warning', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-navy-950'];
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-sgds-gray-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value], i) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm"><span className="text-sgds-gray-700">{label}</span><strong className="text-sgds-gray-900">{value} <span className="font-normal text-sgds-gray-400">({Math.round((value / max) * 100)}%)</span></strong></div>
            <ProgressBar value={value} max={max} tone={colors[i]} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-1 text-xl font-bold text-sgds-gray-900">{value}</div><div className={`mx-auto h-16 w-full ${color}`} /><div className="mt-1 text-xs text-sgds-gray-500">{label}</div></div>;
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return <div className="bg-sgds-gray-50 p-3 text-center"><div className="text-xl font-bold text-sgds-gray-900">{value}</div><div className="mt-0.5 text-xs text-sgds-gray-500">{label}</div></div>;
}
