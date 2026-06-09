export type AlertMetric =
  | 'openIncidents'
  | 'criticalIncidents'
  | 'hospitalOccupancy'
  | 'infectiousDiseaseCases'
  | 'heatInjuryCases'
  | 'floodReports'

export type AlertCondition = 'above' | 'below'

export type AlertUnit = 'count' | 'percent'

export type AlertStatus = 'Normal' | 'Warning' | 'Critical'

export type AlertFilter = 'All' | AlertStatus

export type AlertMetricDefinition = {
  value: AlertMetric
  label: string
  description: string
  defaultUnit: AlertUnit
  currentValue: number
}

export type GovernmentAlert = {
  id: string
  name: string
  metric: AlertMetric
  currentValue: number
  thresholdValue: number
  condition: AlertCondition
  unit: AlertUnit
  status: AlertStatus
  notificationMessage: string
  createdAt: string
}

export type NewAlertInput = {
  name: string
  metric: AlertMetric
  thresholdValue: number
  condition: AlertCondition
  unit: AlertUnit
  notificationMessage: string
}