import { useState } from 'react';
import { Plus, X, Truck, Ambulance, Shield, Anchor, Scan, Users, Stethoscope } from 'lucide-react';
import type { DbResourceAssignment, DbUnit } from '../../api/incidents.api';
import { fetchAvailableUnits, assignUnit } from '../../api/incidents.api';

export const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-700 border-green-300',
  Assigned: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'En Route': 'bg-blue-100 text-blue-700 border-blue-300',
  'On Scene': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  Engaged: 'bg-orange-100 text-orange-700 border-orange-300',
  Offline: 'bg-gray-100 text-gray-500 border-gray-300',
};

export const TYPE_ICONS: Record<string, React.ElementType> = {
  Ambulance, 'Fire Engine': Truck, Police: Shield, Boat: Anchor,
  Drone: Scan, 'CERT Team': Users, 'Medical Team': Stethoscope,
};

export const STATUSES = ['Assigned', 'En Route', 'On Scene', 'Engaged', 'Available', 'Offline'];

interface Props {
  incidentId: string;
  resources: DbResourceAssignment[];
  onStatusChange: (unitId: string, status: string) => void;
  onAssigned: (assignment: DbResourceAssignment) => void;
}

export function ResourcePanel({ incidentId, resources, onStatusChange, onAssigned }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<DbUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

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

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resources ({resources.length})</h3>
        <button onClick={openModal}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">
          <Plus size={12} /> Assign Unit
        </button>
      </div>

      {resources.length === 0 && <p className="text-gray-400 text-sm">No units assigned yet.</p>}

      <div className="grid grid-cols-1 gap-2">
        {resources.map((r) => {
          const unit = r.unit;
          const Icon = unit ? (TYPE_ICONS[unit.type] ?? Truck) : Truck;
          const statusColor = STATUS_COLORS[r.status] ?? STATUS_COLORS['Assigned'];
          return (
            <div key={r.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Icon size={16} className="text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-gray-800 truncate">{unit?.callSign ?? r.unitId}</p>
                <p className="text-xs text-gray-500">{unit?.type}</p>
              </div>
              <select value={r.status} onChange={(e) => onStatusChange(r.unitId, e.target.value)}
                className={`text-xs border rounded px-1.5 py-0.5 bg-white font-medium ${statusColor} cursor-pointer`}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          );
        })}
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
                    <span className="ml-auto text-xs text-green-600">Available</span>
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
