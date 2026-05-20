import { Edit, Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { AIAssistantBox, AlertBanner, Badge, Card, EmptyButton, Field, GreenButton, Modal, PrimaryButton, ProgressBar, StatCard } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Audience, Broadcast, Hospital, VolunteerTask } from '../types';

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
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-950">Command Dashboard</h1>
      <p className="mt-1 text-slate-500">Real-time national emergency overview</p>
      <div className="mt-6 space-y-3">
        {thresholds.filter((t) => t.status !== 'Normal').slice(0, 3).map((alert) => <AlertBanner key={alert.id} status={alert.status === 'Critical' ? 'Critical' : 'Warning'} title={`${alert.status.toUpperCase()}: ${alert.title.replace(' threshold', '')}`} detail={`Current: ${alert.current}${alert.unit ?? ''} — threshold: ${alert.threshold}${alert.unit ?? ''}`} action={<button className="bg-warning px-3 py-2 text-sm font-bold text-white">AI Suggestion</button>} />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <StatCard label="Total Incidents" value={17} sub={`${active} active, 13 open`} tone="orange" />
        <StatCard label="Critical Cases" value={10} sub="severity level 1, needs attention" tone="red" />
        <StatCard label="Hospital Capacity" value={availableBeds} sub={`${occupancy}% occupancy, ${totalBeds} total beds`} tone="red" />
        <StatCard label="Resolved Today" value={4} sub="of 17 total, 24% resolution rate" tone="green" />
        <StatCard label="Avg Response Time" value="4.2m" sub="within SLA" />
        <StatCard label="Available Volunteers" value={20} sub="of 20 registered" tone="green" />
        <StatCard label="Recent Broadcasts" value={broadcasts.length} sub="last 24 hours" />
        <StatCard label="Agencies Active" value={organisations.length} sub="SCDF, SPF, MOH..." />
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

function GovBroadcasts() {
  const { broadcasts, publishBroadcast } = useData();
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
      <Card className="mt-6"><div className="flex items-center justify-between border-b border-slate-200 p-4"><h2 className="font-bold">All Broadcasts</h2><button className="text-sm text-safe">Refresh</button></div>{broadcasts.map((b) => <div key={b.id} className="flex items-center gap-4 border-b border-slate-100 p-4"><div className="flex-1"><div className="flex items-center gap-2"><strong>{b.title}</strong><Badge>{b.audience}</Badge>{b.zone && <Badge>{b.zone}</Badge>}</div><p className="mt-1 line-clamp-1 text-sm text-slate-500">{b.message}</p><div className="mt-2 text-xs text-slate-500">{b.issuer} · {b.timestamp}</div></div><Trash2 size={16} className="text-slate-400" /></div>)}</Card>
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
      {tab === 'orgs' && <Card className="p-5">{['Government', 'Healthcare', 'NGO', 'Grassroots'].map((type) => <div key={type} className="mb-5"><Badge>{type}</Badge><span className="ml-2 text-sm text-slate-500">{organisations.filter((o) => o.type === type).length} organisation</span><div className="mt-2 space-y-2">{organisations.filter((o) => o.type === type).map((org) => <div key={org.id} className="flex items-center justify-between border border-slate-200 p-3"><div><strong>{org.name}</strong> <Badge>{org.type}</Badge><div className="text-sm text-slate-500">{org.address}</div></div><div className="text-right text-sm"><strong>{org.volunteersAvailable}/{org.volunteersTotal}</strong><br />{org.activeTasks} tasks · {org.status}</div></div>)}</div></div>)}</Card>}
      {tab === 'hospitals' && <div className="space-y-4 p-5 bg-white border border-slate-200">{hospitals.map((h) => <Card key={h.id} className="p-4"><div className="flex justify-between"><div><strong>{h.name}</strong><div className="text-sm text-slate-500">{h.address}</div></div><div className="flex gap-2"><Badge>{h.status}</Badge><EmptyButton onClick={() => setEditing(h)}><Edit size={14} className="inline" /> Edit</EmptyButton></div></div><div className="mt-4 grid grid-cols-3 gap-3 text-center"><Mini label="Available Beds" value={`${h.availableBeds}/${h.totalBeds}`} /><Mini label="ICU Available" value={h.icuAvailable} /><Mini label="Trauma Bays" value={h.traumaBays} /></div><div className="mt-3"><ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" /></div><div className="mt-1 text-right text-xs text-slate-500">{Math.round((h.availableBeds / h.totalBeds) * 100)}% capacity available · updated {h.updatedAt}</div></Card>)}</div>}
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
  return <section><h1 className="text-3xl font-bold">Alerts / Thresholds</h1><p className="mt-1 text-slate-500">Set health and disaster thresholds, then generate guidance when cases exceed limits.</p><div className="mt-6 grid gap-4 lg:grid-cols-2">{thresholds.map((alert) => <Card key={alert.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold">{alert.title}</h2><div className="mt-2 text-3xl font-bold">{alert.current}{alert.unit}</div><div className="text-sm text-slate-500">Threshold: {alert.threshold}{alert.unit}</div></div><Badge>{alert.status}</Badge></div><div className="mt-4"><ProgressBar value={alert.current} max={Math.max(alert.current, alert.threshold)} tone={alert.status === 'Critical' ? 'bg-critical' : alert.status === 'Warning' ? 'bg-warning' : 'bg-safe'} /></div><div className="mt-4 grid grid-cols-[1fr_auto] gap-3"><input type="number" className="border border-slate-200 p-2" defaultValue={alert.threshold} onBlur={(e) => updateThreshold(alert.id, Number(e.target.value))} /><EmptyButton>Edit threshold</EmptyButton></div><div className="mt-4"><AIAssistantBox text={alert.recommendation} /></div><div className="mt-4 grid grid-cols-2 gap-3"><PrimaryButton onClick={() => publishBroadcast({ title: `Advisory: ${alert.title}`, message: alert.recommendation, audience: 'all', severity: 'NOTICE' })}>Generate broadcast</PrimaryButton><GreenButton onClick={() => postVolunteerTask({ title: alert.recommendation, organisation: 'Singapore Red Cross', location: 'Affected zones', time: 'Today', urgency: alert.status === 'Critical' ? 'Critical' : 'High', skills: ['Rapid response'], slotsTotal: 20, description: alert.recommendation })}>Create task</GreenButton></div></Card>)}</div></section>;
}

function GovMap() {
  const { incidents } = useData();
  return <section><h1 className="text-3xl font-bold">Live Map</h1><div className="mt-4 flex gap-2">{['All types', 'Critical', 'Open', 'Dispatched'].map((f) => <Badge key={f}>{f}</Badge>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]"><Card className="map-grid relative h-[620px] bg-blue-50">{['Central 5', 'West 3', 'East 2', 'North 2', 'North-East 1'].map((label, i) => <button key={label} className="absolute bg-navy-950 px-4 py-2 font-bold text-white" style={{ left: `${12 + i * 15}%`, top: `${22 + (i % 3) * 18}%` }}>{label}</button>)}</Card><Card className="p-5"><h2 className="font-bold">Area incidents</h2><div className="mt-4 space-y-3">{incidents.map((i) => <div key={i.id} className="border border-slate-200 p-3"><strong>{i.title}</strong><div className="mt-1"><Badge>{i.severity}</Badge> <Badge>{i.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{i.location}</p></div>)}</div></Card></div></section>;
}

function GovIncidents() {
  const { incidents } = useData();
  return <section><h1 className="text-3xl font-bold">National Incidents</h1><div className="mt-6 space-y-3">{incidents.map((i) => <Card key={i.id} className="p-4"><div className="flex justify-between"><div><strong>{i.title}</strong><div className="text-sm text-slate-500">{i.id} · {i.location}</div></div><div className="flex gap-2"><Badge>{i.severity}</Badge><Badge>{i.status}</Badge></div></div></Card>)}</div></section>;
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
