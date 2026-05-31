import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Layers, Loader, MapPin, Sparkles } from 'lucide-react';
import type { DbIncident, DbResourceAssignment, DbUpload, DbTimelineEvent } from '../../api/incidents.api';
import { getUploadUrl } from './UploadsPanel';

const API = import.meta.env.VITE_API_URL as string;
const API_BASE = API.replace('/api', '');

// ── Types ─────────────────────────────────────────────────────────────────────
interface NearbyInfrastructure {
  id: string; name: string; type: string; tier: 1 | 2 | 3;
  lat: number; lng: number; distanceMetres: number; relevanceReason: string;
  status: 'operational' | 'busy' | 'unavailable' | 'unknown';
  phone?: string; website?: string; openingHours?: string; operator?: string;
  aiSuggested?: boolean; aiReason?: string;
}

interface AiSuggestion { name: string; type: string; reason: string; priority: string; }

// ── Icon colour maps ──────────────────────────────────────────────────────────
// Ring encodes operational STATUS — bright, distinct colours readable at zoom
const STATUS_RING: Record<string, string> = {
  Available: '#22c55e',
  'En Route': '#38bdf8',
  'On Scene': '#a855f7',
  Engaged:   '#f43f5e',
  Exhausted: '#7f1d1d',
  Offline:   '#6b7280',
  Assigned:  '#fbbf24',
};

// Body encodes UNIT TYPE — saturated agency colours
const UNIT_BODY: Record<string, string> = {
  Ambulance:      '#dc2626',
  'Medical Team': '#be123c',
  'Fire Engine':  '#ea580c',
  'CERT Team':    '#b45309',
  Boat:           '#0369a1',
  Drone:          '#0891b2',
  Police:         '#1d4ed8',
};

// SVG content rendered inside the unit icon
const UNIT_SYMBOL: Record<string, string> = {
  Ambulance:
    `<path d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="white"/>`,
  'Medical Team':
    `<path d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="white"/>`,
  'Fire Engine':
    `<path d="M12 4c0 0-5 3.5-5 7.5a5 5 0 0010 0C17 7.5 12 4 12 4z" fill="white"/>`,
  'CERT Team':
    `<path d="M12 4c0 0-5 3.5-5 7.5a5 5 0 0010 0C17 7.5 12 4 12 4z" fill="white"/>`,
  Boat:
    `<path d="M5 17h14l-2-6H7L5 17zm2-4h10l1 3H6l1-3zm5-6V5h1l1 2h-2z" fill="white"/>`,
  Drone:
    `<circle cx="12" cy="12" r="2" fill="white"/><circle cx="6" cy="6" r="1.5" fill="white"/><circle cx="18" cy="6" r="1.5" fill="white"/><circle cx="6" cy="18" r="1.5" fill="white"/><circle cx="18" cy="18" r="1.5" fill="white"/><line x1="8" y1="8" x2="10.5" y2="10.5" stroke="white" stroke-width="1.2"/><line x1="16" y1="8" x2="13.5" y2="10.5" stroke="white" stroke-width="1.2"/><line x1="8" y1="16" x2="10.5" y2="13.5" stroke="white" stroke-width="1.2"/><line x1="16" y1="16" x2="13.5" y2="13.5" stroke="white" stroke-width="1.2"/>`,
  Police:
    `<path d="M12 3l1.8 3.6H17l-2.7 2.7.9 3.6L12 11.4l-3.2 1.5.9-3.6L7 6.6h3.2z" fill="white"/>`,
};

const INFRA_FILL: Record<string, string> = {
  hospital: '#dc2626', ambulance_station: '#dc2626', clinic: '#f87171',
  fire_station: '#ea580c', police: '#2563eb',
  pharmacy: '#059669', shelter: '#7c3aed', social_facility: '#7c3aed',
  water_works: '#ca8a04', pumping_station: '#ca8a04', power_substation: '#ca8a04',
};

const INFRA_LABEL: Record<string, string> = {
  hospital: 'Hospital', ambulance_station: 'Ambulance', clinic: 'Clinic',
  fire_station: 'Fire Station', police: 'Police Station',
  pharmacy: 'Pharmacy', shelter: 'Shelter', social_facility: 'Social Facility',
  water_works: 'Water Works', pumping_station: 'Pumping Station',
  power_substation: 'Power Substation',
};

