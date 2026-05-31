import { useState } from 'react';
import { ArrowLeft, Wifi, WifiOff, MapPin, Shield, MessageSquare, Clock, Sparkles, FileText, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DbIncident, DbParticipant } from '../../api/incidents.api';
import { ChatPanel } from './ChatPanel';
import { TimelinePanel } from './TimelinePanel';
import { ResourcePanel } from './ResourcePanel';
import { UploadsPanel } from './UploadsPanel';
import { AiAdvisoryPanel } from './AiAdvisoryPanel';
import { ReportsPanel } from './ReportsPanel';
import type { useIncidentRoom } from '../../hooks/useIncidentRoom';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-900/60 text-red-300 border-red-700',
  High: 'bg-orange-900/60 text-orange-300 border-orange-700',
  Medium: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  Low: 'bg-green-900/60 text-green-300 border-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  Reported: 'text-gray-400', Unverified: 'text-yellow-400', Verified: 'text-blue-400',
  Dispatched: 'text-indigo-400', 'On Scene': 'text-green-400', Contained: 'text-teal-400',
  Recovery: 'text-cyan-400', Closed: 'text-gray-600',
};

const PHASES = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'] as const;
type Phase = typeof PHASES[number];

type Tab = 'discussion' | 'log' | 'advisory' | 'reports';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
  { id: 'log', label: 'Incident Log', icon: Clock },
  { id: 'advisory', label: 'AI Advisory', icon: Sparkles },
  { id: 'reports', label: 'Report', icon: FileText },
];

// Deterministic color from userId
const PARTICIPANT_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
function colorFor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PARTICIPANT_COLORS[Math.abs(h) % PARTICIPANT_COLORS.length];
}

interface Props {
  room: ReturnType<typeof useIncidentRoom>;
  currentUserId: string;
  currentUserName: string;
  currentUserOrg?: string;
}

