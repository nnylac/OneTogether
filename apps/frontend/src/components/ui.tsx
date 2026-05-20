import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

const badgeTone: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  NOTICE: 'bg-orange-100 text-orange-700 border-orange-200',
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  Open: 'bg-slate-100 text-slate-700 border-slate-200',
  Triage: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-orange-100 text-orange-700 border-orange-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Public: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Private: 'bg-slate-100 text-slate-700 border-slate-200',
  Normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Warning: 'bg-orange-100 text-orange-700 border-orange-200',
  all: 'bg-blue-100 text-blue-700 border-blue-200',
  responders: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  zone: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

export function Logo({ command = false }: { command?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center bg-navy-950 text-white">
        <Shield size={18} />
      </div>
      <div>
        <div className="font-bold text-navy-950">OneTogether</div>
        <div className="text-[11px] text-slate-500">{command ? 'Command' : 'Singapore Emergency Platform'}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border border-slate-200 bg-white ${className}`}>{children}</div>;
}

export function StatCard({ label, value, sub, tone = 'navy', icon }: { label: string; value: string | number; sub?: string; tone?: 'navy' | 'red' | 'green' | 'orange'; icon?: ReactNode }) {
  const colors = {
    navy: 'border-slate-200',
    red: 'border-red-200',
    green: 'border-emerald-200',
    orange: 'border-orange-200'
  };
  return (
    <Card className={`p-4 ${colors[tone]}`}>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  const key = String(children);
  return <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-bold uppercase ${badgeTone[key] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>{children}</span>;
}

export function ProgressBar({ value, max, tone = 'bg-safe' }: { value: number; max: number; tone?: string }) {
  const pct = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="h-2 w-full bg-slate-100">
      <div className={`h-2 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AlertBanner({ status, title, detail, action }: { status: 'Warning' | 'Critical' | 'Info'; title: string; detail: string; action?: ReactNode }) {
  const style = status === 'Critical' ? 'border-red-300 bg-red-50 text-red-700' : status === 'Warning' ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-blue-300 bg-blue-50 text-blue-800';
  return (
    <div className={`flex items-center justify-between gap-3 border p-4 ${style}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-sm">{detail}</div>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, children, onClose, width = 'max-w-xl' }: { title: string; children: ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className={`max-h-[92vh] w-full overflow-auto bg-white shadow-soft ${width}`}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-bold text-slate-950">{title}</h2>
          <button className="text-2xl leading-none text-slate-500" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AIAssistantBox({ text }: { text: string }) {
  return (
    <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <div className="mb-1 flex items-center gap-2 font-bold"><CheckCircle2 size={15} /> AI recommended next action</div>
      {text}
    </div>
  );
}

export function EmptyButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${className}`}>{children}</button>;
}

export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800 ${className}`}>{children}</button>;
}

export function GreenButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={`bg-safe px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 ${className}`}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
}