// ── SVG symbols ───────────────────────────────────────────────────────────────
const SYMBOLS: Record<string, string> = {
  hospital:         `<text x="12" y="16" font-size="13" font-weight="900" fill="white" text-anchor="middle" font-family="Arial">H</text>`,
  ambulance_station:`<text x="12" y="16" font-size="10" font-weight="900" fill="white" text-anchor="middle" font-family="Arial">AMB</text>`,
  fire_station:     `<path d="M12 3c0 0-5 4-5 8.5a5 5 0 0010 0C17 7 12 3 12 3z" fill="white"/>`,
  police:           `<path d="M12 3l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="white"/>`,
  clinic:           `<path d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="white"/>`,
  pharmacy:         `<text x="12" y="16" font-size="11" font-weight="900" fill="white" text-anchor="middle" font-family="Arial">Rx</text>`,
  shelter:          `<path d="M12 4L4 11h2v7h4v-4h4v4h4v-7h2z" fill="white"/>`,
  default:          `<circle cx="12" cy="12" r="4" fill="white"/>`,
};

function infraIcon(type: string, tier: 1 | 2 | 3, aiSuggested = false): L.DivIcon {
  const fill = INFRA_FILL[type] ?? '#6b7280';
  const size = tier === 1 ? 28 : tier === 2 ? 22 : 18;
  const opacity = tier === 3 ? '0.75' : '1';
  const symbol = SYMBOLS[type] ?? SYMBOLS['default'];
  const star = aiSuggested ? `<div style="position:absolute;top:-4px;right:-4px;background:#f59e0b;color:white;border-radius:50%;width:12px;height:12px;font-size:9px;line-height:12px;text-align:center;font-weight:bold;border:1px solid white">★</div>` : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;opacity:${opacity}">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" style="border-radius:${type==='fire_station'?'4px':'50%'};box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid white">
        ${symbol}
      </svg>${star}
    </div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function responderIcon(status: string, unitType?: string): L.DivIcon {
  const ring = STATUS_RING[status] ?? '#6b7280';
  const body = UNIT_BODY[unitType ?? ''] ?? '#374151';
  const symbol = UNIT_SYMBOL[unitType ?? '']
    ?? `<circle cx="12" cy="8" r="4" fill="white"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white"/>`;
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${body};border:3px solid ${ring};box-shadow:0 2px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">${symbol}</svg>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

function imageIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:6px;background:#6366f1;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
    </div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

function poiIcon(type: string): L.DivIcon {
  const colors: Record<string, string> = {
    STAGING_AREA: '#0ea5e9', COMMAND_POST: '#7c3aed', HAZARD_ZONE: '#dc2626',
    HOSPITAL: '#059669', SHELTER: '#d97706', OTHER: '#6b7280',
  };
  const c = colors[type] ?? colors['OTHER'];
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:4px;background:${c};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 22],
  });
}

function incidentIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#ea580c;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="white" stroke-width="2"/></svg>
    </div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  });
}

// ── Layers panel ──────────────────────────────────────────────────────────────
interface LayerState {
  responders: boolean; images: boolean; pois: boolean; timeline: boolean;
  tier1: boolean; tier2: boolean; tier3: boolean; ai: boolean;
}

