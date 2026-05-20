import { BarChart3, Bell, HeartHandshake, LayoutDashboard, LogOut, Map, Megaphone, Settings, Siren, Users, Warehouse } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './ui';

export function MobileShell({ children, tab, setTab, alertCount = 0, volunteerCount = 0 }: { children: ReactNode; tab: string; setTab: (tab: string) => void; alertCount?: number; volunteerCount?: number }) {
  const navigate = useNavigate();
  const tabs = [
    { id: 'alerts', label: 'Alerts', Icon: Bell, count: alertCount },
    { id: 'communities', label: 'Communities', Icon: Users, count: undefined },
    { id: 'volunteer', label: 'Volunteer', Icon: HeartHandshake, count: volunteerCount },
    { id: 'contact', label: 'Report', Icon: Siren, count: undefined }
  ] as const;
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="phone-shell mx-auto bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-slate-200 p-3">
          <Logo />
          <button onClick={() => navigate('/')} className="border border-slate-200 px-3 py-2 text-xs font-semibold">Log out</button>
        </header>
        <div className="flex items-center justify-between border-b-2 border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800">
          <strong className="flex items-center gap-2"><Megaphone size={16} />Flood Alert - Orchard Area</strong>
          <button onClick={() => setTab('alerts')} className="underline">View</button>
        </div>
        <nav className="grid grid-cols-4 border-b border-slate-200">
          {tabs.map(({ id, label, Icon, count }) => (
            <button key={id} onClick={() => setTab(id)} className={`relative flex min-h-[78px] flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] ${tab === id ? 'border-b-4 border-safe bg-emerald-50 text-safe' : 'text-slate-500'}`}>
              <span className="relative">
                <Icon size={18} />
                {typeof count === 'number' && count > 0 && (
                  <span className={`absolute -right-5 -top-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white shadow-sm ${tab === id ? 'bg-safe' : 'bg-stone-200 text-slate-500'}`}>{count}</span>
                )}
              </span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
        <main className="bg-slate-50 p-4">{children}</main>
      </div>
    </div>
  );
}

export function SidebarLayout({ role, children }: { role: 'government' | 'organisation'; children: ReactNode }) {
  const navigate = useNavigate();
  const gov = role === 'government';
  const base = gov ? '/government' : '/organisation';
  const menu = gov
    ? [['Dashboard', LayoutDashboard, ''], ['Incidents', Siren, 'incidents'], ['Resources', Warehouse, 'resources'], ['Broadcasts', Megaphone, 'broadcasts'], ['Analytics', BarChart3, 'analytics'], ['Live Map', Map, 'map'], ['Alerts / Thresholds', Bell, 'thresholds'], ['Settings', Settings, 'settings']]
    : [['Dashboard', LayoutDashboard, ''], ['Incidents', Siren, 'incidents'], ['Map', Map, 'map'], ['Resources', Warehouse, 'resources'], ['Notifications', Bell, 'notifications'], ['Settings', Settings, 'settings']];
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4"><Logo command={gov} /></div>
        <div className="border-b border-slate-200 p-4 text-xs uppercase tracking-wide text-slate-500"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-safe" />Live</div>
        <nav className="flex-1 py-3">
          {menu.map(([label, Icon, path]) => (
            <NavLink key={label as string} to={`${base}${path ? `/${path}` : ''}`} end={!path} className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm ${isActive ? 'bg-navy-950 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Icon size={17} /> {label as string}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-navy-800">{gov ? 'R' : 'C'}</div>
            <div>
              <div className="text-sm">{gov ? 'Raj Kumar' : 'Chen Xiao Ling'}</div>
              <div className="inline-block bg-safe px-2 py-0.5 text-[11px] font-bold text-white">{gov ? 'gov_admin' : 'SCDF'}</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-slate-500"><LogOut size={15} /> Logout</button>
        </div>
      </aside>
      <main className="ml-60 w-[calc(100%-15rem)] p-8">{children}</main>
    </div>
  );
}
