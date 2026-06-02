import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './interfaces/public/layout/PublicLayout'
import { AlertsPage } from './interfaces/public/alerts/pages/AlertsPage'
import { CommunityPage } from './interfaces/public/community/pages/CommunityPage'
import { ProfilePage } from './interfaces/public/profile/pages/ProfilePage'
import { ReportPage } from './interfaces/public/report/pages/ReportPage'
import { VolunteerPage } from './interfaces/public/volunteer/pages/VolunteerPage'
import { GovernmentLayout } from './interfaces/government/layout/GovernmentLayout'
import { GovernmentAnalyticsPage } from './interfaces/government/analytics/pages/GovernmentAnalyticsPage'
import { GovernmentBroadcastsPage } from './interfaces/government/broadcasts/pages/GovernmentBroadcastsPage'
import { GovernmentDashboardPage } from './interfaces/government/dashboard/pages/GovernmentDashboardPage'
import { GovernmentIncidentsPage } from './interfaces/government/incidents/pages/GovernmentIncidentsPage'
import { GovernmentMapPage } from './interfaces/government/map/pages/GovernmentMapPage'
import { GovernmentOrganisationsPage } from './interfaces/government/organisations/pages/GovernmentOrganisationsPage'
import { GovernmentSettingsPage } from './interfaces/government/settings/pages/GovernmentSettingsPage'
import { ResponderLayout } from './interfaces/responder/layout/ResponderLayout'
import { DashboardPage } from './interfaces/responder/dashboard/pages/DashboardPage'
import { IncidentRoomPage } from './interfaces/responder/incidents/pages/IncidentRoomPage'
import { IncidentsPage } from './interfaces/responder/incidents/pages/IncidentsPage'
import { MapPage } from './interfaces/responder/map/pages/MapPage'
import { NotificationsPage } from './interfaces/responder/notifications/pages/NotificationsPage'
import { ResourcesPage } from './interfaces/responder/resources/pages/ResourcesPage'
import { SettingsPage } from './interfaces/responder/settings/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/responder" replace />} />
        <Route path="public" element={<PublicLayout />}>
          <Route index element={<AlertsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="volunteer" element={<VolunteerPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="government" element={<GovernmentLayout />}>
          <Route index element={<GovernmentDashboardPage />} />
          <Route path="incidents" element={<GovernmentIncidentsPage />} />
          <Route path="map" element={<GovernmentMapPage />} />
          <Route path="broadcasts" element={<GovernmentBroadcastsPage />} />
          <Route path="organisations" element={<GovernmentOrganisationsPage />} />
          <Route path="analytics" element={<GovernmentAnalyticsPage />} />
          <Route path="settings" element={<GovernmentSettingsPage />} />
        </Route>
        <Route path="responder" element={<ResponderLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:incidentId/room" element={<IncidentRoomPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
