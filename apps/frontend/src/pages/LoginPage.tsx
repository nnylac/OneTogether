import { Building2, Landmark, Lock, Mail, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Field, Logo, Masthead } from '../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <Masthead />
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-12 lg:grid-cols-[1fr_420px]">

        {/* ── Left hero ── */}
        <section className="py-4">
          <Logo />
          <h1 className="mt-8 max-w-xl text-4xl font-bold leading-snug text-sgds-gray-900">
            Centralised emergency coordination for Singapore. (test infra github actions 3)
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-sgds-gray-600">
            OneTogether aggregates incident data from hospitals, SCDF, SPF, and approved community organisations
            into shared tickets, public advisories, responder workflows, and national command dashboards.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              { label: 'Citizen Alerts', desc: 'Real-time public advisories and community support' },
              { label: 'Responder Operations', desc: 'Shared incident tickets and resource coordination' },
              { label: 'National Command', desc: 'Aggregate dashboard for government officials' }
            ].map(({ label, desc }) => (
              <div key={label} className="border border-sgds-gray-200 bg-white p-4 shadow-card">
                <div className="text-sm font-bold text-sgds-gray-900">{label}</div>
                <p className="mt-1 text-xs leading-5 text-sgds-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-sgds-gray-200 pt-5">
            <p className="text-xs text-sgds-gray-400">
              Prototype for demonstration purposes only. All data is synthetic.
              Built in accordance with the Singapore Government Design System (SGDS).
            </p>
          </div>
        </section>

        {/* ── Right login card ── */}
        <Card className="shadow-soft">
          <div className="border-b border-sgds-gray-100 px-6 py-5">
            <h2 className="text-lg font-bold text-sgds-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-sgds-gray-500">Use your government credentials or a demo account below.</p>
          </div>

          <div className="space-y-4 p-6">
            <Field label="Email address">
              <div className="flex items-center border border-sgds-gray-300 bg-white px-3 focus-within:outline focus-within:outline-2 focus-within:outline-sgds-purple">
                <Mail size={15} className="shrink-0 text-sgds-gray-400" />
                <input
                  className="w-full px-3 py-2.5 text-sm outline-none placeholder:text-sgds-gray-400"
                  placeholder="raj.kumar@gov.sg"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="flex items-center border border-sgds-gray-300 bg-white px-3 focus-within:outline focus-within:outline-2 focus-within:outline-sgds-purple">
                <Lock size={15} className="shrink-0 text-sgds-gray-400" />
                <input
                  className="w-full px-3 py-2.5 text-sm outline-none placeholder:text-sgds-gray-400"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </Field>

            <button
              onClick={() => navigate('/government')}
              className="w-full bg-sgds-purple py-3 text-sm font-semibold text-white hover:bg-sgds-purple-dark"
            >
              Sign in
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sgds-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-sgds-gray-500">or</span></div>
            </div>

            <button className="flex w-full items-center justify-center gap-2.5 bg-[#DB0000] py-3 text-sm font-bold text-white hover:bg-red-800">
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="20" fill="white" />
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="bold" fill="#DB0000">SP</text>
              </svg>
              Login with Singpass
            </button>
          </div>

          <div className="border-t border-sgds-gray-100 px-6 pb-6 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-sgds-gray-500">Demo Access</p>
            <div className="space-y-2">
              {[
                { label: 'Citizen', desc: 'Mobile alerts, community, volunteering', Icon: Smartphone, path: '/citizen' },
                { label: 'Organisation (SCDF)', desc: 'Responder operations and incident tickets', Icon: Building2, path: '/organisation' },
                { label: 'Government', desc: 'National command dashboard', Icon: Landmark, path: '/government' }
              ].map(({ label, desc, Icon, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex w-full items-center justify-between border border-sgds-gray-200 p-3 text-left transition-colors hover:border-sgds-purple hover:bg-sgds-purple-light"
                >
                  <div>
                    <div className="text-sm font-semibold text-sgds-gray-900">{label}</div>
                    <div className="text-xs text-sgds-gray-500">{desc}</div>
                  </div>
                  <Icon size={18} className="shrink-0 text-sgds-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
