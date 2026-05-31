import { useState } from 'react';
import { Plus, X, Truck, Ambulance, Shield, Anchor, Scan, Users, Stethoscope } from 'lucide-react';
import type { DbResourceAssignment, DbUnit } from '../../api/incidents.api';
import { fetchAvailableUnits, assignUnit } from '../../api/incidents.api';

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-900/50 text-green-300 border-green-800',
  Assigned: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  'En Route': 'bg-blue-900/50 text-blue-300 border-blue-800',
  'On Scene': 'bg-indigo-900/50 text-indigo-300 border-indigo-800',
  Engaged: 'bg-orange-900/50 text-orange-300 border-orange-800',
  Offline: 'bg-gray-800 text-gray-500 border-gray-700',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Ambulance: Ambulance,
  'Fire Engine': Truck,
  Police: Shield,
  Boat: Anchor,
  Drone: Scan,
  'CERT Team': Users,
  'Medical Team': Stethoscope,
};

interface Props {
  incidentId: string;
  resources: DbResourceAssignment[];
  onStatusChange: (unitId: string, status: string) => void;
  onAssigned: (assignment: DbResourceAssignment) => void;
}

const STATUSES = ['Assigned', 'En Route', 'On Scene', 'Engaged', 'Available', 'Offline'];

export function ResourcePanel({ incidentId, resources, onStatusChange, onAssigned }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<DbUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  async function openModal() {
    setShowModal(true);
    setLoadingUnits(true);
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

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Resources ({resources.length})
        </h3>
        <button
          onClick={openModal}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 px-2 py-1 rounded transition-colors"
        >
          <Plus size={12} /> Assign Unit
        </button>
      </div>

      {resources.length === 0 && (
        <p className="text-gray-600 text-sm">No units assigned yet.</p>
      )}

      <div className="grid grid-cols-1 gap-2">
        {resources.map((r) => {
          const unit = r.unit;
          const Icon = unit ? (TYPE_ICONS[unit.type] ?? Truck) : Truck;
          const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS['Assigned'];
          return (
            <div key={r.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
              <Icon size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-gray-200 truncate">
                  {unit?.callSign ?? r.unitId}
                </p>
                <p className="text-xs text-gray-500">{unit?.type}</p>
              </div>
              <select
                value={r.status}
                onChange={(e) => onStatusChange(r.unitId, e.target.value)}
                className={`text-xs border rounded px-1.5 py-0.5 bg-transparent font-medium ${statusColor} cursor-pointer`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-gray-900 text-gray-200">{s}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Assign unit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-96 max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-gray-100">Assign Unit</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {loadingUnits && <p className="text-gray-500 text-sm">Loading available units…</p>}
              {!loadingUnits && availableUnits.length === 0 && (
                <p className="text-gray-500 text-sm">No available units.</p>
              )}
              {availableUnits.map((u) => {
                const Icon = TYPE_ICONS[u.type] ?? Truck;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleAssign(u.id)}
                    className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-left transition-colors"
                  >
                    <Icon size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-mono text-gray-200">{u.callSign}</p>
                      <p className="text-xs text-gray-500">{u.type} · {u.organisation?.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-green-400">Available</span>
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
