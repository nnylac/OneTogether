import { useRef, useState } from 'react';
import { MapPin, Shield, Activity, Tag, Calendar, Paperclip, FileText, ExternalLink } from 'lucide-react';
import type { DbIncident, DbUpload } from '../../api/incidents.api';
import { uploadFile, getUploadUrl } from './UploadsPanel';
import { LocationPickerModal } from './LocationPickerModal';

const API = import.meta.env.VITE_API_URL as string;

interface Props {
  incident: DbIncident;
  uploads: DbUpload[];
  uploadedBy: string;
  onUploaded: (upload: DbUpload) => void;
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <Icon size={14} className="text-gray-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-gray-800">{value}</div>
      </div>
    </div>
  );
}

const SEVERITY_CLS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Low: 'bg-green-100 text-green-700 border-green-300',
};

const STATUS_CLS: Record<string, string> = {
  Reported: 'bg-gray-100 text-gray-600', Unverified: 'bg-yellow-100 text-yellow-700',
  Verified: 'bg-blue-100 text-blue-700', Dispatched: 'bg-indigo-100 text-indigo-700',
  'On Scene': 'bg-green-100 text-green-700', Contained: 'bg-teal-100 text-teal-700',
  Recovery: 'bg-cyan-100 text-cyan-700', Closed: 'bg-gray-100 text-gray-400',
};

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export function InformationTab({ incident, uploads, uploadedBy, onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinningUpload, setPinningUpload] = useState<DbUpload | null>(null);
  const [localUploads, setLocalUploads] = useState<DbUpload[]>(uploads);

  // Sync when prop changes (new uploads via WebSocket)
  if (uploads !== localUploads && uploads.length !== localUploads.length) setLocalUploads(uploads);

  const images = localUploads.filter((u) => u.mimeType.startsWith('image/'));
  const files = localUploads.filter((u) => !u.mimeType.startsWith('image/'));

  async function handleFile(file: File) {
    const upload = await uploadFile(incident.id, file, uploadedBy);
    setLocalUploads(prev => [...prev, upload]);
    onUploaded(upload);
  }

  async function handlePinConfirm(lat: number, lng: number) {
    if (!pinningUpload) return;
    const res = await fetch(`${API}/incidents/${incident.id}/uploads/${pinningUpload.id}/location`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    if (res.ok) {
      const updated = await res.json() as DbUpload;
      setLocalUploads(prev => prev.map(u => u.id === updated.id ? updated : u));
    }
    setPinningUpload(null);
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="px-6 py-5 space-y-6">

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Incident Details</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 divide-y divide-gray-100">
            <MetaRow icon={Tag} label="Type" value={incident.type} />
            <MetaRow icon={Activity} label="Severity / Status" value={
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${SEVERITY_CLS[incident.severity] ?? SEVERITY_CLS['Medium']}`}>{incident.severity}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_CLS[incident.status] ?? STATUS_CLS['Reported']}`}>{incident.status}</span>
              </div>
            } />
            <MetaRow icon={MapPin} label="Location" value={incident.location} />
            {incident.zone ? <MetaRow icon={MapPin} label="Zone" value={incident.zone} /> : null}
            {incident.incidentCommander ? <MetaRow icon={Shield} label="Incident Commander" value={incident.incidentCommander} /> : null}
            {incident.confidenceScore != null ? (
              <MetaRow icon={Activity} label="Confidence Score" value={
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-[120px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${incident.confidenceScore}%` }} />
                  </div>
                  <span className="text-sm text-gray-600">{incident.confidenceScore}%</span>
                </div>
              } />
            ) : null}
            {incident.assignedOrgIds.length > 0 ? (
              <MetaRow icon={Shield} label="Assigned Organisations" value={
                <div className="flex flex-wrap gap-1">
                  {incident.assignedOrgIds.map((id) => (
                    <span key={id} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono uppercase">{id}</span>
                  ))}
                </div>
              } />
            ) : null}
            <MetaRow icon={Calendar} label="Reported" value={formatDateTime(incident.createdAt)} />
            <MetaRow icon={Calendar} label="Last Updated" value={formatDateTime(incident.updatedAt)} />
          </div>
        </div>

        {incident.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4">{incident.description}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Attached Images {images.length > 0 && <span className="text-gray-400 font-normal">({images.length})</span>}
            </h3>
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">
              <Paperclip size={12} /> Upload
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          </div>
          {images.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">No images attached yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((u) => (
                <div key={u.id} className="relative">
                  <a href={getUploadUrl(u.url)} target="_blank" rel="noreferrer"
                    className="group relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden aspect-square hover:border-indigo-400 transition-colors block">
                    <img src={getUploadUrl(u.url)} alt={u.originalName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={16} className="text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{u.originalName}</p>
                    </div>
                  </a>
                  <button
                    onClick={() => setPinningUpload(u)}
                    title={u.latitude ? 'Repin location' : 'Pin to map'}
                    className={`absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center shadow ${u.latitude ? 'bg-green-500' : 'bg-gray-400 hover:bg-indigo-500'} transition-colors`}>
                    <MapPin size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {pinningUpload && incident.latitude != null && (
            <LocationPickerModal
              incidentLat={incident.latitude}
              incidentLng={incident.longitude!}
              onConfirm={(lat, lng) => void handlePinConfirm(lat, lng)}
              onClose={() => setPinningUpload(null)}
            />
          )}
        </div>

        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Other Files</h3>
            <div className="space-y-1.5">
              {files.map((u) => (
                <a key={u.id} href={getUploadUrl(u.url)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{u.originalName}</span>
                  <span className="text-xs text-gray-400 shrink-0">{(u.size / 1024).toFixed(0)} KB</span>
                  <ExternalLink size={12} className="text-gray-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
