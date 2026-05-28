import {
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HeartPulse,
  MapPin,
  Megaphone,
  Phone,
  Shield,
  ShieldAlert,
  Train,
  Waves,
  X
} from 'lucide-react';
import { type ElementType, useState } from 'react';
import { MobileShell } from '../components/layouts';
import { Field, ProgressBar } from '../components/ui';
import { useData } from '../state/DataContext';
import type { Broadcast, CommunityProgramme, VolunteerTask } from '../types';

// Maps broadcast icon key → Lucide component
const broadcastIconMap: Record<string, ElementType> = {
  Waves,
  Radio: Megaphone,
  ShieldAlert,
  Train,
  HeartPulse,
  Megaphone
};

const severityConfig = {
  CRITICAL: {
    dot: 'bg-red-500',
    label: 'Critical',
    text: 'text-red-600',
    border: 'border-l-2 border-red-400'
  },
  NOTICE: {
    dot: 'bg-amber-500',
    label: 'Notice',
    text: 'text-amber-700',
    border: 'border-l-2 border-amber-400'
  },
  INFO: {
    dot: 'bg-blue-500',
    label: 'Info',
    text: 'text-blue-600',
    border: 'border-l-2 border-blue-400'
  }
};

export function CitizenApp() {
  const { publicAlerts, volunteerTasks, readAlertIds } = useData();
  const [tab, setTab] = useState('alerts');
  const unreadCount = publicAlerts.filter((a) => !readAlertIds.has(a.id)).length;
  return (
    <MobileShell tab={tab} setTab={setTab} alertCount={unreadCount} volunteerCount={volunteerTasks.length}>
      {tab === 'alerts' && <CitizenAlerts />}
      {tab === 'communities' && <CitizenCommunities />}
      {tab === 'volunteer' && <CitizenVolunteer />}
      {tab === 'contact' && <CitizenContact />}
    </MobileShell>
  );
}

type SeverityFilter = 'All' | 'CRITICAL' | 'NOTICE' | 'INFO';

// ─── Alerts ──────────────────────────────────────────────────────────────────

