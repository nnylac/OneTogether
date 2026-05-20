import { BookOpen, Building2, CheckCircle2, Clock, Heart, MapPin, Megaphone, Phone, Shield, Siren, X } from 'lucide-react';
import { useState } from 'react';
import { MobileShell } from '../components/layouts';
import { AlertBanner, Badge, Card, Field, GreenButton, Modal, ProgressBar } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Broadcast, CommunityProgramme, VolunteerTask } from '../types';

const broadcastEmoji: Record<string, string> = {
  Waves: '🌊',
  Radio: '📣',
  ShieldAlert: '⚠️',
  Train: '🚆',
  HeartPulse: '💗',
  Megaphone: '📣'
};

const severityStyles = {
  CRITICAL: { rail: 'bg-critical', pill: 'bg-critical text-white', icon: 'text-blue-500' },
  NOTICE: { rail: 'bg-navy-950', pill: 'bg-navy-950 text-white', icon: 'text-pink-500' },
  INFO: { rail: 'bg-safe', pill: 'bg-safe text-white', icon: 'text-emerald-600' }
};

export function CitizenApp() {
  const { publicAlerts, volunteerTasks } = useData();
  const [tab, setTab] = useState('alerts');
  return (
    <MobileShell tab={tab} setTab={setTab} alertCount={publicAlerts.length} volunteerCount={volunteerTasks.length}>
      {tab === 'alerts' && <CitizenAlerts />}
      {tab === 'communities' && <CitizenCommunities />}
      {tab === 'volunteer' && <CitizenVolunteer />}
      {tab === 'contact' && <CitizenContact />}
    </MobileShell>
  );
}

