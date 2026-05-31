import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Loader, MapPin } from 'lucide-react';
import type { DbIncident, DbResourceAssignment, DbUpload, DbTimelineEvent } from '../../api/incidents.api';
import { getUploadUrl } from './UploadsPanel';

const API = import.meta.env.VITE_API_URL as string;
const API_BASE = API.replace('/api', '');

// ── Types ─────────────────────────────────────────────────────────────────────
interface NearbyInfrastructure {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceMetres: number;
  relevanceReason: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  Available: '#16a34a', Assigned: '#ca8a04', 'En Route': '#2563eb',
  'On Scene': '#4f46e5', Engaged: '#ea580c', Offline: '#9ca3af',
};

const INFRA_COLOR: Record<string, string> = {
  hospital: '#dc2626', clinic: '#dc2626', pharmacy: '#059669',
  fire_station: '#ea580c', police: '#2563eb',
  shelter: '#7c3aed', default: '#6b7280',
};

const INFRA_LABEL: Record<string, string> = {
  hospital: 'Hospital', clinic: 'Clinic', pharmacy: 'Pharmacy',
  fire_station: 'Fire Station', police: 'Police',
  shelter: 'Shelter',
};

function resourceIcon(status: string) {
  const color = STATUS_COLOR[status] ?? '#9ca3af';
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M17 8h2a2 2 0 012 2v6H1v-6a2 2 0 012-2h2V6a6 6 0 0112 0v2zM12 4a4 4 0 00-4 4v2h8V8a4 4 0 00-4-4z"/></svg>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  });
}

function imageIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:6px;background:#6366f1;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

function poiIcon(type: string) {
  const colors: Record<string, string> = {
    STAGING_AREA: '#0ea5e9', COMMAND_POST: '#7c3aed', HAZARD_ZONE: '#dc2626',
    HOSPITAL: '#059669', SHELTER: '#d97706', OTHER: '#6b7280',
  };
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:4px;background:${colors[type] ?? colors['OTHER']};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 22],
  });
}

function incidentIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#ea580c;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="white" stroke-width="2"/></svg>
    </div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });
}

function infraIcon(type: string) {
  const color = INFRA_COLOR[type] ?? INFRA_COLOR['default'];
  // Diamond shape for infrastructure (distinct from circular resource markers)
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);transform:rotate(45deg)"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

// ── Layers panel ──────────────────────────────────────────────────────────────
interface LayerState {
  resources: boolean;
  images: boolean;
  pois: boolean;
  timelineLocations: boolean;
  infrastructure: boolean;
}

