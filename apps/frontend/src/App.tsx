import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './interfaces/auth/AuthContext'
import { LoginPage } from './interfaces/auth/pages/LoginPage'
import { ProtectedRoute } from './interfaces/auth/ProtectedRoute'
import { PublicLayout } from './interfaces/public/layout/PublicLayout'
import { AlertsPage } from './interfaces/public/alerts/pages/AlertsPage'
import { CommunityPage } from './interfaces/public/community/pages/CommunityPage'
import { ReportPage } from './interfaces/public/report/pages/ReportPage'
import { GovernmentLayout } from './interfaces/government/layout/GovernmentLayout'
import { GovernmentAnalyticsPage } from './interfaces/government/analytics/pages/GovernmentAnalyticsPage'
import { GovernmentAlertsPage} from './interfaces/government/alerts/pages/GovernmentAlertsPage'
import { GovernmentBroadcastsPage } from './interfaces/government/broadcasts/pages/GovernmentBroadcastsPage'
import { GovernmentDashboardPage } from './interfaces/government/dashboard/pages/GovernmentDashboardPage'
import { GovernmentIncidentsPage } from './interfaces/government/incidents/pages/GovernmentIncidentsPage'
import { GovernmentMapPage } from './interfaces/government/map/pages/GovernmentMapPage'
import { GovernmentOrganisationsPage } from './interfaces/government/organisations/pages/GovernmentOrganisationsPage'
import { ResponderLayout } from './interfaces/responder/layout/ResponderLayout'
import { DashboardPage } from './interfaces/responder/dashboard/pages/DashboardPage'
import { IncidentRoomPage } from './interfaces/responder/incidents/pages/IncidentRoomPage'
import { IncidentsPage } from './interfaces/responder/incidents/pages/IncidentsPage'
import { MapPage } from './interfaces/responder/map/pages/MapPage'
import { NotificationsPage } from './interfaces/responder/notifications/pages/NotificationsPage'
import { ResourcesPage } from './interfaces/responder/resources/pages/ResourcesPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="citizen" element={<PublicLayout />}>
              <Route index element={<AlertsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route
                path="volunteer"
                element={<Navigate replace to="/citizen/community?category=volunteer" />}
              />
              <Route path="community" element={<CommunityPage />} />
            </Route>
            <Route path="public" element={<PublicLayout />}>
              <Route index element={<AlertsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route
                path="volunteer"
                element={<Navigate replace to="/public/community?category=volunteer" />}
              />
              <Route path="community" element={<CommunityPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="government" element={<GovernmentLayout />}>
              <Route index element={<GovernmentDashboardPage />} />
              <Route path="incidents" element={<GovernmentIncidentsPage />} />
              <Route path="map" element={<GovernmentMapPage />} />
              <Route path="broadcasts" element={<GovernmentBroadcastsPage />} />
              <Route
                path="organisations"
                element={<GovernmentOrganisationsPage />}
              />
              <Route path="analytics" element={<GovernmentAnalyticsPage />} />
              <Route path="alerts" element={<GovernmentAlertsPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['responder']} />}>
            <Route path="responder" element={<ResponderLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route
                path="incidents/:incidentId/room"
                element={<IncidentRoomPage />}
              />
              <Route path="map" element={<MapPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
