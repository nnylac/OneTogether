import { useRef } from 'react';
import { Paperclip, FileImage, FileText } from 'lucide-react';
import type { DbUpload } from '../../api/incidents.api';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace('/api', '');

interface Props { incidentId: string; uploads: DbUpload[]; uploadedBy: string; onUploaded: (upload: DbUpload) => void; }

export async function uploadFile(incidentId: string, file: File, uploadedBy: string): Promise<DbUpload> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('uploadedBy', uploadedBy);
  const r = await fetch(`${import.meta.env.VITE_API_URL}/incidents/${incidentId}/uploads`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return r.json() as Promise<DbUpload>;
}

export function getUploadUrl(url: string): string {
  return `${API_BASE}${url}`;
}

export function UploadsPanel({ incidentId, uploads, uploadedBy, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const upload = await uploadFile(incidentId, file, uploadedBy);
    onUploaded(upload);
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evidence / Uploads ({uploads.length})</h3>
        <button onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">
          <Paperclip size={12} /> Attach
        </button>
        <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
      </div>

      {uploads.length === 0 && <p className="text-gray-400 text-sm">No evidence uploaded yet.</p>}

      <div className="grid grid-cols-3 gap-2">
        {uploads.map((u) => {
          const isImage = u.mimeType.startsWith('image/');
          return (
            <a key={u.id} href={getUploadUrl(u.url)} target="_blank" rel="noreferrer"
              className="group relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden aspect-square flex items-center justify-center hover:border-indigo-400 transition-colors">
              {isImage
                ? <img src={getUploadUrl(u.url)} alt={u.originalName} className="w-full h-full object-cover" />
                : <FileText size={24} className="text-gray-400" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FileImage size={16} className="text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-gray-200 truncate">{u.originalName}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
