import { ArrowLeft, Wifi, WifiOff, Users, MapPin, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DbIncident, DbParticipant } from '../../api/incidents.api';
import { ChatPanel } from './ChatPanel';
import { TimelinePanel } from './TimelinePanel';
import { ResourcePanel } from './ResourcePanel';
import { UploadsPanel } from './UploadsPanel';
import type { useIncidentRoom } from '../../hooks/useIncidentRoom';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-900/50 text-red-300 border-red-700',
  High: 'bg-orange-900/50 text-orange-300 border-orange-700',
  Medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  Low: 'bg-green-900/50 text-green-300 border-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  Reported: 'text-gray-400',
  Unverified: 'text-yellow-400',
  Verified: 'text-blue-400',
  Dispatched: 'text-indigo-400',
  'On Scene': 'text-green-400',
  Contained: 'text-teal-400',
  Recovery: 'text-cyan-400',
  Closed: 'text-gray-600',
};

const STATUS_NEXT: Record<string, string> = {
  Reported: 'Verified',
  Unverified: 'Verified',
  Verified: 'Dispatched',
  Dispatched: 'On Scene',
  'On Scene': 'Contained',
  Contained: 'Recovery',
  Recovery: 'Closed',
};

interface Props {
  room: ReturnType<typeof useIncidentRoom>;
  currentUserId: string;
  currentUserName: string;
  currentUserOrg?: string;
}

function ParticipantsBar({ participants }: { participants: DbParticipant[] }) {
  return (
    <div className="flex items-center gap-1">
      <Users size={12} className="text-gray-500" />
      <div className="flex -space-x-1">
        {participants.slice(0, 5).map((p) => (
          <div
            key={p.userId}
            title={p.userName}
            className="w-6 h-6 rounded-full bg-indigo-700 border border-gray-900 flex items-center justify-center"
          >
            <span className="text-white text-xs font-semibold">
              {p.userName.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      {participants.length > 5 && (
        <span className="text-xs text-gray-500">+{participants.length - 5}</span>
      )}
    </div>
  );
}

export function IncidentRoomLayout({ room, currentUserId, currentUserName, currentUserOrg }: Props) {
  const navigate = useNavigate();
  const { incident, connected } = room;

  if (!incident) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        Loading incident…
      </div>
    );
  }

  const severityClass = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS['Medium'];
  const statusClass = STATUS_COLORS[incident.status] ?? 'text-gray-400';
  const nextStatus = STATUS_NEXT[incident.status];

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-semibold text-gray-100 truncate">{incident.title}</h1>
            <span className={`text-xs border rounded px-1.5 py-0.5 font-medium ${severityClass}`}>
              {incident.severity}
            </span>
            <span className={`text-xs font-semibold ${statusClass}`}>{incident.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={10} /> {incident.location}
            </span>
            {incident.incidentCommander && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Shield size={10} /> {incident.incidentCommander}
              </span>
            )}
            <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
              {incident.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ParticipantsBar participants={room.participants} />

          {nextStatus && (
            <button
              onClick={() => room.updateIncidentStatus(nextStatus, currentUserName, currentUserOrg)}
              className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-2.5 py-1 rounded transition-colors"
            >
              → {nextStatus}
            </button>
          )}

          <div className={`flex items-center gap-1 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex gap-0">
        {/* Left: Incident details */}
        <div className="w-64 shrink-0 border-r border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{incident.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Zone</p>
              <p className="text-sm text-gray-300">{incident.zone || '—'}</p>
            </div>
            {incident.incidentCommander && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">IC</p>
                <p className="text-sm text-gray-300">{incident.incidentCommander}</p>
              </div>
            )}
            {incident.confidenceScore != null && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${incident.confidenceScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{incident.confidenceScore}%</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assigned Orgs</p>
              <div className="flex flex-wrap gap-1">
                {incident.assignedOrgIds.map((id) => (
                  <span key={id} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="border-t border-gray-800">
            <ResourcePanel
              incidentId={incident.id}
              resources={room.resources}
              onStatusChange={room.updateResourceStatus}
              onAssigned={room.addResourceLocally}
            />
          </div>

          {/* Uploads */}
          <div className="border-t border-gray-800">
            <UploadsPanel
              incidentId={incident.id}
              uploads={room.uploads}
              uploadedBy={currentUserId}
              onUploaded={room.addUploadLocally}
            />
          </div>
        </div>

        {/* Centre: Chat */}
        <div className="flex-1 relative overflow-hidden">
          <ChatPanel
            messages={room.messages}
            typingUsers={room.typingUsers}
            aiThinking={room.aiThinking}
            currentUserId={currentUserId}
            onSend={room.sendMessage}
            onTyping={room.emitTyping}
          />
        </div>

        {/* Right: Timeline */}
        <div className="w-72 shrink-0 border-l border-gray-800 overflow-hidden">
          <TimelinePanel timeline={room.timeline} />
        </div>
      </div>
    </div>
  );
}
