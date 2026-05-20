import { Activity, Building2, Car, Filter, Flame, Grid2X2, HeartPulse, Layers, List, Maximize2, Navigation, RefreshCw, Users, Waves, ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts';
import { Badge, Card, EmptyButton, GreenButton, PrimaryButton, ProgressBar, StatCard } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Incident } from '../types';

const statusOrder: Incident['status'][] = ['Open', 'Triage', 'Dispatched', 'In Progress', 'Resolved'];

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
  const assigned = incidents.filter((incident) => incident.assignedOrganisations.includes('scdf') || incident.createdBy === 'scdf');
  const resources = organisations.reduce((sum, org) => sum + org.volunteersAvailable, 0);
  const volunteerTotal = organisations.reduce((sum, org) => sum + org.volunteersTotal, 0);
  const availableBeds = hospitals.reduce((sum, hospital) => sum + hospital.availableBeds, 0);
  const totalBeds = hospitals.reduce((sum, hospital) => sum + hospital.totalBeds, 0);

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
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Resource Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Operational capacity available to support assigned incidents.</p>
          </div>
          <Badge>Live</Badge>
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div>
            <div className="mb-2 flex justify-between text-sm"><span>Hospital beds available</span><strong>{availableBeds}/{totalBeds}</strong></div>
            <ProgressBar value={availableBeds} max={totalBeds} tone="bg-warning" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm"><span>Volunteer responders</span><strong>{resources}/{volunteerTotal}</strong></div>
            <ProgressBar value={resources} max={volunteerTotal} tone="bg-safe" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Info label="Ambulances" value="42" />
            <Info label="Flood pumps" value="18" />
            <Info label="Relief kits" value="1,840" />
          </div>
        </div>
      </Card>
    </section>
  );
}

