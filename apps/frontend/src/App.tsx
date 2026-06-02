import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ResponderLayout } from './interfaces/responder/layout/ResponderLayout'
import { DashboardPage } from './interfaces/responder/pages/DashboardPage'
import { IncidentsPage } from './interfaces/responder/pages/IncidentsPage'
import { SettingsPage } from './interfaces/responder/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/responder" replace />} />
        <Route path="responder" element={<ResponderLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
