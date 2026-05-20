import { Activity, AlertCircle, AlertTriangle, BarChart3, Bell, Building2, Car, CheckCircle2, Edit, Filter, Flame, HeartPulse, Layers, Maximize2, Megaphone, Minus, MoreVertical, Navigation, Plus, RefreshCw, Shield, Trash2, TrendingUp, Users, Waves, ZoomIn, ZoomOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { AlertBanner, Badge, Card, EmptyButton, Field, GreenButton, Modal, PrimaryButton, ProgressBar, StatCard } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Audience, Broadcast, Hospital, VolunteerTask } from '../types';

type DashboardLine = {
  text: string;
  tone?: 'red';
  icon?: LucideIcon;
};

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

function GovDashboard() {
  const { incidents, hospitals, volunteerTasks, broadcasts, organisations, thresholds } = useData();
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const occupancy = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);
  const active = incidents.filter((i) => i.status !== 'Resolved').length + 9;
  const metrics = [
    { label: 'Total Incidents', value: 17, icon: AlertTriangle, iconColor: 'text-warning', lines: [{ text: `${active} active` }, { text: '13 open', tone: 'red' as const, icon: Shield }] },
    { label: 'Critical Cases', value: 10, icon: AlertCircle, iconColor: 'text-critical', outline: true, dot: true, lines: [{ text: 'severity level 1' }, { text: 'Needs attention', tone: 'red' as const, icon: Shield }] },
    { label: 'Hospital Capacity', value: availableBeds, icon: BarChart3, iconColor: 'text-safe', outline: true, dot: true, lines: [{ text: `${occupancy}% occupancy` }, { text: `${totalBeds} total beds`, tone: 'red' as const, icon: Shield }] },
    { label: 'Resolved Today', value: 4, icon: CheckCircle2, iconColor: 'text-safe', lines: [{ text: 'of 17 total' }, { text: '24% resolution rate', icon: Minus }] },
    { label: 'Avg Response Time', value: '4.2m', icon: TrendingUp, iconColor: 'text-navy-800', lines: [{ text: 'vs 5min target' }, { text: 'Within SLA', icon: Minus }] },
    { label: 'Available Volunteers', value: 20, icon: Users, iconColor: 'text-safe', lines: [{ text: 'of 20 registered' }, { text: 'Ready to deploy', icon: Minus }] },
    { label: 'Recent Broadcasts', value: broadcasts.length, icon: Megaphone, iconColor: 'text-navy-800', lines: [{ text: 'last 24 hours' }, { text: 'Public comms', icon: Minus }] },
    { label: 'Agencies Active', value: organisations.length, icon: Shield, iconColor: 'text-navy-800', lines: [{ text: 'coordinating now' }, { text: 'SCDF, SPF, MOH...', icon: Minus }] }
  ];
  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Command Dashboard</h1>
          <p className="mt-1 text-slate-500">Real-time national emergency overview</p>
        </div>
        <div className="flex gap-3">
          <EmptyButton><Bell size={15} className="inline" /> Thresholds</EmptyButton>
          <PrimaryButton><RefreshCw size={15} className="inline" /> Refresh</PrimaryButton>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {thresholds.filter((t) => t.status !== 'Normal').slice(0, 3).map((alert) => <AlertBanner key={alert.id} status={alert.status === 'Critical' ? 'Critical' : 'Warning'} title={`${alert.status.toUpperCase()}: ${alert.title.replace(' threshold', '')}`} detail={`Current: ${alert.current}${alert.unit ?? ''} — threshold: ${alert.threshold}${alert.unit ?? ''}`} action={<button className={`${alert.status === 'Critical' ? 'bg-critical' : 'bg-warning'} px-3 py-2 text-sm font-bold text-white`}>AI Suggestion</button>} />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => <DashboardMetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProgressPanel title="Incidents by Type" rows={[['Medical', 5], ['Flood', 2], ['Fire', 3], ['Road', 2], ['Infrastructure', 3], ['Civil', 2]]} max={17} />
        <Card className="p-5"><h2 className="font-bold">Severity Distribution</h2><div className="mt-6 grid grid-cols-3 gap-4 text-center"><Bar label="Critical" value={10} color="bg-critical" /><Bar label="High" value={6} color="bg-warning" /><Bar label="Medium" value={1} color="bg-safe" /></div><div className="mt-6 grid grid-cols-3 gap-4 text-center"><Mini label="Open" value={6} /><Mini label="Dispatched" value={5} /><Mini label="Resolved" value={4} /></div></Card>
        <Card className="p-5"><h2 className="font-bold">Hospital Capacity</h2><div className="mt-4 space-y-3">{hospitals.slice(0, 4).map((h) => <div key={h.id}><div className="flex justify-between text-sm"><span>{h.name}</span><strong>{h.availableBeds}/{h.totalBeds}</strong></div><ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" /></div>)}</div></Card>
        <Card className="p-5"><h2 className="font-bold">Resource Summary</h2><div className="mt-4 grid grid-cols-2 gap-4"><StatCard label="Volunteers Available" value={20} sub="of 20 total" tone="green" /><StatCard label="Hospitals Active" value={6} sub="of 6 total" /></div><h3 className="mt-5 text-xs font-bold uppercase text-slate-500">Recent broadcasts</h3><div className="mt-3 space-y-2">{broadcasts.slice(0, 3).map((b) => <div key={b.id} className="flex justify-between text-sm"><span>{b.title}<br /><small className="text-slate-500">{b.issuer}</small></span><Badge>{b.audience}</Badge></div>)}</div></Card>
      </div>
    </section>
  );
}

function DashboardMetricCard({ label, value, icon: Icon, iconColor, lines, outline = false, dot = false }: { label: string; value: string | number; icon: LucideIcon; iconColor: string; lines: DashboardLine[]; outline?: boolean; dot?: boolean }) {
  return (
    <Card className={`relative p-4 ${outline ? 'border-red-300' : ''}`}>
      {dot && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-red-400" />}
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon size={18} className={iconColor} />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-bold text-slate-950">{value}</div>
      <div className="mt-2 space-y-1 text-sm">
        {lines.map((line) => {
          const LineIcon = line.icon;
          return (
            <div key={line.text} className={`flex items-center gap-1.5 ${line.tone === 'red' ? 'text-red-600' : 'text-slate-500'}`}>
              {LineIcon && <LineIcon size={13} />}
              <span>{line.text}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="bg-slate-50 p-3 text-sm"><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-semibold text-slate-900">{value}</div></div>;
}

function LegendItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return <div className="mt-2 flex items-center gap-2"><span className={color}>{icon}</span><span>{label}</span></div>;
}

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
      <div className="flex items-start justify-between"><div><h1 className="text-3xl font-bold">Broadcast Management</h1><p className="mt-1 text-slate-500">Create, manage, and publish emergency communications</p></div><PrimaryButton onClick={() => setCompose(true)}><Plus size={15} className="inline" /> New Broadcast</PrimaryButton></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3"><StatCard label="Public Broadcasts" value={counts.all} /><StatCard label="Responder Broadcasts" value={counts.responders} tone="green" /><StatCard label="Zone Broadcasts" value={counts.zone} tone="orange" /></div>
      <Card className="mt-6"><div className="flex items-center justify-between border-b border-slate-200 p-4"><h2 className="font-bold">All Broadcasts</h2><button className="text-sm text-safe">Refresh</button></div>{broadcasts.map((b) => <div key={b.id} className="flex items-center gap-4 border-b border-slate-100 p-4"><div className="flex-1"><div className="flex items-center gap-2"><strong>{b.title}</strong><Badge>{b.audience}</Badge>{b.zone && <Badge>{b.zone}</Badge>}</div><p className="mt-1 line-clamp-1 text-sm text-slate-500">{b.message}</p><div className="mt-2 text-xs text-slate-500">{b.issuer} · {b.timestamp}</div></div><button onClick={() => deleteBroadcast(b.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-critical" aria-label={`Delete ${b.title}`}><Trash2 size={16} /></button></div>)}</Card>
      {compose && <ComposeModal onClose={() => setCompose(false)} onPreview={(draft) => { setPreview(draft); setCompose(false); }} />}
      {preview && <PreviewModal draft={preview} onClose={() => setPreview(null)} onEdit={() => { setCompose(true); setPreview(null); }} onPublish={publish} />}
    </section>
  );
}

function ComposeModal({ onClose, onPreview }: { onClose: () => void; onPreview: (draft: Partial<Broadcast>) => void }) {
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('Emergency Advisory - Immediate Action Required');
  const [message, setMessage] = useState('General emergency broadcast for the public.\n\nMembers of the public and general public are advised to remain vigilant and follow all official instructions. Emergency services are on-site and coordinating the response. If you are in the affected area, please follow evacuation instructions and avoid the scene. Call 995 for emergencies or 999 for police emergency if you need immediate assistance.');
  return (
    <Modal title="Compose Broadcast" onClose={onClose} width="max-w-2xl">
      <div className="space-y-4 p-5">
        <div><div className="mb-2 text-sm font-bold">Audience</div><div className="grid grid-cols-3 gap-3">{(['all', 'responders', 'zone'] as Audience[]).map((item) => <button key={item} onClick={() => setAudience(item)} className={`border p-3 text-left ${audience === item ? 'border-navy-950 bg-navy-50' : 'border-slate-200'}`}><strong>{item === 'all' ? 'Everyone' : item === 'zone' ? 'By Zone' : 'Responders'}</strong><br /><small className="text-slate-500">{item === 'all' ? 'All users on the platform' : item === 'zone' ? 'Specific geographic zone' : 'Internal responder teams'}</small></button>)}</div></div>
        <Field label="Link to Incident (optional)"><select className="w-full border border-slate-200 p-3"><option>No linked incident</option><option>INC-2026-0520 - Flooding at Orchard Road</option></select></Field>
        <div className="flex items-center justify-between border border-emerald-100 bg-emerald-50 p-3"><div><strong>AI Draft Assistant</strong><br /><small>Generate a general emergency broadcast template.</small></div><GreenButton><RefreshCw size={14} className="inline" /> Regenerate</GreenButton></div>
        <Field label="Title"><input className="w-full border border-slate-200 p-3" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Message"><textarea className="h-40 w-full border border-slate-200 p-3" value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3"><EmptyButton onClick={onClose}>Cancel</EmptyButton><PrimaryButton onClick={() => onPreview({ title, message, audience })}>Preview →</PrimaryButton></div>
      </div>
    </Modal>
  );
}

function PreviewModal({ draft, onClose, onEdit, onPublish }: { draft: Partial<Broadcast>; onClose: () => void; onEdit: () => void; onPublish: () => void }) {
  return (
    <Modal title="Preview & Publish" onClose={onClose} width="max-w-xl">
      <div className="space-y-4 p-5">
        <div className="border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800"><strong>Review before publishing</strong><br />Once published, this broadcast will be visible to the selected audience immediately.</div>
        <Card><div className="flex items-center justify-between bg-navy-950 p-3 text-white"><strong>Broadcast Preview</strong><Badge>{draft.audience}</Badge></div><div className="p-4"><h3 className="font-bold">{draft.title}</h3><p className="mt-3 whitespace-pre-line text-sm text-slate-700">{draft.message}</p></div></Card>
        <div className="grid grid-cols-2 gap-3"><EmptyButton onClick={onEdit}>Edit</EmptyButton><GreenButton onClick={onPublish}>Publish Now</GreenButton></div>
      </div>
    </Modal>
  );
}

function GovResources() {
  const { organisations, hospitals, volunteerTasks, updateHospital, postVolunteerTask } = useData();
  const [tab, setTab] = useState<'orgs' | 'hospitals' | 'tasks'>('orgs');
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [posting, setPosting] = useState(false);
  const available = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const total = hospitals.reduce((s, h) => s + h.totalBeds, 0);
  return (
    <section>
      <div className="flex justify-between"><div><h1 className="text-3xl font-bold">Resource Management</h1><p className="mt-1 text-slate-500">Manage community organisations, hospital capacity, and volunteer tasks</p></div><PrimaryButton><RefreshCw size={15} className="inline" /> Refresh All</PrimaryButton></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4"><StatCard label="Community Organisations" value={organisations.length} sub="4 active · 1 deployed" /><StatCard label="Total Volunteer Pool" value="317/603" sub="29 currently deployed" tone="green" /><StatCard label="Hospital Capacity" value={`${available}/${total}`} sub="0 hospitals critically low" /><StatCard label="Open Volunteer Tasks" value={volunteerTasks.length} sub="2 critical urgency" tone="orange" /></div>
      <div className="mt-6 grid grid-cols-3 border border-slate-200 bg-white">{[['orgs', 'Community Orgs'], ['hospitals', 'Hospitals'], ['tasks', 'Volunteer Tasks']].map(([id, label]) => <button key={id} onClick={() => setTab(id as typeof tab)} className={`p-4 ${tab === id ? 'bg-navy-950 text-white' : ''}`}>{label}</button>)}</div>
      {tab === 'orgs' && <Card className="p-5">{['Government', 'Healthcare', 'NGO', 'Grassroots'].map((type) => <div key={type} className="mb-5"><Badge>{type}</Badge><span className="ml-2 text-sm text-slate-500">{organisations.filter((o) => o.type === type).length} organisation</span><div className="mt-2 grid gap-3 lg:grid-cols-2">{organisations.filter((o) => o.type === type).map((org) => <div key={org.id} className="flex items-center justify-between border border-slate-200 p-3"><div><strong>{org.name}</strong> <Badge>{org.type}</Badge><div className="text-sm text-slate-500">{org.address}</div></div><div className="text-right text-sm"><strong>{org.volunteersAvailable}/{org.volunteersTotal}</strong><br />{org.activeTasks} tasks · {org.status}</div></div>)}</div></div>)}</Card>}
      {tab === 'hospitals' && <div className="grid gap-4 p-5 bg-white border border-slate-200 xl:grid-cols-3">{hospitals.map((h) => <Card key={h.id} className="p-4"><div className="flex justify-between"><div><strong>{h.name}</strong><div className="text-sm text-slate-500">{h.address}</div></div><div className="flex gap-2"><Badge>{h.status}</Badge><EmptyButton onClick={() => setEditing(h)}><Edit size={14} className="inline" /> Edit</EmptyButton></div></div><div className="mt-4 space-y-3 text-center"><Mini label="Available Beds" value={`${h.availableBeds}/${h.totalBeds}`} /><Mini label="ICU Available" value={h.icuAvailable} /><Mini label="Trauma Bays" value={h.traumaBays} /></div><div className="mt-3"><ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" /></div><div className="mt-1 text-right text-xs text-slate-500">{Math.round((h.availableBeds / h.totalBeds) * 100)}% capacity available · updated {h.updatedAt}</div></Card>)}</div>}
      {tab === 'tasks' && <Card className="p-5"><div className="mb-4 flex justify-between"><p className="text-sm text-slate-500">{volunteerTasks.length} tasks on the public volunteer board.</p><GreenButton onClick={() => setPosting(true)}><Plus size={14} className="inline" /> Post New Task</GreenButton></div><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Task</th><th>Organisation</th><th>Date / Time</th><th>Slots</th><th>Urgency</th><th>Status</th></tr></thead><tbody>{volunteerTasks.map((task) => <tr key={task.id} className="border-t border-slate-100"><td className="p-3"><strong>{task.title}</strong><br /><small>{task.location}</small></td><td>{task.organisation}</td><td>{task.time}</td><td>{task.slotsFilled}/{task.slotsTotal}</td><td><Badge>{task.urgency}</Badge></td><td><Badge>{task.status}</Badge></td></tr>)}</tbody></table></Card>}
      {editing && <HospitalModal hospital={editing} onClose={() => setEditing(null)} onSave={(patch) => { updateHospital(editing.id, patch); setEditing(null); }} />}
      {posting && <TaskPostModal onClose={() => setPosting(false)} onSave={(task) => { postVolunteerTask(task); setPosting(false); }} />}
    </section>
  );
}

function HospitalModal({ hospital, onClose, onSave }: { hospital: Hospital; onClose: () => void; onSave: (patch: Partial<Hospital>) => void }) {
  const [beds, setBeds] = useState(hospital.availableBeds);
  const [icu, setIcu] = useState(hospital.icuAvailable);
  return <Modal title={`Edit ${hospital.name}`} onClose={onClose}><div className="space-y-4 p-5"><Field label="Available beds"><input type="number" className="w-full border border-slate-200 p-3" value={beds} onChange={(e) => setBeds(Number(e.target.value))} /></Field><Field label="ICU available"><input type="number" className="w-full border border-slate-200 p-3" value={icu} onChange={(e) => setIcu(Number(e.target.value))} /></Field><GreenButton className="w-full" onClick={() => onSave({ availableBeds: beds, icuAvailable: icu })}>Save changes</GreenButton></div></Modal>;
}

function TaskPostModal({ onClose, onSave }: { onClose: () => void; onSave: (task: Omit<VolunteerTask, 'id' | 'slotsFilled' | 'status'>) => void }) {
  const [title, setTitle] = useState('Community Check-in Support');
  return <Modal title="Post New Task" onClose={onClose}><div className="space-y-4 p-5"><Field label="Task"><input className="w-full border border-slate-200 p-3" value={title} onChange={(e) => setTitle(e.target.value)} /></Field><GreenButton className="w-full" onClick={() => onSave({ title, organisation: "People's Association", location: 'Jurong West Community Club', time: 'Tomorrow 9:00 AM - 1:00 PM', urgency: 'Medium', skills: ['Community support'], slotsTotal: 12, description: 'Support resident welfare checks and guide residents to official services.' })}>Post Task</GreenButton></div></Modal>;
}

function GovAnalytics() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1><p className="mt-1 text-slate-500">System-wide performance statistics - last 30 days</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-4"><StatCard label="Total Incidents (30d)" value="1,247" sub="12% vs last period" /><StatCard label="Avg Response Time" value="4.2m" sub="0.3m vs last period" /><StatCard label="Resolution Rate" value="94%" sub="2% vs last period" /><StatCard label="Active Users" value="847" sub="5% vs last period" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><ProgressPanel title="Incidents by Type" rows={[['Medical', 512], ['Road Accident', 298], ['Fire', 187], ['Flood', 150], ['Infrastructure', 62], ['Civil', 38]]} max={1247} /><Card className="p-5"><h2 className="font-bold">Performance by Planning Zone</h2><table className="mt-4 w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th>Zone</th><th>Incidents</th><th>Avg Response</th><th>Vs Target</th></tr></thead><tbody>{[['Jurong / West', 312, '4.1m', 'On target'], ['Central / City', 287, '3.8m', 'On target'], ['North / Woodlands', 198, '5.2m', 'Over target'], ['East / Tampines', 241, '4.6m', 'On target'], ['North-East / Punggol', 209, '4.9m', 'On target']].map((r) => <tr key={r[0]} className="border-t border-slate-100"><td className="py-3">{r[0]}</td><td>{r[1]}</td><td className="font-bold">{r[2]}</td><td className={r[3] === 'Over target' ? 'text-red-600' : 'text-safe'}>{r[3]}</td></tr>)}</tbody></table></Card></div>
      <Card className="mt-6 p-5"><h2 className="font-bold">Incident Volume by Hour (24h average)</h2><div className="mt-8 flex h-36 items-end justify-between border-b border-slate-200">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="w-8 bg-navy-800" style={{ height: `${20 + ((i * 17) % 90)}px` }} />)}</div><p className="mt-3 text-sm text-slate-500">Peak hours: 17:00-21:00. Lowest: 02:00-05:00.</p></Card>
    </section>
  );
}

function GovThresholds() {
  const { thresholds, updateThreshold, publishBroadcast, postVolunteerTask } = useData();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section>
      <h1 className="text-3xl font-bold">Alerts / Thresholds</h1>
      <p className="mt-1 text-slate-500">Set health and disaster thresholds, then generate guidance when cases exceed limits.</p>
      <Card className="mt-6 overflow-visible">
        <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1.4fr_48px] border-b border-slate-200 p-4 text-xs font-bold uppercase tracking-wide text-slate-500">
          <div>Threshold</div>
          <div>Current</div>
          <div>Limit</div>
          <div>Status</div>
          <div>AI recommendation</div>
          <div />
        </div>
        <div className="divide-y divide-slate-100">
          {thresholds.map((alert) => (
            <div key={alert.id} className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1.4fr_48px] items-center gap-4 p-4">
              <div>
                <div className="font-bold text-slate-950">{alert.title}</div>
                <div className="mt-2"><ProgressBar value={alert.current} max={Math.max(alert.current, alert.threshold)} tone={alert.status === 'Critical' ? 'bg-critical' : alert.status === 'Warning' ? 'bg-warning' : 'bg-safe'} /></div>
              </div>
              <div className="text-2xl font-medium text-slate-800">{alert.current}{alert.unit}</div>
              <div>
                {editingId === alert.id ? (
                  <input
                    type="number"
                    className="w-24 border border-slate-200 p-2"
                    defaultValue={alert.threshold}
                    onBlur={(event) => {
                      updateThreshold(alert.id, Number(event.target.value));
                      setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="font-medium text-slate-700">{alert.threshold}{alert.unit}</span>
                )}
              </div>
              <Badge>{alert.status}</Badge>
              <div className="text-sm leading-6 text-slate-600">{alert.recommendation}</div>
              <div className="relative flex justify-end">
                <button onClick={() => setOpenMenu(openMenu === alert.id ? null : alert.id)} className="grid h-9 w-9 place-items-center border border-slate-200 bg-white hover:bg-slate-50" aria-label={`Open actions for ${alert.title}`}>
                  <MoreVertical size={17} />
                </button>
                {openMenu === alert.id && (
                  <div className="absolute right-0 top-10 z-20 w-48 border border-slate-200 bg-white shadow-soft">
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setEditingId(alert.id); setOpenMenu(null); }}><Edit size={14} /> Edit</button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { publishBroadcast({ title: `Advisory: ${alert.title}`, message: alert.recommendation, audience: 'all', severity: 'NOTICE' }); setOpenMenu(null); }}><Megaphone size={14} /> Generate broadcast</button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { postVolunteerTask({ title: alert.recommendation, organisation: 'Singapore Red Cross', location: 'Affected zones', time: 'Today', urgency: alert.status === 'Critical' ? 'Critical' : 'High', skills: ['Rapid response'], slotsTotal: 20, description: alert.recommendation }); setOpenMenu(null); }}><Plus size={14} /> Create task</button>
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

  const startDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY, left: mapRef.current.scrollLeft, top: mapRef.current.scrollTop };
    setDragging(true);
  };
  const moveDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !mapRef.current) return;
    mapRef.current.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
    mapRef.current.scrollTop = dragRef.current.top - (event.clientY - dragRef.current.y);
  };
  const stopDrag = () => {
    dragRef.current.active = false;
    setDragging(false);
  };

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Incident & Resource Map</h1>
          <p className="mt-1 text-slate-500">Incidents · Hospitals · Volunteer Group Activities</p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton><RefreshCw size={15} className="inline" /> Refresh</PrimaryButton>
          <EmptyButton><Maximize2 size={15} className="inline" /> Fullscreen</EmptyButton>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <Filter size={16} className="text-slate-500" />
        <span className="font-semibold text-slate-700">Show:</span>
        {['All', 'Incidents (16)', 'Hospitals (6)', 'Volunteer Groups (6)'].map((item) => <button key={item} onClick={() => setShow(item)} className={`border px-4 py-2 font-semibold ${show === item ? 'border-navy-950 bg-navy-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item}</button>)}
        <span className="ml-2 font-semibold text-slate-700">Severity:</span>
        {['All', 'Critical', 'High', 'Medium'].map((item) => <button key={item} onClick={() => setSeverity(item)} className={`px-3 py-2 ${severity === item ? 'border border-navy-950 bg-white text-slate-950' : 'text-slate-500'}`}>{item}</button>)}
      </div>
      <div className="relative mt-5 h-[650px] overflow-hidden border border-slate-300 bg-slate-100">
        <div ref={mapRef} className={`h-full w-full overflow-auto ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={startDrag} onMouseMove={moveDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
          <div className="relative min-h-[820px] min-w-[1280px] select-none">
            <img src="/singapore-map.png" alt="Singapore map" className="absolute inset-0 h-full w-full object-cover opacity-75" draggable={false} />
            <div className="absolute inset-0 bg-blue-50/25" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
            {markers.map((marker, index) => {
              const Icon = marker.icon;
              const isCluster = Boolean(marker.value);
              return <button key={`${marker.type}-${index}`} className={`absolute grid place-items-center rounded-full shadow-soft ${isCluster ? `h-10 w-10 ${marker.color}` : `h-9 w-9 border-2 ${marker.color}`}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} title={marker.type}><Icon size={isCluster ? 14 : 17} />{marker.value && <span className="text-[10px] font-bold leading-none">{marker.value}</span>}</button>;
            })}
          </div>
        </div>
        <Card className="absolute left-4 top-4 p-4"><div className="text-xs font-bold uppercase text-slate-500">Active Volunteer Groups</div><div className="mt-2 text-sm font-bold"><span className="text-red-600">2 Critical</span> <span className="text-orange-600">3 Urgent</span> <span className="text-safe">1 Needed</span></div><div className="mt-1 text-xs text-slate-500">187 volunteers deployed</div></Card>
        <Card className="absolute bottom-6 left-4 p-4 text-sm"><div className="mb-3 flex items-center gap-2 font-bold"><Layers size={16} /> Legend</div><LegendItem icon={<HeartPulse size={14} />} label="Medical" color="text-critical" /><LegendItem icon={<Flame size={14} />} label="Fire" color="text-orange-500" /><LegendItem icon={<Waves size={14} />} label="Flood" color="text-blue-500" /><LegendItem icon={<Car size={14} />} label="Road" color="text-warning" /><LegendItem icon={<Building2 size={14} />} label="Infrastructure" color="text-purple-500" /><div className="mt-3 text-xs font-bold uppercase text-slate-500">Other</div><LegendItem icon={<Activity size={14} />} label="Hospital" color="text-safe" /><LegendItem icon={<Users size={14} />} label="Volunteer Group" color="text-safe" /><LegendItem icon={<Users size={14} />} label="Urgent Group" color="text-warning" /><LegendItem icon={<Users size={14} />} label="Critical Group" color="text-critical" /></Card>
        <div className="absolute right-4 top-4 grid gap-2">{[ZoomIn, ZoomOut, Navigation].map((Icon, index) => <button key={index} className="grid h-10 w-10 place-items-center border border-slate-200 bg-white shadow-soft"><Icon size={18} /></button>)}</div>
        <div className="absolute bottom-6 right-4 border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">Zoom 12</div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-5"><h2 className="font-bold">Map Detail Features</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><Info label="Active incident markers" value="16" /><Info label="Hospitals visible" value="6" /><Info label="Volunteer groups" value="6" /></div><p className="mt-4 text-sm text-slate-500">Drag the map surface to pan on smaller screens. Filters above the map can be used to switch between incidents, hospitals, and volunteer group activities.</p></Card>
        <Card className="p-5"><h2 className="font-bold">Area incidents</h2><div className="mt-4 space-y-3">{incidents.map((incident) => <div key={incident.id} className="border border-slate-200 p-3"><strong>{incident.title}</strong><div className="mt-1"><Badge>{incident.severity}</Badge> <Badge>{incident.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{incident.location}</p></div>)}</div></Card>
      </div>
    </section>
  );
}

function GovIncidents() {
  const { incidents } = useData();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Critical', 'High', 'Medium', 'Low', 'Open', 'Triage', 'Dispatched', 'In Progress', 'Resolved', 'Public', 'Private'];
  const filtered = filter === 'All'
    ? incidents
    : incidents.filter((incident) => incident.severity === filter || incident.status === filter || incident.publicVisibility === filter || incident.type === filter);

  return (
    <section>
      <h1 className="text-3xl font-bold">National Incidents</h1>
      <p className="mt-1 text-slate-500">Filter by incident badges to scan national tickets quickly.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${filter === item ? 'border-navy-950 bg-navy-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {filtered.map((incident) => (
          <Card key={incident.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{incident.id}</div>
                <h2 className="mt-1 text-base font-bold leading-6 text-slate-950">{incident.title}</h2>
              </div>
              <Badge>{incident.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{incident.severity}</Badge>
              <Badge>{incident.type}</Badge>
              <Badge>{incident.publicVisibility}</Badge>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{incident.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Location" value={incident.location} />
              <Info label="Created" value={incident.createdAt} />
              <Info label="Assigned" value={incident.assignedOrganisations.join(', ').toUpperCase()} />
              <Info label="Responding" value={`${incident.unitsResponded} units · ${incident.volunteersResponded} volunteers`} />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function GovSettings() {
  return <section><h1 className="text-3xl font-bold">Settings</h1><Card className="mt-6 p-5"><h2 className="font-bold">Command profile</h2><p className="mt-2 text-slate-500">Raj Kumar · gov_admin · OneTogether Command</p></Card></section>;
}

function ProgressPanel({ title, rows, max }: { title: string; rows: [string, number][]; max: number }) {
  const colors = ['bg-critical', 'bg-warning', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-navy-950'];
  return <Card className="p-5"><h2 className="font-bold">{title}</h2><div className="mt-4 space-y-3">{rows.map(([label, value], i) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><strong>{value} <span className="text-slate-400">({Math.round((value / max) * 100)}%)</span></strong></div><ProgressBar value={value} max={max} tone={colors[i]} /></div>)}</div></Card>;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-2 text-xl font-bold">{value}</div><div className={`mx-auto h-16 w-full ${color}`} /><div className="mt-2 text-xs text-slate-500">{label}</div></div>;
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return <div className="bg-slate-50 p-3"><div className="text-2xl font-bold">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}