function CitizenAlerts() {
  const { publicAlerts, readAlertIds, markAlertRead } = useData();
  const [selected, setSelected] = useState<Broadcast | null>(null);
  const [filter, setFilter] = useState<SeverityFilter>('All');

  const visible = filter === 'All' ? publicAlerts : publicAlerts.filter((b) => b.severity === filter);

  const open = (b: Broadcast) => { markAlertRead(b.id); setSelected(b); };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Official Broadcasts</h2>
        <p className="mt-0.5 text-xs text-slate-400">Tap a broadcast to view the full advisory</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(['All', 'CRITICAL', 'NOTICE', 'INFO'] as SeverityFilter[]).map((chip) => (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
              filter === chip
                ? 'border-sgds-purple bg-sgds-purple text-white'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-10 text-center">
            <CheckCircle2 size={28} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">All clear</p>
            <p className="mt-1 text-xs text-slate-400">
              No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}broadcasts at this time.
            </p>
          </div>
        )}

        {visible.map((broadcast) => {
          const cfg = severityConfig[broadcast.severity];
          const BroadcastIcon = broadcastIconMap[broadcast.icon] ?? Megaphone;
          const isUnread = !readAlertIds.has(broadcast.id);
          return (
            <div
              key={broadcast.id}
              className={`overflow-hidden rounded-xl bg-white border border-slate-100 pl-4 ${cfg.border}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    <BroadcastIcon size={15} className="text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-sgds-purple" aria-label="Unread" />
                      )}
                    </div>
                    <h3 className={`mt-1.5 text-[14px] font-semibold leading-snug ${
                      isUnread ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {broadcast.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                  {broadcast.message}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{broadcast.issuer} · {broadcast.timestamp}</span>
                  <button
                    onClick={() => open(broadcast)}
                    className="flex items-center gap-0.5 text-xs font-semibold text-sgds-purple hover:underline shrink-0"
                  >
                    Read advisory <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <AdvisoryModal broadcast={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

// ─── Advisory content ─────────────────────────────────────────────────────────

const advisoryContent: Record<string, { warning: string; dos: [string, string][]; donts: string[] }> = {
  Waves: {
    warning: 'Flash floods can rise rapidly and be life-threatening. Act immediately and follow all official instructions.',
    dos: [
      ['Move to higher ground immediately', 'If you are in a low-lying area, move to a higher floor or higher terrain right now. Do not wait for water to enter your home.'],
      ['Do NOT enter floodwater', 'Just 15 cm of moving water can knock an adult off their feet. 30 cm can sweep a vehicle away. Stay out of floodwater.'],
      ['Avoid underpasses, canals and low-lying roads', 'Underpasses can fill within seconds. Do not attempt to drive or walk through submerged roads.'],
      ['Switch off electricity at the mains', 'If water is entering your home, turn off the electrical mains switch immediately to prevent electrocution risk.'],
      ['Call 995 if trapped or in danger', 'If you are trapped or someone is in immediate danger, call SCDF at 995. Stay on the line and follow operator instructions.']
    ],
    donts: [
      'Do NOT drive through flooded roads — your vehicle can be swept away in seconds.',
      'Do NOT touch electrical equipment in wet or flooded areas.',
      'Do NOT spread unverified updates or return to evacuated areas until agencies say it is safe.'
    ]
  },
  Train: {
    warning: 'Public transport services are disrupted. Allow extra time for your journey and follow station staff instructions.',
    dos: [
      ['Check the SMRT or LTA app', 'Get the latest updates on service resumption and alternative bus routes.'],
      ['Use alternative bus services', 'Free bridging buses are deployed at affected stations. Look for staff directing passengers.'],
      ['Allow extra travel time', 'Expect crowding at alternative stops. Plan ahead and avoid non-essential travel.'],
      ['Follow station staff guidance', 'Station staff will direct you to safe exits and alternative transport.']
    ],
    donts: [
      'Do NOT attempt to walk along MRT tracks — it is illegal and extremely dangerous.',
      'Do NOT share unverified social media posts about the disruption.',
      'Do NOT rush or push on crowded platforms.'
    ]
  },
  HeartPulse: {
    warning: 'A medical advisory is in effect. Follow health authority guidance and seek help early if you have symptoms.',
    dos: [
      ['Follow MOH guidelines', 'Visit the MOH website or hotline (1800 333 9999) for the latest health advisories.'],
      ['Stay home if unwell', 'If you have symptoms, avoid public spaces and seek medical attention promptly.'],
      ['Call 995 for emergencies', 'For life-threatening medical emergencies, call 995 immediately.']
    ],
    donts: [
      'Do NOT self-diagnose or rely on unverified social media health information.',
      'Do NOT visit hospitals unnecessarily — use GP clinics for non-emergency cases.',
      'Do NOT ignore persistent or worsening symptoms.'
    ]
  }
};

const defaultAdvisory = {
  warning: 'An official advisory has been issued. Follow all instructions from emergency services and authorities.',
  dos: [
    ['Stay informed', 'Monitor official channels — Gov.sg, SCDF, SPF — for updates as the situation develops.'],
    ['Follow instructions from authorities', 'Comply with instructions from police, civil defence, and other emergency responders on the ground.'],
    ['Call 995 for life-threatening emergencies', 'If you or someone near you is in immediate danger, call SCDF at 995.'],
    ['Avoid the affected area', 'Unless you are a responder, stay clear of the incident zone to allow emergency services to work.']
  ],
  donts: [
    'Do NOT spread unverified information — share only official updates.',
    'Do NOT obstruct emergency vehicles or personnel.',
    'Do NOT return to an area until authorities declare it safe.'
  ]
};

function AdvisoryModal({ broadcast, onClose }: { broadcast: Broadcast; onClose: () => void }) {
  const content = advisoryContent[broadcast.icon] ?? defaultAdvisory;
  const cfg = severityConfig[broadcast.severity];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-2xl bg-white shadow-2xl">

        {/* Thin severity bar */}
        <div className={`h-1 rounded-t-2xl ${cfg.dot.replace('bg-', 'bg-')}`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
              {broadcast.zone && <span className="text-[10px] text-slate-400">{broadcast.zone}</span>}
            </div>
            <h2 className="mt-1.5 text-[15px] font-semibold text-slate-900">{broadcast.title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{broadcast.issuer} · {broadcast.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            {broadcast.message}
          </p>
          <p className="text-sm leading-relaxed text-slate-500">{content.warning}</p>

          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">What to do</p>
            <ol className="space-y-4">
              {content.dos.map(([title, detail], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Do not</p>
            <ul className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-4">
              {content.donts.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Communities ─────────────────────────────────────────────────────────────

function CitizenCommunities() {
  const { communityProgrammes, registerProgramme } = useData();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<CommunityProgramme | null>(null);
  const programmes = filter === 'All' ? communityProgrammes : communityProgrammes.filter((p) => p.category === filter);

  const filterIcons: Record<string, ElementType | null> = {
    All: null, Preparedness: Shield, Relief: Heart, Training: BookOpen, Awareness: Megaphone
  };

  const categoryColor: Record<string, string> = {
    Preparedness: 'text-blue-600',
    Relief: 'text-red-600',
    Training: 'text-emerald-600',
    Awareness: 'text-orange-600'
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Community Hub</h2>
        <p className="mt-0.5 text-xs text-slate-400">Volunteer and join resilience programmes near you</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(['All', 'Preparedness', 'Relief', 'Training', 'Awareness'] as const).map((chip) => {
          const Icon = filterIcons[chip];
          return (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                filter === chip
                  ? 'border-sgds-purple bg-sgds-purple text-white'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {Icon && <Icon size={11} />}
              {chip}
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {programmes.map((programme) => (
          <div key={programme.id} className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-slate-900">{programme.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{programme.organisation}</span>
                  <span className="text-slate-200">·</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${categoryColor[programme.category] ?? 'text-slate-500'}`}>
                    {programme.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="shrink-0 text-slate-300" />
                <span>{programme.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="shrink-0 text-slate-300" />
                <span>{programme.time}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {programme.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">{programme.registered} / {programme.capacity} registered</span>
                <span className="font-semibold text-slate-700">{programme.capacity - programme.registered} spots left</span>
              </div>
              <ProgressBar value={programme.registered} max={programme.capacity} tone="bg-sgds-purple" />
            </div>

            <button
              onClick={() => setSelected(programme)}
              className="mt-3.5 flex items-center gap-0.5 text-xs font-semibold text-sgds-purple hover:underline"
            >
              View and register <ChevronRight size={13} />
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <ProgrammeModal
          programme={selected}
          onClose={() => setSelected(null)}
          onConfirm={() => { registerProgramme(selected.id); setSelected(null); }}
        />
      )}
    </section>
  );
}

function ProgrammeModal({ programme, onClose, onConfirm }: { programme: CommunityProgramme; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">{programme.title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate-500">{programme.description}</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p>{programme.location}</p>
            <p>{programme.time}</p>
            <p>Contact: {programme.contact}</p>
          </div>
          <Field label="Full Name">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="Your full name" />
          </Field>
          <Field label="Mobile Number">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="+65 9123 4567" />
          </Field>
          <Field label="Email">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="you@example.com" />
          </Field>
          <button onClick={onConfirm} className="w-full rounded-lg bg-sgds-purple py-3 text-sm font-semibold text-white hover:bg-sgds-purple-dark transition-colors">
            Confirm Registration
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Volunteer ────────────────────────────────────────────────────────────────

function CitizenVolunteer() {
  const { volunteerTasks, signUpTask } = useData();
  const [selected, setSelected] = useState<VolunteerTask | null>(null);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Volunteer</h2>
        <p className="mt-0.5 text-xs text-slate-400">Help where you are needed most</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-sm text-slate-600">
          Register your skills to be deployed during future incidents.
        </p>
        <button className="mt-2 flex items-center gap-0.5 text-xs font-semibold text-sgds-purple hover:underline">
          Register as a volunteer <ChevronRight size={13} />
        </button>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Urgently needed</p>

      <div className="space-y-2.5">
        {volunteerTasks.map((task) => (
          <div key={task.id} className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-slate-900">{task.title}</h3>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
                task.urgency === 'Critical'
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}>
                {task.urgency === 'High' ? 'Urgent' : task.urgency}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Building2 size={12} className="shrink-0 text-slate-300" />
              <span>{task.organisation}</span>
            </div>

            <div className="mt-1.5 space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="shrink-0 text-slate-300" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="shrink-0 text-slate-300" />
                <span>{task.time}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.skills.map((s) => (
                <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">{task.slotsFilled} / {task.slotsTotal} filled</span>
                <span className="font-semibold text-slate-700">{task.slotsTotal - task.slotsFilled} left</span>
              </div>
              <ProgressBar
                value={task.slotsFilled}
                max={task.slotsTotal}
                tone={task.urgency === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}
              />
            </div>

            <button onClick={() => setSelected(task)} className="mt-3.5 flex items-center gap-0.5 text-xs font-semibold text-sgds-purple hover:underline">
              Sign up <ChevronRight size={13} />
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <TaskModal
          task={selected}
          onClose={() => setSelected(null)}
          onConfirm={() => { signUpTask(selected.id); setSelected(null); }}
        />
      )}
    </section>
  );
}

function TaskModal({ task, onClose, onConfirm }: { task: VolunteerTask; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">{task.title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate-500">{task.description}</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p>{task.location}</p>
            <p>{task.time}</p>
          </div>
          <Field label="Full Name">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="John Tan Wei Ming" />
          </Field>
          <Field label="Mobile Number">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="+65 9123 4567" />
          </Field>
          <Field label="NRIC / FIN / Passport">
            <input className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sgds-purple/20 focus:border-sgds-purple transition-colors" placeholder="S1234567A" />
          </Field>
          <button onClick={onConfirm} className="w-full rounded-lg bg-sgds-purple py-3 text-sm font-semibold text-white hover:bg-sgds-purple-dark transition-colors">
            Confirm Sign-Up
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function CitizenContact() {
  const hotlines = [
    { title: 'Fire & Rescue / Ambulance', detail: 'Life-threatening emergencies', number: '995', tel: '995' },
    { title: 'Police', detail: 'Crime and security threats', number: '999', tel: '999' },
    { title: 'SCDF Non-Emergency', detail: 'Flood, fallen trees, hazmat', number: '1777', tel: '1777' },
    { title: 'MOH Health Advisory', detail: 'Health and disease queries', number: '1800 333 9999', tel: '18003339999' }
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">In a life-threatening emergency?</p>
            <p className="mt-0.5 text-xs text-slate-500">Call 995 for fire, rescue, or ambulance immediately.</p>
          </div>
          <a
            href="tel:995"
            className="shrink-0 rounded-lg bg-sgds-purple px-4 py-2 text-sm font-semibold text-white hover:bg-sgds-purple-dark transition-colors"
          >
            Call 995
          </a>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          This platform is for official updates and guidance only. It is not monitored for emergency dispatch.
        </p>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Emergency Hotlines</p>
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white divide-y divide-slate-100">
          {hotlines.map(({ title, detail, number, tel }) => (
            <a
              key={title}
              href={`tel:${tel}`}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Phone size={15} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-400">{detail}</p>
              </div>
              <span className="shrink-0 text-sm font-bold tracking-tight text-slate-900">{number}</span>
            </a>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Who to contact</p>
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white divide-y divide-slate-100">
          {[
            ['SCDF', 'Fires, ambulance, hazardous materials, rescue'],
            ['SPF', 'Crime, suspicious activity, public security'],
            ['MOH', 'Health advisories, disease guidance, clinics'],
            ['Singapore Red Cross', 'Relief support, volunteer programmes'],
            ['Community Centres', 'Local resilience, relief registration']
          ].map(([org, role]) => (
            <div key={org} className="flex items-start gap-3 px-4 py-3.5">
              <div className="mt-0.5 min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900">{org} </span>
                <span className="text-sm text-slate-500">{role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
