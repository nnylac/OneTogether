import { Building2, Landmark, Lock, Mail, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Field, Logo, PrimaryButton } from '../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#edf5ff_55%,#ecfdf5_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1fr_430px]">
        <section>
          <div className="mb-8"><Logo /></div>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight text-navy-950">Centralized emergency coordination for Singapore.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">OneTogether aggregates incident data from hospitals, SCDF, SPF, and approved community organisations into shared tickets, public advisories, responder workflows, and government command dashboards.</p>
          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {['Citizen alerts', 'Responder coordination', 'National command'].map((item) => (
              <Card key={item} className="p-4 text-sm font-semibold text-navy-950">{item}</Card>
            ))}
          </div>
        </section>
        <Card className="p-6 shadow-soft">
          <div className="mb-6">
            <Logo />
            <h2 className="mt-6 text-2xl font-bold text-slate-950">Login</h2>
            <p className="text-sm text-slate-500">Use demo access to open a role-based interface.</p>
          </div>
          <div className="space-y-4">
            <Field label="Email">
              <div className="flex items-center border border-slate-200 px-3"><Mail size={16} className="text-slate-400" /><input className="w-full px-3 py-3 outline-none" placeholder="raj.kumar@gov.sg" /></div>
            </Field>
            <Field label="Password">
              <div className="flex items-center border border-slate-200 px-3"><Lock size={16} className="text-slate-400" /><input type="password" className="w-full px-3 py-3 outline-none" placeholder="••••••••" /></div>
            </Field>
            <PrimaryButton className="w-full py-3" onClick={() => navigate('/government')}>Login</PrimaryButton>
            <button className="w-full border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700">Singpass Login</button>
          </div>
          <div className="mt-6 grid gap-3">
            <button onClick={() => navigate('/citizen')} className="flex items-center justify-between border border-slate-200 p-3 text-left hover:bg-slate-50"><span><strong>Citizen Demo</strong><br /><small>Mobile official alerts and community help</small></span><Smartphone /></button>
            <button onClick={() => navigate('/organisation')} className="flex items-center justify-between border border-slate-200 p-3 text-left hover:bg-slate-50"><span><strong>Organisation Demo</strong><br /><small>SCDF responder operations</small></span><Building2 /></button>
            <button onClick={() => navigate('/government')} className="flex items-center justify-between border border-slate-200 p-3 text-left hover:bg-slate-50"><span><strong>Government Demo</strong><br /><small>National command dashboard</small></span><Landmark /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}
