import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X, MapPin } from 'lucide-react';

interface Props {
  incidentLat: number;
  incidentLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function LocationPickerModal({ incidentLat, incidentLng, onConfirm, onClose }: Props) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin size={15} className="text-indigo-500" /> Pin to Map
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={17} /></button>
        </div>
        <p className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100">
          Click on the map to set the location for this image.
          {picked && <span className="ml-2 text-indigo-600 font-medium">{picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</span>}
        </p>
        <div className="h-72">
          <MapContainer center={[incidentLat, incidentLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors' />
            <ClickHandler onPick={(lat, lng) => setPicked({ lat, lng })} />
            {picked && <Marker position={[picked.lat, picked.lng]} />}
          </MapContainer>
        </div>
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose}
            className="text-sm text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">
            Cancel
          </button>
          <button disabled={!picked} onClick={() => picked && onConfirm(picked.lat, picked.lng)}
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded px-3 py-1.5">
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
