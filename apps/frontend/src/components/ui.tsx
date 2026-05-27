import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

// ─── Masthead ────────────────────────────────────────────────────────────────

export function Masthead() {
  return (
    <div className="flex items-center gap-2.5 bg-black px-4 py-2">
      <svg width="18" height="18" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="30" cy="30" r="30" fill="#EF3340" />
        <path d="M30 12c-2 5-7 6-11 4 2 4 1 9-3 11 5 0 8 4 7 9 3-4 8-4 11 0-1-5 2-9 7-9-4-2-5-7-3-11-4 2-9 1-8-4z" fill="white" />
        <circle cx="20" cy="22" r="2" fill="white" />
        <circle cx="24" cy="18" r="2" fill="white" />
        <circle cx="29" cy="16" r="2" fill="white" />
        <circle cx="34" cy="18" r="2" fill="white" />
        <circle cx="38" cy="22" r="2" fill="white" />
      </svg>
      <span className="text-xs font-medium text-white">A Singapore Government Agency Website</span>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function Logo({ command = false }: { command?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center bg-navy-950 text-white">
        <Shield size={18} />
      </div>
      <div>
        <div className="text-sm font-bold text-navy-950">OneTogether</div>
        <div className="text-[11px] text-sgds-gray-500">{command ? 'Command Centre' : 'Singapore Emergency Platform'}</div>
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'success';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-sgds-purple text-white hover:bg-sgds-purple-dark active:bg-sgds-purple-dark',
  outline: 'border border-sgds-gray-300 bg-white text-sgds-gray-800 hover:bg-sgds-gray-50',
  danger: 'bg-critical text-white hover:bg-red-700',
  ghost: 'text-sgds-gray-700 hover:bg-sgds-gray-100',
  success: 'bg-safe text-white hover:bg-emerald-700'
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <Button variant="primary" onClick={onClick} className={className}>{children}</Button>;
}

export function EmptyButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <Button variant="outline" onClick={onClick} className={className}>{children}</Button>;
}

export function GreenButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return <Button variant="success" onClick={onClick} className={className}>{children}</Button>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-sgds-gray-200 bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

const statAccent: Record<string, string> = {
  default: 'border-t-2 border-t-sgds-gray-300',
  red: 'border-t-2 border-t-critical',
  green: 'border-t-2 border-t-safe',
  orange: 'border-t-2 border-t-warning',
  navy: 'border-t-2 border-t-navy-950'
};
const statVal: Record<string, string> = {
  default: 'text-sgds-gray-900',
  red: 'text-critical',
  green: 'text-safe',
  orange: 'text-warning',
  navy: 'text-navy-950'
};

export function StatCard({ label, value, sub, tone = 'default', icon }: { label: string; value: string | number; sub?: string; tone?: string; icon?: ReactNode }) {
  return (
    <Card className={`p-4 ${statAccent[tone] ?? statAccent.default}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-sgds-gray-500">
        <span>{label}</span>
        {icon && <span className="text-sgds-gray-400">{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-bold ${statVal[tone] ?? statVal.default}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-sgds-gray-500">{sub}</div>}
    </Card>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const badgeTone: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  NOTICE: 'bg-orange-100 text-orange-700 border-orange-200',
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  Open: 'bg-sgds-gray-100 text-sgds-gray-700 border-sgds-gray-200',
  Triage: 'bg-amber-100 text-amber-800 border-amber-200',
  Dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-orange-100 text-orange-700 border-orange-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Public: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Private: 'bg-sgds-gray-100 text-sgds-gray-600 border-sgds-gray-200',
  Normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Warning: 'bg-amber-100 text-amber-700 border-amber-200',
  Live: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  all: 'bg-blue-100 text-blue-700 border-blue-200',
  responders: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  zone: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  deployed: 'bg-blue-100 text-blue-700 border-blue-200',
  Limited: 'bg-amber-100 text-amber-700 border-amber-200',
  Government: 'bg-blue-100 text-blue-700 border-blue-200',
  Healthcare: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  NGO: 'bg-purple-100 text-purple-700 border-purple-200',
  Grassroots: 'bg-orange-100 text-orange-700 border-orange-200'
};

export function Badge({ children }: { children: ReactNode }) {
  const key = String(children);
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeTone[key] ?? 'bg-sgds-gray-100 text-sgds-gray-700 border-sgds-gray-200'}`}>
      {children}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value, max, tone = 'bg-safe' }: { value: number; max: number; tone?: string }) {
  const pct = Math.max(3, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="h-1.5 w-full rounded-full bg-sgds-gray-200">
      <div className={`h-1.5 rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── AlertBanner ──────────────────────────────────────────────────────────────

export function AlertBanner({ status, title, detail, action }: { status: 'Warning' | 'Critical' | 'Info'; title: string; detail: string; action?: ReactNode }) {
  const style =
    status === 'Critical' ? 'border-red-300 bg-red-50 text-red-800' :
    status === 'Warning' ? 'border-amber-300 bg-amber-50 text-amber-900' :
    'border-blue-200 bg-blue-50 text-blue-800';
  return (
    <div role="alert" className={`flex items-center justify-between gap-4 border p-4 ${style}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
        <div>
          <div className="text-sm font-bold">{title}</div>
          <div className="text-sm opacity-90">{detail}</div>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ title, children, onClose, width = 'max-w-xl' }: { title: string; children: ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`max-h-[92vh] w-full overflow-auto bg-white shadow-soft ${width}`}>
        <div className="flex items-center justify-between border-b border-sgds-gray-200 px-5 py-4">
          <h2 id="modal-title" className="text-base font-bold text-sgds-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="grid h-8 w-8 place-items-center text-sgds-gray-500 hover:bg-sgds-gray-100 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-sgds-gray-800">{label}</span>
      {children}
      {helper && <span className="mt-1 block text-xs text-sgds-gray-500">{helper}</span>}
    </label>
  );
}

// ─── AIAssistantBox ───────────────────────────────────────────────────────────

export function AIAssistantBox({ text }: { text: string }) {
  return (
    <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <div className="mb-1 flex items-center gap-2 font-bold"><CheckCircle2 size={15} /> AI recommended next action</div>
      {text}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-sgds-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-sgds-gray-500">{children}</thead>;
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string } & ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`border-b border-sgds-gray-200 px-4 py-3 ${className}`}>{children}</th>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-sgds-gray-100">{children}</tbody>;
}

export function Tr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-sgds-gray-50 ${className}`}>{children}</tr>;
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string } & TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-sgds-gray-800 ${className}`}>{children}</td>;
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-sgds-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-sgds-gray-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

// ─── InfoCell ─────────────────────────────────────────────────────────────────

export function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sgds-gray-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-sgds-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-sgds-gray-900">{value}</div>
    </div>
  );
}
