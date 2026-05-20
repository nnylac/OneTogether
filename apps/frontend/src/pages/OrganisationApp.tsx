import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { Badge, Card, EmptyButton, GreenButton, PrimaryButton, ProgressBar, StatCard } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Incident } from '../types';

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
  const { incidents, broadcasts, notifications, organisations } = useData();
  const assigned = incidents.filter((incident) => incident.assignedOrganisations.includes('scdf') || incident.createdBy === 'scdf');
  const resources = organisations.reduce((sum, org) => sum + org.volunteersAvailable, 0);
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-950">SCDF Operations Dashboard</h1>
      <p className="mt-1 text-slate-500">Shared incident tickets from source systems and partner organisations.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <StatCard label="Active assigned" value={assigned.filter((i) => i.status !== 'Resolved').length} sub="visible to SCDF" />
        <StatCard label="New source tickets" value={2} sub="from dispatch feeds" tone="orange" />
        <StatCard label="Awaiting assignment" value={incidents.filter((i) => i.assignedOrganisations.length === 1).length} sub="triage queue" />
        <StatCard label="Public alerts created" value={broadcasts.length} sub="last 24 hours" tone="green" />
        <StatCard label="Responders/resources" value={resources} sub="available partners" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="font-bold">Assigned Incident Tickets</h2>
          <div className="mt-4 space-y-3">{assigned.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Notifications</h2>
          <div className="mt-4 space-y-4">{notifications.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3 text-sm"><div className="font-semibold">{item.text}</div><div className="text-xs text-slate-500">{item.time}</div></div>)}</div>
        </Card>
      </div>
    </section>
  );
}

