import { useState } from 'react';
import { FileText, CheckCircle2, Edit3, Save, X, Bot } from 'lucide-react';
import type { DbChatMessage, DbIncident } from '../../api/incidents.api';

interface Props {
  incident: DbIncident;
  messages: DbChatMessage[];
  onRequestReport: () => void;
  aiThinking: boolean;
}

interface ReportState {
  editing: boolean;
  draft: string;
  finalized: boolean;
}

export function ReportsPanel({ incident, messages, onRequestReport, aiThinking }: Props) {
  // Reports are generate-report AI messages
  const reports = messages.filter((m) => m.isAi && m.aiCommand === 'generate-report');
  const [reportStates, setReportStates] = useState<Record<string, ReportState>>({});

  function getState(id: string, content: string): ReportState {
    return reportStates[id] ?? { editing: false, draft: content, finalized: false };
  }

  function setState(id: string, patch: Partial<ReportState>) {
    setReportStates((prev) => ({
      ...prev,
      [id]: { ...getState(id, ''), ...patch },
    }));
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <FileText size={14} className="text-indigo-400" /> AI Reports
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate, edit collaboratively, and finalize SITREP reports for this incident.
          </p>
        </div>
        <button
          onClick={onRequestReport}
          disabled={aiThinking}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors"
        >
          <Bot size={12} />
          {aiThinking ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {reports.length === 0 && !aiThinking && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
          <FileText size={24} className="text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No reports generated yet.</p>
          <p className="text-xs text-gray-600 mt-1">
            Click "Generate Report" to produce a SITREP based on current incident data.
          </p>
        </div>
      )}

      {aiThinking && (
        <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-4 flex items-center gap-3">
          <div className="flex gap-1">
            {[0,1,2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
            ))}
          </div>
          <p className="text-sm text-blue-300">AI is generating a report…</p>
        </div>
      )}

      <div className="space-y-4">
        {[...reports].reverse().map((report) => {
          const state = getState(report.id, report.content);
          return (
            <div key={report.id} className={`rounded-lg border ${state.finalized ? 'border-green-700 bg-green-950/20' : 'border-gray-700 bg-gray-900'}`}>
              {/* Report header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Bot size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-gray-300">SITREP — {incident.title}</span>
                  <span className="text-xs text-gray-600">{formatTime(report.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {state.finalized && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                      <CheckCircle2 size={12} /> Finalized
                    </span>
                  )}
                  {!state.finalized && !state.editing && (
                    <>
                      <button
                        onClick={() => setState(report.id, { editing: true, draft: report.content })}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-800"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setState(report.id, { finalized: true, editing: false })}
                        className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-gray-800"
                      >
                        <CheckCircle2 size={11} /> Finalize
                      </button>
                    </>
                  )}
                  {state.editing && (
                    <>
                      <button
                        onClick={() => setState(report.id, { editing: false })}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-800"
                      >
                        <Save size={11} /> Save
                      </button>
                      <button
                        onClick={() => setState(report.id, { editing: false, draft: report.content })}
                        className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800"
                      >
                        <X size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Report content */}
              <div className="px-4 py-3">
                {state.editing ? (
                  <textarea
                    value={state.draft}
                    onChange={(e) => setState(report.id, { draft: e.target.value })}
                    className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                    rows={20}
                  />
                ) : (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                    {state.draft || report.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
