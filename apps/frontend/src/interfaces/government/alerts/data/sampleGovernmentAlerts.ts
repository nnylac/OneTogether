import type {
  AlertMetric,
  AlertMetricDefinition,
  GovernmentAlert,
} from '../types/alert'

export const alertMetricDefinitions: AlertMetricDefinition[] = [
  {
    value: 'openIncidents',
    label: 'Open incidents',
    description: 'Total active incident tickets across agencies',
    defaultUnit: 'count',
    defaultThresholdValue: 10,
    currentValue: 13,
  },
  {
    value: 'criticalIncidents',
    label: 'Critical incidents',
    description: 'Incidents tagged as critical severity',
    defaultUnit: 'count',
    defaultThresholdValue: 5,
    currentValue: 10,
  },
  {
    value: 'hospitalOccupancy',
    label: 'Hospital occupancy',
    description: 'Average hospital bed occupancy across linked hospitals',
    defaultUnit: 'percent',
    defaultThresholdValue: 85,
    currentValue: 86,
  },
  {
    value: 'infectiousDiseaseCases',
    label: 'Infectious disease cases',
    description: 'Reported infectious disease cases in the current window',
    defaultUnit: 'count',
    defaultThresholdValue: 80,
    currentValue: 44,
  },
  {
    value: 'heatInjuryCases',
    label: 'Heat injury cases',
    description: 'Reported heat injury cases from hospitals and responders',
    defaultUnit: 'count',
    defaultThresholdValue: 35,
    currentValue: 31,
  },
  {
    value: 'floodReports',
    label: 'Flood reports',
    description: 'Flood-related citizen and agency reports',
    defaultUnit: 'count',
    defaultThresholdValue: 12,
    currentValue: 18,
  },
]

export const alertMetricLabelByValue: Record<AlertMetric, string> = {
  openIncidents: 'Open incidents',
  criticalIncidents: 'Critical incidents',
  hospitalOccupancy: 'Hospital occupancy',
  infectiousDiseaseCases: 'Infectious disease cases',
  heatInjuryCases: 'Heat injury cases',
  floodReports: 'Flood reports',
}

export const sampleGovernmentAlerts: GovernmentAlert[] = [
  {
    id: 'alert-open-incidents',
    name: 'Open incidents threshold',
    metric: 'openIncidents',
    currentValue: 13,
    thresholdValue: 10,
    condition: 'above',
    unit: 'count',
    status: 'Critical',
    notificationMessage:
      'Notify command centre when open incidents exceed the safe coordination threshold.',
    createdAt: '09 Jun 2026, 11:30 PM',
  },
  {
    id: 'alert-critical-incidents',
    name: 'Critical severity threshold',
    metric: 'criticalIncidents',
    currentValue: 10,
    thresholdValue: 5,
    condition: 'above',
    unit: 'count',
    status: 'Critical',
    notificationMessage:
      'Escalate when critical incidents exceed five active cases.',
    createdAt: '09 Jun 2026, 11:30 PM',
  },
  {
    id: 'alert-hospital-occupancy',
    name: 'Hospital occupancy threshold',
    metric: 'hospitalOccupancy',
    currentValue: 86,
    thresholdValue: 85,
    condition: 'above',
    unit: 'percent',
    status: 'Critical',
    notificationMessage:
      'Notify health operations when linked hospital occupancy exceeds 85%.',
    createdAt: '09 Jun 2026, 11:32 PM',
  },
  {
    id: 'alert-infectious-disease',
    name: 'Infectious disease cases threshold',
    metric: 'infectiousDiseaseCases',
    currentValue: 44,
    thresholdValue: 80,
    condition: 'above',
    unit: 'count',
    status: 'Normal',
    notificationMessage:
      'Prepare public health guidance if infectious disease reports approach threshold.',
    createdAt: '09 Jun 2026, 11:33 PM',
  },
  {
    id: 'alert-heat-injury',
    name: 'Heat injury cases threshold',
    metric: 'heatInjuryCases',
    currentValue: 31,
    thresholdValue: 35,
    condition: 'above',
    unit: 'count',
    status: 'Warning',
    notificationMessage:
      'Issue heat safety advisory when heat injury reports exceed expected limits.',
    createdAt: '09 Jun 2026, 11:34 PM',
  },
  {
    id: 'alert-flood-reports',
    name: 'Flood reports threshold',
    metric: 'floodReports',
    currentValue: 18,
    thresholdValue: 12,
    condition: 'above',
    unit: 'count',
    status: 'Critical',
    notificationMessage:
      'Notify flood response leads when flood reports exceed twelve active reports.',
    createdAt: '09 Jun 2026, 11:35 PM',
  },
]
