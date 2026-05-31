import { useState } from 'react';
import { Sparkles, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import type { DbIncident, DbResourceAssignment } from '../../api/incidents.api';

interface Recommendation { priority: 'Critical' | 'High' | 'Medium'; action: string; detail: string; }
interface Advisory {
  generatedAt: string;
  assessment: string;
  recommendations: Recommendation[];
  warnings: string[];
}

const PRIORITY_CLS: Record<string, string> = {
  Critical: 'bg-red-900/60 text-red-300 border border-red-700',
  High: 'bg-orange-900/60 text-orange-300 border border-orange-700',
  Medium: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
};

interface Props {
  incident: DbIncident;
  resources: DbResourceAssignment[];
}

export function AiAdvisoryPanel({ incident, resources }: Props) {
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAdvisory() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...incident,
        unitsResponded: resources.length,
        volunteersResponded: 0,
        assignedOrganisations: incident.assignedOrgIds,
        timeline: incident.timeline ?? [],
      };
      const r = await fetch(`${import.meta.env.VITE_API_URL}/ai/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Request failed');
      const data = await r.json() as Advisory;
      setAdvisory(data);
    } catch {
      setError('AI advisory unavailable. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" /> AI Advisory
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Gemini analyses the full incident context and gives prioritised recommendations.
          </p>
        </div>
        <button
          onClick={() => void fetchAdvisory()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loading ? 'Thinking…' : advisory ? 'Refresh' : 'Get Advisory'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">{error}</div>
      )}

      {!advisory && !loading && !error && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
          <Sparkles size={24} className="text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No advisory generated yet.</p>
          <p className="text-xs text-gray-600 mt-1">Click "Get Advisory" to have AI analyse this incident.</p>
        </div>
      )}

      {advisory && (
        <div className="space-y-4">
          <div className="text-xs text-gray-600">Generated {advisory.generatedAt}</div>

          {/* Assessment */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Situational Assessment</p>
            <p className="text-sm text-gray-200 leading-relaxed">{advisory.assessment}</p>
          </div>

          {/* Recommendations */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommendations</p>
            <div className="space-y-2">
              {advisory.recommendations.map((rec, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 h-fit mt-0.5 ${PRIORITY_CLS[rec.priority] ?? PRIORITY_CLS['Medium']}`}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{rec.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rec.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {advisory.warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Watch-outs</p>
              <div className="space-y-1.5">
                {advisory.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-950/40 border border-amber-900/50 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
