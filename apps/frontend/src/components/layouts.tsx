import { BarChart3, Bell, HeartHandshake, LayoutDashboard, LogOut, Map, Megaphone, Settings, Siren, Users, Warehouse } from 'lucide-react';
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
    { id: 'communities', label: 'Communities', Icon: Users, count: undefined },
    { id: 'volunteer', label: 'Volunteer', Icon: HeartHandshake, count: volunteerCount },
    { id: 'contact', label: 'Report', Icon: Siren, count: undefined }
  ] as const;

  return (
    <div className="min-h-screen bg-sgds-gray-100">
      <div className="phone-shell mx-auto bg-white shadow-soft">
        <Masthead />
        <header className="flex items-center justify-between border-b border-sgds-gray-200 px-4 py-3">
          <Logo />
          <button
            onClick={() => navigate('/')}
            className="border border-sgds-gray-300 px-3 py-1.5 text-xs font-semibold text-sgds-gray-700 hover:bg-sgds-gray-50"
          >
            Log out
          </button>
        </header>
        <div className="flex items-center justify-between border-b-2 border-orange-300 bg-orange-50 px-4 py-2.5 text-sm text-orange-800">
          <strong className="flex items-center gap-2"><Megaphone size={15} />Flood Alert — Orchard Area</strong>
          <button onClick={() => setTab('alerts')} className="text-xs font-semibold underline">View</button>
        </div>
        <nav className="grid grid-cols-4 border-b border-sgds-gray-200" role="tablist">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative flex min-h-[72px] flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors ${
                tab === id
                  ? 'border-b-2 border-sgds-purple bg-sgds-purple-light text-sgds-purple'
                  : 'text-sgds-gray-500 hover:bg-sgds-gray-50'
              }`}
            >
              <span className="relative">
                <Icon size={18} />
                {typeof count === 'number' && count > 0 && (
                  <span className={`absolute -right-5 -top-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${
                    tab === id ? 'bg-sgds-purple' : 'bg-sgds-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <main className="bg-sgds-gray-50 p-4">{children}</main>
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

  return (
    <div className="flex min-h-screen flex-col bg-sgds-gray-50">
      <Masthead />
      <div className="flex flex-1">
        <aside className="fixed bottom-0 left-0 top-[32px] flex w-60 flex-col border-r border-sgds-gray-200 bg-white">
          <div className="border-b border-sgds-gray-200 p-4">
            <Logo command={gov} />
          </div>
          <div className="flex items-center gap-2 border-b border-sgds-gray-100 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-safe" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sgds-gray-500">Live</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
            {menu.map(([label, Icon, path]) => (
              <NavLink
                key={label as string}
                to={`${base}${path ? `/${path}` : ''}`}
                end={!path}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-4 px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'border-sgds-purple bg-sgds-purple-light font-semibold text-sgds-purple'
                      : 'border-transparent text-sgds-gray-700 hover:bg-sgds-gray-50'
                  }`
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
          <div className="border-t border-sgds-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-sgds-purple-light text-sm font-bold text-sgds-purple">
                {gov ? 'R' : 'C'}
              </div>
              <div>
                <div className="text-sm font-semibold text-sgds-gray-900">{gov ? 'Raj Kumar' : 'Chen Xiao Ling'}</div>
                <span className="inline-block bg-sgds-purple px-2 py-0.5 text-[11px] font-bold text-white">
                  {gov ? 'gov_admin' : 'SCDF'}
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
