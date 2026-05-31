import { useState } from 'react';
import {
  ArrowLeft, Wifi, WifiOff, MapPin, Shield, MessageSquare, Clock,
  Sparkles, FileText, Circle, Package, Info, Map,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DbIncident, DbParticipant } from '../../api/incidents.api';
import { ChatPanel } from './ChatPanel';
import { TimelinePanel } from './TimelinePanel';
import { AiAdvisoryPanel } from './AiAdvisoryPanel';
import { ReportsPanel } from './ReportsPanel';
import { ResourcesTab } from './ResourcesTab';
import { InformationTab } from './InformationTab';
import { MapTab } from './MapTab';
import type { useIncidentRoom } from '../../hooks/useIncidentRoom';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Low: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_COLORS: Record<string, string> = {
  Reported: 'text-gray-500', Unverified: 'text-yellow-600', Verified: 'text-blue-600',
  Dispatched: 'text-indigo-600', 'On Scene': 'text-green-600', Contained: 'text-teal-600',
  Recovery: 'text-cyan-600', Closed: 'text-gray-400',
};

const PHASES = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'] as const;
type Phase = typeof PHASES[number];

type Tab = 'discussion' | 'log' | 'reports' | 'resources' | 'map' | 'information' | 'advisory';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
  { id: 'log', label: 'Incident Log', icon: Clock },
  { id: 'reports', label: 'Report', icon: FileText },
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'information', label: 'Information', icon: Info },
  { id: 'advisory', label: 'AI Advisory', icon: Sparkles },
];

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

function CollaboratorsPanel({ participants, currentUserId }: { participants: DbParticipant[]; currentUserId: string }) {
  if (participants.length === 0) return null;
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">In Room &middot; {participants.length}</p>
      <div className="space-y-1.5">
        {participants.map((p) => {
          const color = colorFor(p.userId);
          const isMe = p.userId === currentUserId;
          return (
            <div key={p.userId} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}>
                {p.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-700 truncate">
                {p.userName}{isMe ? <span className="text-gray-400"> (you)</span> : null}
              </span>
              <Circle size={6} className="ml-auto shrink-0 text-green-500 fill-green-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseStepper({ currentStatus, onAdvance }: { currentStatus: string; onAdvance: (phase: string) => void }) {
  const currentIdx = PHASES.indexOf(currentStatus as Phase);
  const nextPhase = currentIdx < PHASES.length - 1 ? PHASES[currentIdx + 1] : null;

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Phase</p>
      <div className="space-y-1">
        {PHASES.map((phase, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={phase} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-indigo-500' : isDone ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-xs truncate ${isCurrent ? 'text-indigo-600 font-semibold' : isDone ? 'text-gray-400 line-through' : 'text-gray-400'}`}>
                {phase}
              </span>
            </div>
          );
        })}
      </div>
      {nextPhase && currentStatus !== 'Closed' && (
        <button onClick={() => onAdvance(nextPhase)}
          className="mt-3 w-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-300 px-2 py-1.5 rounded transition-colors">
          Advance to {nextPhase}
        </button>
      )}
    </div>
  );
}

export function IncidentRoomLayout({ room, currentUserId, currentUserName, currentUserOrg }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('discussion');
  const { incident, connected } = room;

  if (!incident) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading incident...</p>
        </div>
      </div>
    );
  }

  const severityClass = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS['Medium'];
  const statusClass = STATUS_COLORS[incident.status] ?? 'text-gray-500';

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden text-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900 truncate text-sm">{incident.title}</h1>
            <span className={`text-[11px] border rounded px-1.5 py-0.5 font-semibold shrink-0 ${severityClass}`}>{incident.severity}</span>
            <span className={`text-[11px] font-semibold shrink-0 ${statusClass}`}>{incident.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-400"><MapPin size={9} />{incident.location}</span>
            {incident.incidentCommander && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400"><Shield size={9} />{incident.incidentCommander}</span>
            )}
            <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{incident.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex -space-x-1.5">
            {room.participants.slice(0, 3).map((p) => (
              <div key={p.userId} title={p.userName}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: colorFor(p.userId) }}>
                {p.userName.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {room.participants.length > 3 && <span className="text-xs text-gray-400">+{room.participants.length - 3}</span>}
          <div title={connected ? 'Live' : 'Reconnecting'}>
            {connected ? <Wifi size={13} className="text-green-500" /> : <WifiOff size={13} className="text-amber-500" />}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Narrow sidebar - presence + phase only */}
        <div className="w-48 shrink-0 border-r border-gray-200 overflow-y-auto flex flex-col bg-gray-50">
          <CollaboratorsPanel participants={room.participants} currentUserId={currentUserId} />
          <PhaseStepper
            currentStatus={incident.status}
            onAdvance={(phase) => room.updateIncidentStatus(phase, currentUserName, currentUserOrg)}
          />
        </div>

        {/* Tabbed workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-gray-200 bg-white shrink-0 px-2 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              const showDot = id === 'discussion' && !isActive && room.messages.length > 0;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors relative whitespace-nowrap ${
                    isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}>
                  <Icon size={12} />{label}
                  {showDot && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-2 right-1" />}
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
            {activeTab === 'reports' && (
              <ReportsPanel incident={incident} currentUserId={currentUserId} currentUserName={currentUserName}
                resources={room.resources} uploads={room.uploads} onUploaded={room.addUploadLocally} />
            )}
            {activeTab === 'resources' && (
              <ResourcesTab incidentId={incident.id} resources={room.resources} timeline={room.timeline}
                onStatusChange={room.updateResourceStatus} onAssigned={room.addResourceLocally} />
            )}
            {activeTab === 'map' && (
              <MapTab incident={incident} resources={room.resources}
                uploads={room.uploads} timeline={room.timeline} />
            )}
            {activeTab === 'information' && (
              <InformationTab incident={incident} uploads={room.uploads}
                uploadedBy={currentUserId} onUploaded={room.addUploadLocally} />
            )}
            {activeTab === 'advisory' && <AiAdvisoryPanel incident={incident} resources={room.resources} />}
          </div>
        </div>
      </div>
    </div>
  );
}
