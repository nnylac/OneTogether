import { useState } from 'react';
import { Plus, Truck, Clock, X } from 'lucide-react';
import type { DbResourceAssignment, DbTimelineEvent, DbUnit } from '../../api/incidents.api';
import { fetchAvailableUnits, assignUnit } from '../../api/incidents.api';
import { STATUS_COLORS, TYPE_ICONS, STATUSES } from './ResourcePanel';

interface Props {
  incidentId: string;
  resources: DbResourceAssignment[];
  timeline: DbTimelineEvent[];
  onStatusChange: (unitId: string, status: string) => void;
  onAssigned: (assignment: DbResourceAssignment) => void;
}

export function ResourcesTab({ incidentId, resources, timeline, onStatusChange, onAssigned }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<DbUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const deployEvents = timeline.filter((e) => e.category === 'DEPLOY');

  async function openModal() {
    setShowModal(true); setLoadingUnits(true);
    const units = await fetchAvailableUnits();
    const assignedIds = new Set(resources.map((r) => r.unitId));
    setAvailableUnits(units.filter((u) => !assignedIds.has(u.id)));
    setLoadingUnits(false);
  }

  async function handleAssign(unitId: string) {
    const assignment = await assignUnit(incidentId, unitId);
    onAssigned(assignment);
    setAvailableUnits((prev) => prev.filter((u) => u.id !== unitId));
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Assigned Resources</h2>
            <p className="text-xs text-gray-400 mt-0.5">{resources.length} unit{resources.length !== 1 ? 's' : ''} deployed</p>
          </div>
          <button onClick={openModal}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded transition-colors">
            <Plus size={14} /> Assign Unit
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
            <Truck size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No units assigned yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Assign Unit" to deploy resources to this incident.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Unit', 'Type', 'Assigned', 'Status', 'Notes'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resources.map((r) => {
                  const unit = r.unit;
                  const Icon = unit ? (TYPE_ICONS[unit.type] ?? Truck) : Truck;
                  const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS['Assigned'];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={15} className="text-gray-400 shrink-0" />
                          <span className="font-mono font-semibold text-gray-800 text-sm">{unit?.callSign ?? r.unitId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{unit?.type ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1"><Clock size={11} />{formatDate(r.assignedAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={r.status} onChange={(e) => onStatusChange(r.unitId, e.target.value)}
                          className={`text-xs border rounded px-2 py-1 bg-white font-medium ${statusColor} cursor-pointer`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{r.notes ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {deployEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Allocation History</h3>
            <div className="space-y-2">
              {[...deployEvents].reverse().map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-sm">
                  <Truck size={14} className="text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700">{e.text}</p>
                    {e.actor && <p className="text-xs text-gray-400 mt-0.5">{e.actor}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatTime(e.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-gray-200 rounded-xl w-96 max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Assign Unit</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {loadingUnits && <p className="text-gray-400 text-sm">Loading available units...</p>}
              {!loadingUnits && availableUnits.length === 0 && <p className="text-gray-400 text-sm">No available units.</p>}
              {availableUnits.map((u) => {
                const Icon = TYPE_ICONS[u.type] ?? Truck;
                return (
                  <button key={u.id} onClick={() => handleAssign(u.id)}
                    className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-left transition-colors">
                    <Icon size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm font-mono text-gray-800">{u.callSign}</p>
                      <p className="text-xs text-gray-500">{u.type} &middot; {u.organisation?.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-green-600 font-medium">Available</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
