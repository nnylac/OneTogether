import type { DashboardMetric, DashboardNotification, ResourceSnapshot } from '../types'

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Active assigned',
    value: 3,
    detail: 'visible to SCDF',
  },
  {
    label: 'New source tickets',
    value: 2,
    detail: 'from dispatch feeds',
  },
  {
    label: 'Awaiting assignment',
    value: 1,
    detail: 'triage queue',
  },
  {
    label: 'Public alerts created',
    value: 5,
    detail: 'last 24 hours',
  },
  {
    label: 'Responders/resources',
    value: 317,
    detail: 'available partners',
  },
]

export const dashboardNotifications: DashboardNotification[] = [
  {
    id: 'notification-001',
    title: 'Flooding at Orchard Road assigned to your organisation',
    time: '2 min ago',
  },
  {
    id: 'notification-002',
    title: 'SPF marked traffic diversion active at Scotts Road',
    time: '8 min ago',
  },
  {
    id: 'notification-003',
    title: 'Public broadcast request awaiting review',
    time: '12 min ago',
  },
]

export const resourceSnapshot: ResourceSnapshot = {
  progress: [
    {
      label: 'Hospital beds available',
      value: 945,
      total: 6530,
      tone: 'orange',
    },
    {
      label: 'Volunteer responders',
      value: 317,
      total: 603,
      tone: 'green',
    },
  ],
  counts: [
    {
      label: 'Ambulances',
      value: 42,
    },
    {
      label: 'Flood pumps',
      value: 18,
    },
    {
      label: 'Relief kits',
      value: 1840,
    },
  ],
}