function LayersPanel({ layers, onToggle, typeFilter, onTypeFilter, resourceTypes, infraLoading, aiLoading }:
  { layers: LayerState; onToggle: (k: keyof LayerState) => void; typeFilter: string; onTypeFilter: (t: string) => void; resourceTypes: string[]; infraLoading: boolean; aiLoading: boolean }
) {
  const [open, setOpen] = useState(true);
  const row = (label: string, key: keyof LayerState, badge?: React.ReactNode) => (
    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={layers[key]} onChange={() => onToggle(key)} className="accent-indigo-600" />
      <span className="text-xs text-gray-700">{label}</span>
      {badge}
    </label>
  );

  return (
    <div className="absolute top-3 left-3 z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg w-52">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
        <Layers size={13} /> Layers {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 opacity-60 select-none">
            <input type="checkbox" checked readOnly className="accent-indigo-600" />
            <span className="text-xs text-gray-500">Incident Location</span>
          </div>

          <p className="text-[10px] text-gray-400 uppercase tracking-wider pt-1">Infrastructure</p>
          {row('Critical Response', 'tier1', infraLoading ? <Loader size={9} className="text-gray-400 animate-spin ml-auto" /> : undefined)}
          {row('Supporting Services', 'tier2')}
          {row('Utilities / Infra', 'tier3')}

          <p className="text-[10px] text-gray-400 uppercase tracking-wider pt-1">Assigned</p>
          {row('Assigned Responders', 'responders')}
          {layers.responders && resourceTypes.length > 1 && (
            <select value={typeFilter} onChange={e => onTypeFilter(e.target.value)}
              className="ml-5 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 w-[120px]">
              <option value="">All types</option>
              {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <p className="text-[10px] text-gray-400 uppercase tracking-wider pt-1">Evidence</p>
          {row('Images', 'images')}
          {row('Points of Interest', 'pois')}
          {row('Timeline Locations', 'timeline')}

          <p className="text-[10px] text-gray-400 uppercase tracking-wider pt-1">AI</p>
          {row('AI Suggested ✨', 'ai', aiLoading ? <Loader size={9} className="text-indigo-400 animate-spin ml-auto" /> : undefined)}
        </div>
      )}
    </div>
  );
}

// ── Popup helpers ─────────────────────────────────────────────────────────────
function InfraPopup({ inf }: { inf: NearbyInfrastructure }) {
  const fill = INFRA_FILL[inf.type] ?? '#6b7280';
  const label = INFRA_LABEL[inf.type] ?? inf.type.replace(/_/g, ' ');
  return (
    <div style={{ minWidth: 200, fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <span style={{ background: fill, color: 'white', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        {inf.tier === 1 && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>CRITICAL</span>}
        {inf.aiSuggested && <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 10 }}>★ AI</span>}
      </div>
      <p style={{ fontWeight: 700, color: '#111827', marginBottom: 2, lineHeight: 1.3 }}>{inf.name}</p>
      {inf.operator && <p style={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}>{inf.operator}</p>}
      <p style={{ color: '#374151', fontSize: 11, fontStyle: 'italic', marginBottom: inf.aiReason ? 4 : 8 }}>{inf.relevanceReason}</p>
      {inf.aiReason && <p style={{ color: '#92400e', fontSize: 11, background: '#fef3c7', padding: '3px 6px', borderRadius: 3, marginBottom: 8 }}>✨ {inf.aiReason}</p>}
      {(inf.phone || inf.website || inf.openingHours) && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {inf.phone && <a href={`tel:${inf.phone}`} style={{ color: '#2563eb', fontSize: 11, textDecoration: 'none' }}>☎ {inf.phone}</a>}
          {inf.website && <a href={inf.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 11, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>🌐 {inf.website.replace(/^https?:\/\//, '')}</a>}
          {inf.openingHours && <span style={{ color: '#6b7280', fontSize: 11 }}>⏰ {inf.openingHours}</span>}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  incident: DbIncident;
  resources: DbResourceAssignment[];
  uploads: DbUpload[];
  timeline: DbTimelineEvent[];
}

export function MapTab({ incident, resources, uploads, timeline }: Props) {
  const [layers, setLayers] = useState<LayerState>({
    responders: true, images: true, pois: true, timeline: true,
    tier1: true, tier2: true, tier3: false, ai: false,
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    incident.latitude != null ? { lat: incident.latitude, lng: incident.longitude! } : null,
  );
  const [geocoding, setGeocoding] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [infrastructure, setInfrastructure] = useState<NearbyInfrastructure[]>([]);
  const [infraLoading, setInfraLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const didGeocode = useRef(false);

  // Auto-geocode on mount when no coords
  useEffect(() => {
    if (coords != null || didGeocode.current) return;
    didGeocode.current = true;
    setGeocoding(true);
    fetch(`${API}/incidents/${incident.id}/geocode`, { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((u: { latitude?: number; longitude?: number }) => {
        if (u.latitude != null && u.longitude != null) setCoords({ lat: u.latitude, lng: u.longitude });
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [coords, incident.id]);

  // Fetch infrastructure when coords available
  useEffect(() => {
    if (!coords) return;
    setInfraLoading(true);
    fetch(`${API}/incidents/${incident.id}/nearby-infrastructure`)
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then((d: NearbyInfrastructure[]) => setInfrastructure(d))
      .catch(() => {})
      .finally(() => setInfraLoading(false));
  }, [coords?.lat, coords?.lng, incident.id]);

  // Lazy-fetch AI suggestions only when AI layer is toggled on
  useEffect(() => {
    if (!layers.ai || aiSuggestions.length > 0 || !coords) return;
    setAiLoading(true);
    fetch(`${API}/incidents/${incident.id}/ai-resource-suggestions`)
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then((suggestions: AiSuggestion[]) => {
        setAiSuggestions(suggestions);
        // Annotate matching infrastructure markers with AI suggestions
        setInfrastructure(prev => prev.map(inf => {
          const match = suggestions.find(s =>
            inf.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]) ||
            s.name.toLowerCase().includes(inf.name.toLowerCase().split(' ')[0])
          );
          return match ? { ...inf, aiSuggested: true, aiReason: match.reason } : inf;
        }));
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [layers.ai, coords, incident.id]);

  const toggleLayer = (k: keyof LayerState) => setLayers(l => ({ ...l, [k]: !l[k] }));
  const resourceTypes = [...new Set(resources.map(r => r.unit?.type ?? '').filter(Boolean))];

  const visibleResponders = layers.responders
    ? resources.filter(r => r.unit?.lastKnownLat != null && (!typeFilter || r.unit?.type === typeFilter))
    : [];
  const visibleImages = layers.images ? uploads.filter(u => u.latitude != null && u.mimeType.startsWith('image/')) : [];
  const visiblePois = layers.pois ? (incident.pois ?? []) : [];
  const visibleTimeline = layers.timeline ? timeline.filter(e => e.latitude != null) : [];
  const visibleInfra = infrastructure.filter(inf =>
    (inf.tier === 1 && layers.tier1) ||
    (inf.tier === 2 && layers.tier2) ||
    (inf.tier === 3 && layers.tier3)
  );

  // Unmatched AI suggestions (text panel, no map coords)
  const unmatchedAi = layers.ai
    ? aiSuggestions.filter(s => !infrastructure.some(i => i.aiSuggested && (i.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]))))
    : [];

  function handleManualSet() {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    fetch(`${API}/incidents/${incident.id}/location`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    }).then(() => setCoords({ lat, lng })).catch(() => {});
  }

  if (geocoding) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={24} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Locating <span className="font-semibold text-gray-800">{incident.location}</span></p>
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
          <p className="text-sm font-semibold text-gray-700 mb-1">Could not locate this incident</p>
          <p className="text-xs text-gray-500 mb-4">Address &quot;{incident.location}&quot; not found in OpenStreetMap.</p>
          <div className="flex gap-2 justify-center mb-4">
            <button onClick={() => { didGeocode.current = false; }}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded">
              Try again
            </button>
            <button onClick={() => setShowManual(s => !s)}
              className="text-xs font-semibold border border-gray-300 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded">
              Enter manually
            </button>
          </div>
          {showManual && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-left space-y-2">
              <p className="text-xs text-gray-500">Singapore approx. lat 1.3, lng 103.8</p>
              <div className="flex gap-2">
                <input value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="Lat e.g. 1.3036"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <input value={manualLng} onChange={e => setManualLng(e.target.value)} placeholder="Lng e.g. 103.832"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
              <button onClick={handleManualSet} disabled={!manualLat || !manualLng}
                className="w-full text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white py-1.5 rounded">
                Set Location
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const center: [number, number] = [coords.lat, coords.lng];
  let boundary: object | null = null;
  if (incident.boundaryGeoJson) {
    try { boundary = JSON.parse(incident.boundaryGeoJson) as object; } catch { /* invalid */ }
  }

  return (
    <div className="h-full relative">
      <LayersPanel layers={layers} onToggle={toggleLayer}
        typeFilter={typeFilter} onTypeFilter={setTypeFilter}
        resourceTypes={resourceTypes} infraLoading={infraLoading} aiLoading={aiLoading} />

      {/* Unmatched AI suggestions panel */}
      {layers.ai && unmatchedAi.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] bg-white border border-amber-200 rounded-lg shadow-lg w-56 max-h-52 overflow-y-auto">
          <div className="px-3 py-2 border-b border-amber-100 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">AI Suggestions</span>
          </div>
          <div className="p-2 space-y-2">
            {unmatchedAi.map((s, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold text-gray-800">{s.name}</p>
                <p className="text-gray-500">{s.type} · {s.priority}</p>
                <p className="text-amber-700 italic mt-0.5">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors' />

        {/* Incident marker — not clustered */}
        <Marker position={center} icon={incidentIcon()}>
          <Popup>
            <div style={{ fontSize: 13, minWidth: 160 }}>
              <p style={{ fontWeight: 700, color: '#ea580c', marginBottom: 2 }}>{incident.title}</p>
              <p style={{ color: '#6b7280', fontSize: 11 }}>{incident.type} · {incident.severity} · {incident.status}</p>
              <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>{incident.location}</p>
            </div>
          </Popup>
        </Marker>

        {boundary && (
          <GeoJSON data={boundary as GeoJSON.GeoJsonObject}
            style={{ color: '#ea580c', weight: 2, fillOpacity: 0.06 }} />
        )}

        {/* Infrastructure — clustered */}
        <MarkerClusterGroup disableClusteringAtZoom={17} maxClusterRadius={50} chunkedLoading>
          {visibleInfra.map(inf => (
            <Marker key={inf.id} position={[inf.lat, inf.lng]} icon={infraIcon(inf.type, inf.tier, inf.aiSuggested)}>
              <Popup><InfraPopup inf={inf} /></Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Assigned responders — clustered separately */}
        <MarkerClusterGroup disableClusteringAtZoom={17} maxClusterRadius={40} chunkedLoading>
          {visibleResponders.map(r => (
            <Marker key={r.id} position={[r.unit!.lastKnownLat!, r.unit!.lastKnownLng!]} icon={responderIcon(r.status, r.unit?.type)}>
              <Popup>
                <div style={{ fontSize: 13, minWidth: 160 }}>
                  <p style={{ fontWeight: 700, fontFamily: 'monospace', color: '#111827' }}>{r.unit?.callSign}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ background: UNIT_BODY[r.unit?.type ?? ''] ?? '#374151', color: 'white', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{r.unit?.type ?? 'Unit'}</span>
                    <span style={{ color: STATUS_RING[r.status] ?? '#6b7280', fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                  </div>
                  {r.unit?.organisation?.name && <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 3 }}>{r.unit.organisation.name}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Images */}
        {visibleImages.map(u => (
          <Marker key={u.id} position={[u.latitude!, u.longitude!]} icon={imageIcon()}>
            <Popup>
              <div style={{ fontSize: 13 }}>
                <img src={`${API_BASE}${u.url}`} alt={u.originalName} style={{ width: 128, height: 90, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }} />
                <p style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 128 }}>{u.originalName}</p>
                <a href={getUploadUrl(u.url)} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontSize: 11 }}>View full image</a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* POIs */}
        {visiblePois.map(p => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={poiIcon(p.type)}>
            <Popup>
              <div style={{ fontSize: 13 }}>
                <p style={{ fontWeight: 700, color: '#111827' }}>{p.title}</p>
                <p style={{ color: '#6b7280', fontSize: 11 }}>{p.type.replace(/_/g, ' ')}</p>
                {p.description && <p style={{ color: '#374151', fontSize: 11, marginTop: 4 }}>{p.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Timeline location markers */}
        {visibleTimeline.map(e => (
          <Marker key={e.id} position={[e.latitude!, e.longitude!]}
            icon={L.divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:#8b5cf6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })}>
            <Popup>
              <div style={{ fontSize: 12 }}>
                <p style={{ fontWeight: 600, color: '#7c3aed' }}>{e.category}</p>
                <p style={{ color: '#374151', marginTop: 2 }}>{e.text}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
