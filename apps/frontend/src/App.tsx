import { Navigate, Route, Routes } from 'react-router-dom';
import { CitizenApp } from './pages/CitizenApp';
import { GovernmentApp } from './pages/GovernmentApp';
import { LoginPage } from './pages/LoginPage';
import { OrganisationApp } from './pages/OrganisationApp';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/citizen" element={<CitizenApp />} />
      <Route path="/organisation/*" element={<OrganisationApp />} />
      <Route path="/government/*" element={<GovernmentApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