// ── Collaborators panel ────────────────────────────────────────────────────
function CollaboratorsPanel({ participants, currentUserId }: { participants: DbParticipant[]; currentUserId: string }) {
  if (participants.length === 0) return null;
  return (
    <div className="px-4 py-3 border-b border-gray-800">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
        In Room · {participants.length}
      </p>
      <div className="space-y-1.5">
        {participants.map((p) => {
          const color = colorFor(p.userId);
          const isMe = p.userId === currentUserId;
          return (
            <div key={p.userId} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {p.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-300 truncate">
                {p.userName}{isMe ? <span className="text-gray-600"> (you)</span> : null}
              </span>
              <Circle size={6} className="ml-auto shrink-0 text-green-400 fill-green-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Phase stepper ──────────────────────────────────────────────────────────
function PhaseStepper({ currentStatus, onAdvance }: {
  currentStatus: string;
  onAdvance: (phase: string) => void;
}) {
  const currentIdx = PHASES.indexOf(currentStatus as Phase);
  const nextPhase = currentIdx < PHASES.length - 1 ? PHASES[currentIdx + 1] : null;

  return (
    <div className="px-4 py-3 border-b border-gray-800">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Phase</p>
      <div className="space-y-1">
        {PHASES.map((phase, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          return (
            <div key={phase} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isCurrent ? 'bg-indigo-400' : isDone ? 'bg-green-600' : 'bg-gray-700'
              }`} />
              <span className={`text-xs truncate ${
                isCurrent ? 'text-indigo-300 font-semibold'
                : isDone ? 'text-gray-500 line-through'
                : 'text-gray-600'
              }`}>
                {phase}
              </span>
            </div>
          );
        })}
      </div>
      {nextPhase && currentStatus !== 'Closed' && (
        <button
          onClick={() => onAdvance(nextPhase)}
          className="mt-3 w-full text-xs font-semibold bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-800 px-2 py-1.5 rounded transition-colors"
        >
          Advance → {nextPhase}
        </button>
      )}
    </div>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────
export function IncidentRoomLayout({ room, currentUserId, currentUserName, currentUserOrg }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('discussion');
  const { incident, connected } = room;

  if (!incident) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading incident…</p>
        </div>
      </div>
    );
  }

  const severityClass = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS['Medium'];
  const statusClass = STATUS_COLORS[incident.status] ?? 'text-gray-400';

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-200 transition-colors p-1 rounded">
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-100 truncate text-sm">{incident.title}</h1>
            <span className={`text-[11px] border rounded px-1.5 py-0.5 font-semibold shrink-0 ${severityClass}`}>
              {incident.severity}
            </span>
            <span className={`text-[11px] font-semibold shrink-0 ${statusClass}`}>{incident.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin size={9} />{incident.location}
            </span>
            {incident.incidentCommander && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Shield size={9} />{incident.incidentCommander}
              </span>
            )}
            <span className="text-[11px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{incident.type}</span>
          </div>
        </div>

        {/* Compact participant avatars + live dot */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex -space-x-1.5">
            {room.participants.slice(0, 3).map((p) => (
              <div key={p.userId} title={p.userName}
                className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: colorFor(p.userId) }}
              >
                {p.userName.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {room.participants.length > 3 && (
            <span className="text-xs text-gray-500">+{room.participants.length - 3}</span>
          )}
          <div title={connected ? 'Live' : 'Reconnecting'}>
            {connected
              ? <Wifi size={13} className="text-green-400" />
              : <WifiOff size={13} className="text-amber-400" />}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left panel */}
        <div className="w-56 shrink-0 border-r border-gray-800 overflow-y-auto flex flex-col bg-gray-950">

          {/* Collaborators */}
          <CollaboratorsPanel participants={room.participants} currentUserId={currentUserId} />

          {/* Phase stepper */}
          <PhaseStepper
            currentStatus={incident.status}
            onAdvance={(phase) => room.updateIncidentStatus(phase, currentUserName, currentUserOrg)}
          />

          {/* Incident details */}
          <div className="p-4 space-y-4 border-b border-gray-800">
            {incident.description && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{incident.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {incident.zone && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Zone</p>
                  <p className="text-xs text-gray-300">{incident.zone}</p>
                </div>
              )}
              {incident.confidenceScore != null && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${incident.confidenceScore}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{incident.confidenceScore}%</span>
                  </div>
                </div>
              )}
            </div>
            {incident.assignedOrgIds.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Assigned</p>
                <div className="flex flex-wrap gap-1">
                  {incident.assignedOrgIds.map((id) => (
                    <span key={id} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase">{id}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-gray-800">
            <ResourcePanel
              incidentId={incident.id}
              resources={room.resources}
              onStatusChange={room.updateResourceStatus}
              onAssigned={room.addResourceLocally}
            />
          </div>

          <div>
            <UploadsPanel
              incidentId={incident.id}
              uploads={room.uploads}
              uploadedBy={currentUserId}
              onUploaded={room.addUploadLocally}
            />
          </div>
        </div>

        {/* Right panel — tabbed workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-gray-800 bg-gray-900 shrink-0 px-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              const showDot = id === 'discussion' && !isActive && room.messages.length > 0;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors relative ${
                    isActive ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon size={12} />{label}
                  {showDot && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute top-2 right-1" />}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'discussion' && (
              <ChatPanel messages={room.messages} typingUsers={room.typingUsers}
                aiThinking={room.aiThinking} currentUserId={currentUserId}
                onSend={room.sendMessage} onTyping={room.emitTyping} />
            )}
            {activeTab === 'log' && <TimelinePanel timeline={room.timeline} />}
            {activeTab === 'advisory' && <AiAdvisoryPanel incident={incident} resources={room.resources} />}
            {activeTab === 'reports' && (
              <ReportsPanel incident={incident} currentUserId={currentUserId} currentUserName={currentUserName} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
