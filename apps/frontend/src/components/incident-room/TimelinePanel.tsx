import { Clock, Radio, Truck, Megaphone, Activity, Users, Heart, UserCheck, FileText, X } from 'lucide-react';
import type { DbTimelineEvent } from '../../api/incidents.api';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  INITIAL: { icon: Clock, color: 'text-yellow-400', label: 'Initial' },
  STATUS: { icon: Activity, color: 'text-blue-400', label: 'Status' },
  DEPLOY: { icon: Truck, color: 'text-green-400', label: 'Deploy' },
  BROADCAST: { icon: Megaphone, color: 'text-orange-400', label: 'Broadcast' },
  ASSESS: { icon: FileText, color: 'text-purple-400', label: 'Assess' },
  COORD: { icon: Radio, color: 'text-cyan-400', label: 'Coord' },
  MEDICAL: { icon: Heart, color: 'text-red-400', label: 'Medical' },
  VOLUNTEER: { icon: UserCheck, color: 'text-teal-400', label: 'Volunteer' },
  NOTE: { icon: FileText, color: 'text-gray-400', label: 'Note' },
  CLOSE: { icon: X, color: 'text-gray-500', label: 'Close' },
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

interface Props {
  timeline: DbTimelineEvent[];
}

export function TimelinePanel({ timeline }: Props) {
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Timeline ({timeline.length})
      </h3>
      {timeline.length === 0 && (
        <p className="text-gray-600 text-sm">No timeline events yet.</p>
      )}
      <div className="relative">
        {/* Vertical line */}
        {timeline.length > 1 && (
          <div className="absolute left-3.5 top-3 bottom-3 w-px bg-gray-800" />
        )}
        <div className="space-y-4">
          {[...timeline].reverse().map((event) => {
            const cfg = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG['NOTE'];
            const Icon = cfg.icon;
            return (
              <div key={event.id} className="flex gap-3">
                <div className={`w-7 h-7 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                  <Icon size={12} />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    {event.organisation && (
                      <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {event.organisation}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 ml-auto">{formatTime(event.timestamp)}</span>
                  </div>
                  {event.actor && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.actor}</p>
                  )}
                  <p className="text-sm text-gray-300 mt-0.5 leading-snug">{event.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
