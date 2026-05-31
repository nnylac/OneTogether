import { useRef } from 'react';
import { Paperclip, FileImage, FileText } from 'lucide-react';
import type { DbUpload } from '../../api/incidents.api';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace('/api', '');

interface Props {
  incidentId: string;
  uploads: DbUpload[];
  uploadedBy: string;
  onUploaded: (upload: DbUpload) => void;
}

export function UploadsPanel({ incidentId, uploads, uploadedBy, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadedBy', uploadedBy);
    const r = await fetch(`${import.meta.env.VITE_API_URL}/incidents/${incidentId}/uploads`, {
      method: 'POST',
      body: fd,
    });
    if (r.ok) {
      const upload = await r.json() as DbUpload;
      onUploaded(upload);
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Evidence / Uploads ({uploads.length})
        </h3>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 px-2 py-1 rounded transition-colors"
        >
          <Paperclip size={12} /> Attach
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
        />
      </div>

      {uploads.length === 0 && (
        <p className="text-gray-600 text-sm">No evidence uploaded yet.</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {uploads.map((u) => {
          const isImage = u.mimeType.startsWith('image/');
          return (
            <a
              key={u.id}
              href={`${API_BASE}${u.url}`}
              target="_blank"
              rel="noreferrer"
              className="group relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden aspect-square flex items-center justify-center hover:border-indigo-600 transition-colors"
            >
              {isImage ? (
                <img
                  src={`${API_BASE}${u.url}`}
                  alt={u.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText size={24} className="text-gray-500" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FileImage size={16} className="text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-gray-300 truncate">{u.originalName}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