function LayersPanel({ layers, onToggle, resourceTypeFilter, onTypeFilter, resourceTypes, infraLoading }:
  { layers: LayerState; onToggle: (k: keyof LayerState) => void; resourceTypeFilter: string; onTypeFilter: (t: string) => void; resourceTypes: string[]; infraLoading: boolean }
) {
  const [open, setOpen] = useState(true);
  const row = (label: string, key: keyof LayerState, badge?: React.ReactNode) => (
    <label key={key} className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={layers[key]} onChange={() => onToggle(key)} className="accent-indigo-600" />
      <span className="text-xs text-gray-700">{label}</span>
      {badge}
    </label>
  );
  return (
    <div className="absolute top-3 left-3 z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg min-w-[185px]">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
        <Layers size={13} /> Layers {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 opacity-60">
            <input type="checkbox" checked readOnly className="accent-indigo-600" />
            <span className="text-xs text-gray-500">Incident Location</span>
          </div>
          {row('Resources', 'resources')}
          {layers.resources && resourceTypes.length > 1 && (
            <select value={resourceTypeFilter} onChange={e => onTypeFilter(e.target.value)}
              className="ml-5 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 w-[120px]">
              <option value="">All types</option>
              {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {row('Evidence (images)', 'images')}
          {row('Points of Interest', 'pois')}
          {row('Timeline Locations', 'timelineLocations')}
          {row(
            'Nearby Infrastructure',
            'infrastructure',
            infraLoading ? <Loader size={10} className="text-gray-400 animate-spin ml-auto" /> : undefined,
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  incident: DbIncident;
  resources: DbResourceAssignment[];
  uploads: DbUpload[];
  timeline: DbTimelineEvent[];
}

export function MapTab({ incident, resources, uploads, timeline }: Props) {
  const [layers, setLayers] = useState<LayerState>({
    resources: true, images: true, pois: true, timelineLocations: true, infrastructure: true,
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    incident.latitude != null ? { lat: incident.latitude, lng: incident.longitude! } : null,
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [infrastructure, setInfrastructure] = useState<NearbyInfrastructure[]>([]);
  const [infraLoading, setInfraLoading] = useState(false);
  const didGeocode = useRef(false);

  // Auto-geocode when map opens with no coords
  useEffect(() => {
    if (coords != null || didGeocode.current) return;
    didGeocode.current = true;
    setGeocoding(true);
    setGeocodeError(false);
    fetch(`${API}/incidents/${incident.id}/geocode`, { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((updated: { latitude?: number; longitude?: number }) => {
        if (updated.latitude != null && updated.longitude != null) {
          setCoords({ lat: updated.latitude, lng: updated.longitude });
        } else {
          setGeocodeError(true);
        }
      })
      .catch(() => setGeocodeError(true))
      .finally(() => setGeocoding(false));
  }, [coords, incident.id]);

  // Fetch nearby infrastructure once coords are known
  useEffect(() => {
    if (!coords) return;
    setInfraLoading(true);
    fetch(`${API}/incidents/${incident.id}/nearby-infrastructure`)
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then((data: NearbyInfrastructure[]) => setInfrastructure(data))
      .catch(() => {})
      .finally(() => setInfraLoading(false));
  }, [coords?.lat, coords?.lng, incident.id]);

  function handleManualSet() {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    fetch(`${API}/incidents/${incident.id}/location`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    }).then(() => setCoords({ lat, lng })).catch(() => {});
  }

  const toggleLayer = (k: keyof LayerState) => setLayers(l => ({ ...l, [k]: !l[k] }));
  const resourceTypes = [...new Set(resources.map(r => r.unit?.type ?? '').filter(Boolean))];
  const visibleResources = layers.resources
    ? resources.filter(r => r.unit?.lastKnownLat != null && (!typeFilter || r.unit?.type === typeFilter))
    : [];
  const visibleImages = layers.images ? uploads.filter(u => u.latitude != null && u.mimeType.startsWith('image/')) : [];
  const visiblePois = layers.pois ? (incident.pois ?? []) : [];
  const visibleTimeline = layers.timelineLocations ? timeline.filter(e => e.latitude != null) : [];
  const visibleInfra = layers.infrastructure ? infrastructure : [];

  if (geocoding) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={24} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Locating <span className="text-gray-800 font-semibold">{incident.location}</span></p>
          <p className="text-xs text-gray-400 mt-1">Searching OpenStreetMap...</p>
        </div>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm w-full">
          <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 mb-1">Could not find coordinates</p>
          <p className="text-xs text-gray-500 mb-1">
            Location: <span className="font-medium text-gray-700">&quot;{incident.location}&quot;</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Address not found in OpenStreetMap. Try again or enter coordinates manually.
          </p>
          <div className="flex gap-2 justify-center mb-4">
            <button onClick={() => { didGeocode.current = false; setGeocodeError(false); }}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors">
              Try again
            </button>
            <button onClick={() => setShowManual(s => !s)}
              className="text-xs font-semibold border border-gray-300 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded transition-colors">
              Enter manually
            </button>
          </div>
          {showManual && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-left space-y-2">
              <p className="text-xs text-gray-500">Singapore is approx. lat 1.3, lng 103.8</p>
              <div className="flex gap-2">
                <input value={manualLat} onChange={e => setManualLat(e.target.value)}
                  placeholder="Lat e.g. 1.3036"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <input value={manualLng} onChange={e => setManualLng(e.target.value)}
                  placeholder="Lng e.g. 103.832"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
              <button onClick={handleManualSet} disabled={!manualLat || !manualLng}
                className="w-full text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white py-1.5 rounded transition-colors">
                Set Location
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Suppress unused variable warning
  void geocodeError;

  const center: [number, number] = [coords.lat, coords.lng];
  let boundary: object | null = null;
  if (incident.boundaryGeoJson) {
    try { boundary = JSON.parse(incident.boundaryGeoJson) as object; } catch { /* invalid */ }
  }

  return (
    <div className="h-full relative">
      <LayersPanel layers={layers} onToggle={toggleLayer}
        resourceTypeFilter={typeFilter} onTypeFilter={setTypeFilter}
        resourceTypes={resourceTypes} infraLoading={infraLoading} />

      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors' />

        {/* Incident marker */}
        <Marker position={center} icon={incidentIcon()}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-orange-600">{incident.title}</p>
              <p className="text-gray-600 text-xs">{incident.type} &middot; {incident.severity} &middot; {incident.status}</p>
              <p className="text-gray-500 text-xs mt-1">{incident.location}</p>
            </div>
          </Popup>
        </Marker>

        {/* Boundary */}
        {boundary && (
          <GeoJSON data={boundary as GeoJSON.GeoJsonObject}
            style={{ color: '#ea580c', weight: 2, fillOpacity: 0.08 }} />
        )}

        {/* Assigned resource markers */}
        {visibleResources.map(r => (
          <Marker key={r.id} position={[r.unit!.lastKnownLat!, r.unit!.lastKnownLng!]} icon={resourceIcon(r.status)}>
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold font-mono text-gray-800">{r.unit?.callSign}</p>
                <p className="text-xs text-gray-500">{r.unit?.type} &middot; {r.unit?.organisation?.name}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: STATUS_COLOR[r.status] }}>{r.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Image markers */}
        {visibleImages.map(u => (
          <Marker key={u.id} position={[u.latitude!, u.longitude!]} icon={imageIcon()}>
            <Popup>
              <div className="text-sm">
                <img src={`${API_BASE}${u.url}`} alt={u.originalName} className="w-32 h-24 object-cover rounded mb-1" />
                <p className="text-xs text-gray-700 truncate max-w-[128px]">{u.originalName}</p>
                <a href={getUploadUrl(u.url)} target="_blank" rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline">View full image</a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* POI markers */}
        {visiblePois.map(p => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={poiIcon(p.type)}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{p.title}</p>
                <p className="text-xs text-gray-500">{p.type.replace(/_/g, ' ')}</p>
                {p.description && <p className="text-xs text-gray-600 mt-1">{p.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Timeline location markers */}
        {visibleTimeline.map(e => (
          <Marker key={e.id} position={[e.latitude!, e.longitude!]}
            icon={L.divIcon({ className: '', html: `<div style="width:16px;height:16px;border-radius:50%;background:#8b5cf6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })}>
            <Popup>
              <div className="text-sm">
                <p className="text-xs font-semibold text-purple-600">{e.category}</p>
                <p className="text-xs text-gray-700 mt-0.5">{e.text}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Nearby infrastructure markers (diamond shape, distinct from circular resource markers) */}
        {visibleInfra.map(inf => (
          <Marker key={inf.id} position={[inf.lat, inf.lng]} icon={infraIcon(inf.type)}>
            <Popup>
              <div className="text-sm min-w-[180px]">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                    style={{ background: INFRA_COLOR[inf.type] ?? INFRA_COLOR['default'] }}>
                    {(INFRA_LABEL[inf.type] ?? inf.type).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 leading-tight">{inf.name}</p>
                {inf.operator && <p className="text-xs text-gray-500 mt-0.5">{inf.operator}</p>}
                <p className="text-xs text-gray-500 mt-1 italic">{inf.relevanceReason}</p>
                {(inf.phone || inf.website || inf.openingHours) && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                    {inf.phone && (
                      <a href={`tel:${inf.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <span>&#x260F;</span> {inf.phone}
                      </a>
                    )}
                    {inf.website && (
                      <a href={inf.website} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate max-w-[170px]">
                        <span>&#x1F310;</span> {inf.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {inf.openingHours && (
                      <p className="text-xs text-gray-500">&#x23F0; {inf.openingHours}</p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