function OrgIncidents() {
  const { incidents, makeIncidentPublic, assignIncident, updateIncidentStatus, requestVolunteers, resolveIncident } = useData();
  const visible = incidents.filter((incident) => incident.createdBy === 'scdf' || incident.assignedOrganisations.includes('scdf'));
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-950">Incident Tickets</h1>
      <p className="mt-1 text-slate-500">Before assignment, tickets are visible only to their creator organisation. Assigned tickets appear for partner responders.</p>
      <div className="mt-6 space-y-5">
        {visible.map((incident) => (
          <Card key={incident.id} className="p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-950">{incident.title}</h2><Badge>{incident.severity}</Badge><Badge>{incident.status}</Badge><Badge>{incident.publicVisibility}</Badge></div>
                <div className="mt-2 text-sm text-slate-500">{incident.id} · {incident.type} · Created by {incident.createdBy.toUpperCase()} · {incident.createdAt}</div>
                <p className="mt-4 text-slate-700">{incident.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label="Location" value={incident.location} />
                  <Info label="Assigned organisations" value={incident.assignedOrganisations.join(', ').toUpperCase()} />
                  <Info label="Units / volunteers" value={`${incident.unitsResponded} units, ${incident.volunteersResponded} volunteers`} />
                  <Info label="Volunteer support" value={incident.volunteerSupportNeeded ? 'Needed' : 'Not requested'} />
                </div>
                <h3 className="mt-5 font-bold">Responding Organisations</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-2">{incident.respondingOrganisations.map((org) => <div key={org.organisation} className="border border-slate-200 p-3 text-sm"><strong>{org.organisation}</strong><br /><span className="text-slate-500">{org.status}</span></div>)}</div>
                <h3 className="mt-5 font-bold">Timeline</h3>
                <div className="mt-2 space-y-2">{incident.timeline.map((item, index) => <div key={index} className="border-l-2 border-navy-950 pl-3 text-sm"><strong>{item.time} · {item.organisation}</strong><br />{item.text}</div>)}</div>
              </div>
              <div className="space-y-3">
                <ProgressBar value={['Open', 'Triage', 'Dispatched', 'In Progress', 'Resolved'].indexOf(incident.status) + 1} max={5} tone="bg-navy-950" />
                <select onChange={(event) => assignIncident(incident.id, event.target.value)} className="w-full border border-slate-200 p-2" defaultValue="">
                  <option value="" disabled>Assign organisation</option>
                  <option value="sgh">Hospital</option>
                  <option value="redcross">Singapore Red Cross</option>
                  <option value="spf">SPF</option>
                </select>
                <select onChange={(event) => updateIncidentStatus(incident.id, event.target.value as Incident['status'])} className="w-full border border-slate-200 p-2" defaultValue={incident.status}>
                  {['Open', 'Triage', 'Dispatched', 'In Progress', 'Resolved'].map((status) => <option key={status}>{status}</option>)}
                </select>
                <EmptyButton className="w-full" onClick={() => updateIncidentStatus(incident.id, incident.status)}>Add timeline update</EmptyButton>
                <PrimaryButton className="w-full" onClick={() => makeIncidentPublic(incident.id)}>Make public</PrimaryButton>
                <GreenButton className="w-full" onClick={() => requestVolunteers(incident.id)}>Request volunteers</GreenButton>
                <button className="w-full bg-critical px-3 py-2 text-sm font-semibold text-white" onClick={() => resolveIncident(incident.id)}>Resolve ticket</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function OrgMap() {
  const { incidents } = useData();
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-950">Incident Map</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="map-grid relative h-[560px] overflow-hidden bg-blue-50">
          {['Central 5', 'West 3', 'East 2', 'North 2'].map((label, index) => <button key={label} className="absolute bg-navy-950 px-4 py-2 font-bold text-white shadow-soft" style={{ left: `${18 + index * 18}%`, top: `${25 + (index % 2) * 26}%` }}>{label}</button>)}
        </Card>
        <Card className="p-5"><h2 className="font-bold">Filtered incidents</h2><div className="mt-4 space-y-3">{incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div></Card>
      </div>
    </section>
  );
}

function OrgResources() {
  const { hospitals, organisations } = useData();
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-950">Resources</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5"><h2 className="font-bold">Hospital capacities</h2><div className="mt-4 space-y-3">{hospitals.slice(0, 4).map((h) => <div key={h.id}><div className="flex justify-between text-sm"><span>{h.name}</span><strong>{h.availableBeds}/{h.totalBeds}</strong></div><ProgressBar value={h.availableBeds} max={h.totalBeds} tone="bg-warning" /></div>)}</div></Card>
        <Card className="p-5"><h2 className="font-bold">Volunteer organisations</h2><div className="mt-4 space-y-3">{organisations.filter((o) => o.type !== 'Healthcare').map((o) => <div key={o.id} className="border-b border-slate-100 pb-2 text-sm"><strong>{o.name}</strong><br />{o.volunteersAvailable}/{o.volunteersTotal} available</div>)}</div></Card>
        <Card className="p-5"><h2 className="font-bold">Equipment</h2><div className="mt-4 space-y-3 text-sm"><Info label="Ambulances" value="42 available" /><Info label="Flood pumps" value="18 available" /><Info label="Relief kits" value="1,840 ready" /></div></Card>
      </div>
    </section>
  );
}

function OrgNotifications() {
  const { notifications } = useData();
  return <section><h1 className="text-3xl font-bold">Notifications</h1><div className="mt-6 space-y-3">{notifications.map((item) => <Card key={item.id} className="p-4"><strong>{item.text}</strong><div className="text-sm text-slate-500">{item.time}</div></Card>)}</div></section>;
}

function OrgSettings() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card className="mt-6 p-5">
        <h2 className="font-bold">Auto-publication rules</h2>
        <div className="mt-4 space-y-4">
          {['Cardiac Arrest', 'Flood', 'Major Fire', 'Minor Injury'].map((item, index) => (
            <label key={item} className="flex items-center justify-between border border-slate-200 p-3"><span>{item}</span><input type="checkbox" defaultChecked={index < 3} /></label>
          ))}
        </div>
      </Card>
    </section>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  return <div className="border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><strong>{incident.title}</strong><Badge>{incident.status}</Badge></div><div className="mt-1 text-sm text-slate-500">{incident.location} · {incident.type} · {incident.severity}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="bg-slate-50 p-3 text-sm"><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-semibold text-slate-900">{value}</div></div>;
}