function CitizenAlerts() {
  const { publicAlerts } = useData();
  const [selected, setSelected] = useState<Broadcast | null>(null);
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><span className="mr-2">📣</span>Official Broadcasts</h1>
        <span className="text-xs font-medium text-slate-500">Tap to view full advisory</span>
      </div>
      <div className="mt-4 space-y-4">
        {publicAlerts.map((broadcast) => {
          const emoji = broadcastEmoji[broadcast.icon] ?? '📣';
          const styles = severityStyles[broadcast.severity];
          return (
            <Card key={broadcast.id} className="relative overflow-hidden p-4 pl-5">
              <div className={`absolute inset-y-0 left-0 w-1.5 ${styles.rail}`} />
              <div className="flex gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center text-3xl ${styles.icon}`}>{emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold leading-tight text-slate-950">{broadcast.title}</h2>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.pill}`}>{broadcast.severity}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{broadcast.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">{broadcast.issuer} · {broadcast.timestamp}</div>
                    <button onClick={() => setSelected(broadcast)} className="shrink-0 text-sm font-bold text-safe">View advisory →</button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {selected && <AdvisoryModal broadcast={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function AdvisoryModal({ broadcast, onClose }: { broadcast: Broadcast; onClose: () => void }) {
  const instructions = [
    ['Move to higher ground immediately', 'If you are in a low-lying area, move to a higher floor or higher terrain right now. Do not wait for water to enter your home.'],
    ['Do NOT enter floodwater', 'Just 15 cm of moving water can knock an adult off their feet. 30 cm can sweep a vehicle away. Stay out of floodwater.'],
    ['Avoid underpasses, canals and low-lying roads', 'Underpasses can fill within seconds. Do not attempt to drive or walk through submerged roads.'],
    ['Switch off electricity at the mains', 'If water is entering your home, turn off the electrical mains switch immediately to prevent electrocution risk.'],
    ['Move valuables and medications to higher shelves', 'If you have time and it is safe, move important documents, medications, and electronics to a higher level.'],
    ['Call 995 if trapped or in danger', 'If you are trapped or someone is in immediate danger, call SCDF at 995. Stay on the line and follow operator instructions.'],
    ['Follow official evacuation orders immediately', 'If authorities order evacuation, leave at once. Bring your IC, phone, charger, and medications. Do not delay.']
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-auto bg-white shadow-soft">
        <div className="relative bg-navy-950 p-5 pr-12 text-white">
          <button className="absolute right-4 top-5 text-blue-100 hover:text-white" onClick={onClose} aria-label="Close advisory"><X size={26} /></button>
          <div className="flex items-center gap-3">
            <span className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wide bg-critical text-white">Critical Alert</span>
            <span className="text-xs font-bold uppercase tracking-wide text-blue-200">Zone</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold">{broadcast.title}</h2>
          <p className="mt-2 text-sm text-blue-100">Issued by <strong className="text-white">{broadcast.issuer}</strong> · {broadcast.timestamp}</p>
        </div>
        <div className="space-y-6 p-5">
          <div className="border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-slate-600">
            Flash floods can rise rapidly and be life-threatening. Act immediately and follow all official instructions.
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><CheckCircle2 size={18} className="text-safe" />What you should do</h3>
            <div className="mt-5 space-y-5">
              {instructions.map(([title, detail], index) => (
                <div key={title} className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-950 text-sm font-bold text-white">{index + 1}</div>
                  <div>
                    <div className="font-bold leading-snug text-slate-950">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"><span className="mr-2 text-critical">×</span>Do not do these</h3>
            <div className="mt-4 border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-700">
              <p>× Do NOT drive through flooded roads — your vehicle can be swept away in seconds.</p>
              <p className="mt-2">× Do NOT touch electrical equipment in wet or flooded areas.</p>
              <p className="mt-2">× Do NOT spread unverified updates or return to evacuated areas until agencies say it is safe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CitizenCommunities() {
  const { communityProgrammes, registerProgramme } = useData();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<CommunityProgramme | null>(null);
  const programmes = filter === 'All' ? communityProgrammes : communityProgrammes.filter((item) => item.category === filter);
  const filterIcons = {
    All: null,
    Preparedness: Shield,
    Relief: Heart,
    Training: BookOpen,
    Awareness: Megaphone
  };
  const categoryStyle = {
    Preparedness: 'bg-blue-50 text-blue-700',
    Relief: 'bg-red-50 text-red-700',
    Training: 'bg-emerald-50 text-emerald-700',
    Awareness: 'bg-orange-50 text-orange-700'
  };
  const organisationStyle: Record<string, string> = {
    'Jurong West RC': 'bg-emerald-50 text-emerald-700',
    'Singapore Red Cross': 'bg-orange-50 text-orange-700',
    'St John Ambulance Brigade': 'bg-blue-50 text-blue-700',
    "People's Association": 'bg-purple-50 text-purple-700'
  };
  return (
    <section>
      <div className="border border-navy-950 bg-navy-950 p-5 text-white">
        <h1 className="text-base font-bold">Community Resilience Hub</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-blue-100">Volunteer, train, and support relief activities organised by community groups and agencies near you.</p>
      </div>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
        {(['All', 'Preparedness', 'Relief', 'Training', 'Awareness'] as const).map((chip) => {
          const Icon = filterIcons[chip];
          return (
            <button key={chip} onClick={() => setFilter(chip)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${filter === chip ? 'border-navy-950 bg-navy-950 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
              {Icon && <Icon size={16} />}
              {chip}
            </button>
          );
        })}
      </div>
      <div className="mt-6 space-y-4">
        {programmes.map((programme) => (
          <Card key={programme.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-6 text-slate-950">{programme.title}</h2>
                <span className={`mt-3 inline-flex rounded px-2.5 py-1 text-sm font-bold ${organisationStyle[programme.organisation] ?? 'bg-slate-100 text-slate-700'}`}>{programme.organisation}</span>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-1 text-sm font-bold ${categoryStyle[programme.category]}`}>
                {programme.category === 'Preparedness' && <Shield size={15} />}
                {programme.category === 'Relief' && <Heart size={15} />}
                {programme.category === 'Training' && <BookOpen size={15} />}
                {programme.category === 'Awareness' && <Megaphone size={15} />}
                {programme.category}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-500">
              <div className="flex items-start gap-2"><MapPin className="mt-1 shrink-0 text-slate-400" size={16} /><span>{programme.location}</span></div>
              <div className="flex items-start gap-2"><Clock className="mt-1 shrink-0 text-slate-400" size={16} /><span>{programme.time}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{programme.tags.map((tag) => <span key={tag} className="rounded bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>)}</div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-500">{programme.registered}/{programme.capacity} registered</span>
              <span className="font-bold text-safe">{programme.capacity - programme.registered} spots left</span>
            </div>
            <div className="mt-2"><ProgressBar value={programme.registered} max={programme.capacity} tone="bg-safe" /></div>
            <button onClick={() => setSelected(programme)} className="mt-4 text-sm font-medium text-safe">Tap to view & register →</button>
          </Card>
        ))}
      </div>
      {selected && <ProgrammeModal programme={selected} onClose={() => setSelected(null)} onConfirm={() => { registerProgramme(selected.id); setSelected(null); }} />}
    </section>
  );
}

function ProgrammeModal({ programme, onClose, onConfirm }: { programme: CommunityProgramme; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title={programme.title} onClose={onClose} width="max-w-md">
      <div className="space-y-4 p-5">
        <p className="text-sm text-slate-600">{programme.description}</p>
        <div className="text-sm text-slate-600">{programme.location}<br />{programme.time}<br />Contact: {programme.contact}</div>
        <Field label="Full Name"><input className="w-full border border-slate-200 p-3" placeholder="Your full name" /></Field>
        <Field label="Mobile Number"><input className="w-full border border-slate-200 p-3" placeholder="+65 9123 4567" /></Field>
        <Field label="Email"><input className="w-full border border-slate-200 p-3" placeholder="you@example.com" /></Field>
        <GreenButton className="w-full py-3" onClick={onConfirm}>Confirm Registration</GreenButton>
      </div>
    </Modal>
  );
}

