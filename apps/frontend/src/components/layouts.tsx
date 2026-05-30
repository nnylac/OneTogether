import { AlertTriangle, BarChart3, Bell, HeartHandshake, LayoutDashboard, LogOut, Map, Megaphone, Phone, Radio, Settings, Siren, Users, Warehouse } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo, Masthead } from './ui';

export function MobileShell({
  children,
  tab,
  setTab,
  alertCount = 0,
  volunteerCount = 0
}: {
  children: ReactNode;
  tab: string;
  setTab: (tab: string) => void;
  alertCount?: number;
  volunteerCount?: number;
}) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'alerts', label: 'Alerts', Icon: Bell, count: alertCount },
    { id: 'report', label: 'Report', Icon: Radio, count: undefined },
    { id: 'communities', label: 'Community', Icon: Users, count: undefined },
    { id: 'volunteer', label: 'Volunteer', Icon: HeartHandshake, count: volunteerCount },
    { id: 'contact', label: 'Contact', Icon: Phone, count: undefined }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="phone-shell mx-auto bg-white shadow-soft">
        <Masthead />

        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <Logo />
          <button
            onClick={() => navigate('/')}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Log out
          </button>
        </header>

        <div className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50 px-5 py-2">
          <AlertTriangle size={13} className="shrink-0 text-amber-600" />
          <span className="text-xs font-medium text-amber-800">Flood Alert — Orchard Area</span>
          <button
            onClick={() => setTab('alerts')}
            className="ml-auto shrink-0 text-xs font-semibold text-sgds-purple hover:underline"
          >
            View
          </button>
        </div>

        <nav className="grid grid-cols-5 border-b border-slate-100 bg-white" role="tablist">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 border-b-2 px-2 py-3 text-[11px] font-medium transition-colors ${
                tab === id
                  ? 'border-sgds-purple text-sgds-purple'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="relative">
                <Icon size={17} strokeWidth={tab === id ? 2.5 : 1.75} />
                {typeof count === 'number' && count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sgds-purple px-0.5 text-[9px] font-bold text-white">
                    {count}
                  </span>
                )}
              </span>
              <span>{label}</span>
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
    ? [
        ['Dashboard', LayoutDashboard, ''],
        ['Incidents', Siren, 'incidents'],
        ['Resources', Warehouse, 'resources'],
        ['Broadcasts', Megaphone, 'broadcasts'],
        ['Analytics', BarChart3, 'analytics'],
        ['Live Map', Map, 'map'],
        ['Alerts / Thresholds', Bell, 'thresholds'],
        ['Settings', Settings, 'settings']
      ]
    : [
        ['Dashboard', LayoutDashboard, ''],
        ['Incidents', Siren, 'incidents'],
        ['Map', Map, 'map'],
        ['Resources', Warehouse, 'resources'],
        ['Notifications', Bell, 'notifications'],
        ['Settings', Settings, 'settings']
      ];

  const sidebarBg = 'bg-white border-sgds-gray-200';
  const headerBorder = 'border-sgds-gray-200';
  const statusBorder = 'border-sgds-gray-100';
  const footerBorder = 'border-sgds-gray-200';

  return (
    <div className="flex min-h-screen flex-col bg-sgds-gray-50">
      <Masthead />
      <div className="flex flex-1">
        <aside className={`fixed bottom-0 left-0 top-[32px] flex w-60 flex-col border-r ${sidebarBg}`}>
          <div className={`border-b ${headerBorder} p-4`}>
            <Logo command={gov} />
          </div>
          <div className={`flex items-center gap-2 border-b ${statusBorder} px-4 py-2.5`}>
            <span className="h-2 w-2 rounded-full bg-eoc-green animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sgds-gray-500">
              {gov ? 'EOC ACTIVE' : 'Live'}
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
            {menu.map(([label, Icon, path]) => (
              <NavLink
                key={label as string}
                to={`${base}${path ? `/${path}` : ''}`}
                end={!path}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-4 px-5 py-2.5 text-sm transition-colors ${isActive ? 'border-sgds-purple bg-sgds-purple-light font-semibold text-sgds-purple' : 'border-transparent text-sgds-gray-700 hover:bg-sgds-gray-50'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-sgds-purple' : 'text-sgds-gray-500'} />
                    {label as string}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className={`border-t ${footerBorder} p-4`}>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-sgds-purple-light text-sm font-bold text-sgds-purple">
                {gov ? 'R' : 'C'}
              </div>
              <div>
                <div className="text-sm font-semibold text-sgds-gray-900">{gov ? 'Raj Kumar' : 'Chen Xiao Ling'}</div>
                <span className="inline-block bg-sgds-purple px-2 py-0.5 text-[11px] font-bold text-white">
                  {gov ? 'GOV ADMIN' : 'SCDF'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-sgds-gray-500 hover:text-sgds-gray-800"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>
        <main className="ml-60 w-[calc(100%-15rem)] p-8">{children}</main>
      </div>
    </div>
  );
}