function OrgIncidents() {
  const { incidents, makeIncidentPublic, assignIncident, updateIncidentStatus, requestVolunteers, resolveIncident } = useData();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = incidents.filter((incident) => incident.createdBy === 'scdf' || incident.assignedOrganisations.includes('scdf'));
  const actions = { assignIncident, updateIncidentStatus, makeIncidentPublic, requestVolunteers, resolveIncident };

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Incident Tickets</h1>
          <p className="mt-1 text-slate-500">Before assignment, tickets are visible only to their creator organisation. Assigned tickets appear for partner responders.</p>
        </div>
        <div className="flex shrink-0 border border-slate-200 bg-white">
          <button onClick={() => setView('list')} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${view === 'list' ? 'bg-navy-950 text-white' : 'text-slate-600'}`}><List size={16} /> List</button>
          <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold ${view === 'grid' ? 'bg-navy-950 text-white' : 'text-slate-600'}`}><Grid2X2 size={16} /> Grid</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="mt-6 space-y-5">
          {visible.map((incident) => <IncidentDetailCard key={incident.id} incident={incident} {...actions} />)}
        </div>
      ) : (
        <div className="mt-6 grid auto-rows-max gap-5 xl:grid-cols-2">
          {visible.map((incident) => expandedId === incident.id ? (
            <div key={incident.id} className="xl:col-span-2">
              <IncidentDetailCard incident={incident} onCollapse={() => setExpandedId(null)} {...actions} />
            </div>
          ) : (
            <IncidentSummaryCard key={incident.id} incident={incident} onClick={() => setExpandedId(incident.id)} />
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
}

function IncidentDetailCard({ incident, onCollapse, assignIncident, updateIncidentStatus, makeIncidentPublic, requestVolunteers, resolveIncident }: { incident: Incident; onCollapse?: () => void } & IncidentActions) {
  return (
    <Card className="p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{incident.title}</h2>
            <Badge>{incident.severity}</Badge>
            <Badge>{incident.status}</Badge>
            <Badge>{incident.publicVisibility}</Badge>
          </div>
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
          <ProgressBar value={statusOrder.indexOf(incident.status) + 1} max={5} tone="bg-navy-950" />
          <select onChange={(event) => assignIncident(incident.id, event.target.value)} className="w-full border border-slate-200 p-2" defaultValue="">
            <option value="" disabled>Assign organisation</option>
            <option value="sgh">Hospital</option>
            <option value="redcross">Singapore Red Cross</option>
            <option value="spf">SPF</option>
          </select>
          <select onChange={(event) => updateIncidentStatus(incident.id, event.target.value as Incident['status'])} className="w-full border border-slate-200 p-2" defaultValue={incident.status}>
            {statusOrder.map((status) => <option key={status}>{status}</option>)}
          </select>
          <EmptyButton className="w-full" onClick={() => updateIncidentStatus(incident.id, incident.status)}>Add timeline update</EmptyButton>
          <PrimaryButton className="w-full" onClick={() => makeIncidentPublic(incident.id)}>Make public</PrimaryButton>
          <GreenButton className="w-full" onClick={() => requestVolunteers(incident.id)}>Request volunteers</GreenButton>
          <button className="w-full bg-critical px-3 py-2 text-sm font-semibold text-white" onClick={() => resolveIncident(incident.id)}>Resolve ticket</button>
          {onCollapse && <EmptyButton className="w-full" onClick={onCollapse}>Collapse summary</EmptyButton>}
        </div>
      </div>
    </Card>
  );
}

function IncidentSummaryCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block text-left">
      <Card className="h-full p-5 transition hover:border-navy-950 hover:shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{incident.id}</div>
            <h2 className="mt-2 text-lg font-bold leading-6 text-slate-950">{incident.title}</h2>
          </div>
          <Badge>{incident.status}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Badge>{incident.severity}</Badge><Badge>{incident.type}</Badge><Badge>{incident.publicVisibility}</Badge></div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{incident.description}</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><span className="text-slate-500">Progress</span><strong>{statusOrder.indexOf(incident.status) + 1}/5</strong></div>
          <ProgressBar value={statusOrder.indexOf(incident.status) + 1} max={5} tone="bg-navy-950" />
          <Info label="Location" value={incident.location} />
          <Info label="Time" value={incident.createdAt} />
          <Info label="Assigned" value={incident.assignedOrganisations.join(', ').toUpperCase()} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Info label="Units" value={String(incident.unitsResponded)} />
          <Info label="Volunteers" value={String(incident.volunteersResponded)} />
        </div>
        <div className="mt-4 text-sm font-semibold text-safe">Click to expand full ticket →</div>
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
    { x: 32, y: 34, type: 'volunteer', color: 'border-critical text-critical bg-white', icon: Users },
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
    { x: 29, y: 56, type: 'infrastructure', color: 'border-critical text-critical bg-white', icon: Building2 },
    { x: 52, y: 56, type: 'medical', color: 'border-orange-500 text-orange-500 bg-white', icon: HeartPulse },
    { x: 61, y: 56, type: 'volunteer', color: 'border-orange-500 text-orange-500 bg-white', icon: Users },
    { x: 68, y: 56, type: 'fire', color: 'border-critical text-critical bg-white', icon: Flame },
    { x: 73, y: 56, type: 'fire', color: 'border-orange-500 text-orange-500 bg-white', icon: Flame },
    { x: 80, y: 55, type: 'medical', color: 'border-critical text-critical bg-white', icon: HeartPulse },
    { x: 86, y: 55, type: 'road', color: 'border-critical text-critical bg-white', icon: Car },
    { x: 89, y: 54, type: 'hospital', color: 'border-warning text-warning bg-white', icon: Activity },
    { x: 93, y: 56, type: 'medical', color: 'border-orange-500 text-orange-500 bg-white', icon: HeartPulse },
    { x: 38, y: 70, type: 'critical', value: '12', color: 'bg-critical text-white', icon: Users },
    { x: 74, y: 64, type: 'critical', value: '4', color: 'bg-critical text-white', icon: Users },
    { x: 78, y: 30, type: 'group', value: '143', color: 'bg-warning text-white', icon: Users }
  ];

  const startDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      left: mapRef.current.scrollLeft,
      top: mapRef.current.scrollTop
    };
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
        {['All', 'Incidents (16)', 'Hospitals (6)', 'Volunteer Groups (6)'].map((item) => (
          <button key={item} onClick={() => setShow(item)} className={`border px-4 py-2 font-semibold ${show === item ? 'border-navy-950 bg-navy-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item}</button>
        ))}
        <span className="ml-2 font-semibold text-slate-700">Severity:</span>
        {['All', 'Critical', 'High', 'Medium'].map((item) => (
          <button key={item} onClick={() => setSeverity(item)} className={`px-3 py-2 ${severity === item ? 'border border-navy-950 bg-white text-slate-950' : 'text-slate-500'}`}>{item}</button>
        ))}
      </div>

      <div className="relative mt-5 h-[650px] overflow-hidden border border-slate-300 bg-slate-100">
        <div
          ref={mapRef}
          className={`h-full w-full overflow-auto ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <div className="relative min-h-[820px] min-w-[1280px] select-none">
          <img src="/singapore-map.png" alt="Singapore map" className="absolute inset-0 h-full w-full object-cover opacity-75" draggable={false} />
          <div className="absolute inset-0 bg-blue-50/25" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className="absolute left-0 right-0 top-[34%] h-px bg-slate-300" />
          <div className="absolute left-0 right-0 top-[61%] h-px bg-slate-300" />
          <div className="absolute bottom-0 top-0 left-[34%] w-px bg-slate-300" />
          <div className="absolute bottom-0 top-0 left-[68%] w-px bg-slate-300" />

          {markers.map((marker, index) => {
            const Icon = marker.icon;
            const isCluster = Boolean(marker.value);
            return (
              <button
                key={`${marker.type}-${index}`}
                className={`absolute grid place-items-center rounded-full shadow-soft ${isCluster ? `h-10 w-10 ${marker.color}` : `h-9 w-9 border-2 ${marker.color}`}`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                title={marker.type}
              >
                <Icon size={isCluster ? 14 : 17} />
                {marker.value && <span className="text-[10px] font-bold leading-none">{marker.value}</span>}
              </button>
            );
          })}

          </div>
        </div>
        <Card className="pointer-events-auto absolute left-4 top-4 p-4">
          <div className="text-xs font-bold uppercase text-slate-500">Active Volunteer Groups</div>
          <div className="mt-2 text-sm font-bold"><span className="text-red-600">2 Critical</span> <span className="text-orange-600">3 Urgent</span> <span className="text-safe">1 Needed</span></div>
          <div className="mt-1 text-xs text-slate-500">187 volunteers deployed</div>
        </Card>

        <Card className="pointer-events-auto absolute bottom-6 left-4 p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-bold"><Layers size={16} /> Legend</div>
          <div className="text-xs font-bold uppercase text-slate-500">Incidents</div>
          <LegendItem icon={<HeartPulse size={14} />} label="Medical" color="text-critical" />
          <LegendItem icon={<Flame size={14} />} label="Fire" color="text-orange-500" />
          <LegendItem icon={<Waves size={14} />} label="Flood" color="text-blue-500" />
          <LegendItem icon={<Car size={14} />} label="Road" color="text-warning" />
          <LegendItem icon={<Building2 size={14} />} label="Infrastructure" color="text-purple-500" />
          <div className="mt-3 text-xs font-bold uppercase text-slate-500">Other</div>
          <LegendItem icon={<Activity size={14} />} label="Hospital" color="text-safe" />
          <LegendItem icon={<Users size={14} />} label="Volunteer Group" color="text-safe" />
          <LegendItem icon={<Users size={14} />} label="Urgent Group" color="text-warning" />
          <LegendItem icon={<Users size={14} />} label="Critical Group" color="text-critical" />
        </Card>

        <div className="pointer-events-auto absolute right-4 top-4 grid gap-2">
          {[ZoomIn, ZoomOut, Navigation].map((Icon, index) => <button key={index} className="grid h-10 w-10 place-items-center border border-slate-200 bg-white shadow-soft"><Icon size={18} /></button>)}
        </div>
        <div className="pointer-events-auto absolute bottom-6 right-4 border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">Zoom 12</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="font-bold">Map Detail Features</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Info label="Active incident markers" value="16" />
            <Info label="Hospitals visible" value="6" />
            <Info label="Volunteer groups" value="6" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Drag the map surface to pan on smaller screens. Filters above the map can be used to switch between incidents, hospitals, and volunteer group activities.</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Filtered incidents</h2>
          <div className="mt-4 space-y-3">{incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div>
        </Card>
      </div>
    </section>
  );
}

function LegendItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return <div className="mt-2 flex items-center gap-2"><span className={color}>{icon}</span><span>{label}</span></div>;
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