function CitizenVolunteer() {
  const { volunteerTasks, signUpTask } = useData();
  const [selected, setSelected] = useState<VolunteerTask | null>(null);
  return (
    <section>
      <div className="bg-safe p-5 text-white">
        <h1 className="text-base font-bold">Be part of the response</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-emerald-50">Sign up for a specific task below, or register your skills for future deployment.</p>
        <button className="mt-4 bg-white px-4 py-2 text-sm font-bold text-safe">Register as Volunteer →</button>
      </div>
      <h2 className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Siren size={17} /> 🚨 Urgently Needed</h2>
      <div className="mt-4 space-y-4">
        {volunteerTasks.map((task) => (
          <Card key={task.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold leading-6 text-slate-950">{task.title}</h2>
              <span className={`shrink-0 rounded border px-3 py-1 text-xs font-bold uppercase tracking-wide ${task.urgency === 'Critical' ? 'border-red-300 bg-red-50 text-red-700' : 'border-orange-300 bg-orange-50 text-orange-700'}`}>{task.urgency === 'High' ? 'Urgent' : task.urgency}</span>
            </div>
            <div className="mb-2 mt-3 flex items-center gap-2 text-sm text-slate-500"><Building2 size={16} className="text-safe" /><span>{task.organisation}</span></div>
            <div className="space-y-2 text-sm leading-6 text-slate-500">
              <div className="flex items-start gap-2"><MapPin className="mt-1 shrink-0 text-slate-400" size={16} /><span>{task.location}</span></div>
              <div className="flex items-start gap-2"><Clock className="mt-1 shrink-0 text-slate-400" size={16} /><span>{task.time}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{task.skills.map((tag) => <span key={tag} className="rounded bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>)}</div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-500">{task.slotsFilled}/{task.slotsTotal} slots filled</span>
              <span className="font-bold text-teal-700">{task.slotsTotal - task.slotsFilled} left</span>
            </div>
            <div className="mt-2"><ProgressBar value={task.slotsFilled} max={task.slotsTotal} tone={task.urgency === 'Critical' ? 'bg-critical' : 'bg-warning'} /></div>
            <button onClick={() => setSelected(task)} className="mt-4 text-sm font-medium text-safe">Tap to sign up →</button>
          </Card>
        ))}
      </div>
      {selected && <TaskModal task={selected} onClose={() => setSelected(null)} onConfirm={() => { signUpTask(selected.id); setSelected(null); }} />}
    </section>
  );
}

function TaskModal({ task, onClose, onConfirm }: { task: VolunteerTask; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title={task.title} onClose={onClose} width="max-w-md">
      <div className="space-y-4 p-5">
        <p className="text-sm text-slate-600">{task.description}</p>
        <div className="text-sm text-slate-600">{task.location}<br />{task.time}</div>
        <Field label="Full Name"><input className="w-full border border-slate-200 p-3" placeholder="John Tan Wei Ming" /></Field>
        <Field label="Mobile Number"><input className="w-full border border-slate-200 p-3" placeholder="+65 9123 4567" /></Field>
        <Field label="NRIC / FIN / Passport"><input className="w-full border border-slate-200 p-3" placeholder="S1234567A" /></Field>
        <GreenButton className="w-full py-3" onClick={onConfirm}>Confirm Sign-Up</GreenButton>
      </div>
    </Modal>
  );
}

function CitizenContact() {
  const hotlines = [
    ['Fire & Rescue / Ambulance', 'Life-threatening emergencies', '995', 'bg-critical'],
    ['Police', 'Crime / security threats', '999', 'bg-navy-950'],
    ['SCDF Non-Emergency', 'Flood, fallen trees, hazmat', '1777', 'bg-warning'],
    ['MOH Health Advisory', 'Health / disease queries', '1800 333 9999', 'bg-safe']
  ];
  return (
    <section className="space-y-6">
      <div className="border border-red-400 bg-red-50 p-5 text-red-700">
        <h1 className="flex items-center gap-2 text-base font-bold"><Siren size={18} />Call 995 for life-threatening emergencies first.</h1>
        <p className="mt-3 text-sm leading-6">This platform is for official emergency updates and guidance. It is not monitored in real time for emergency dispatch.</p>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Phone size={16} />Emergency Hotlines</h2>
        <div className="mt-4 space-y-3">
          {hotlines.map(([title, detail, number, color]) => (
            <Card key={title} className="flex items-center gap-4 p-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-sm text-white ${color}`}><Phone size={22} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold leading-tight text-slate-950">{title}</div>
                <div className="mt-1 text-sm text-slate-500">{detail}</div>
              </div>
              <div className="shrink-0 text-base font-bold tracking-wide text-slate-950">{number}</div>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Siren size={16} />Official Contact Guidance</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Use this page to decide which official organisation to contact. For urgent danger, call 995 or 999 directly.</p>
      </div>
      <Card className="p-4">
        <h2 className="font-bold text-navy-950">Official resources</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <p><strong>SCDF:</strong> Call for fires, ambulance emergencies, hazardous material incidents, and urgent rescue.</p>
          <p><strong>SPF:</strong> Call for crime, suspicious activity, public order, or immediate security threats.</p>
          <p><strong>MOH:</strong> Use for health advisories, disease guidance, and clinic/hospital information.</p>
          <p><strong>Singapore Red Cross:</strong> Relief support, donation drives, and trained volunteer programmes.</p>
          <p><strong>Community Centres:</strong> Local resilience activities, relief registration, and neighbourhood support.</p>
        </div>
      </Card>
    </section>
  );
}
