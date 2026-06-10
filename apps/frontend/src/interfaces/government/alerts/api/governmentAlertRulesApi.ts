import type {
  AlertMetricDefinition,
  GovernmentAlert,
  NewAlertInput,
} from '../types/alert'

type GovernmentAlertRuleDto = {
  condition: GovernmentAlert['condition']
  createdAt: string
  currentValue: number
  id: string
  isEnabled: boolean
  metric: GovernmentAlert['metric']
  name: string
  notificationMessage: string
  status: GovernmentAlert['status']
  thresholdValue: number
  unit: GovernmentAlert['unit']
  updatedAt: string
}

type AlertMetricDefinitionDto = AlertMetricDefinition

export async function fetchGovernmentAlertMetricDefinitions() {
  const response = await fetch('/api/government-alert-rules/metric-definitions')

  if (!response.ok) {
    throw new Error('Unable to load alert metric definitions')
  }

  return (await response.json()) as AlertMetricDefinitionDto[]
}

export async function fetchGovernmentAlertRules() {
  const response = await fetch('/api/government-alert-rules')

  if (!response.ok) {
    throw new Error('Unable to load government alert rules')
  }

  const alerts = (await response.json()) as GovernmentAlertRuleDto[]
  return alerts.map(mapAlertRule)
}

export async function createGovernmentAlertRule(input: NewAlertInput) {
  const response = await fetch('/api/government-alert-rules', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to create government alert rule')
  }

  const alert = mapAlertRule((await response.json()) as GovernmentAlertRuleDto)
  dispatchGovernmentAlertRulesChanged()
  return alert
}

export async function updateGovernmentAlertRuleThreshold(
  alertId: string,
  thresholdValue: number,
) {
  const response = await fetch(`/api/government-alert-rules/${alertId}`, {
    body: JSON.stringify({ thresholdValue }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  })

  if (!response.ok) {
    throw new Error('Unable to update government alert rule')
  }

  const alert = mapAlertRule((await response.json()) as GovernmentAlertRuleDto)
  dispatchGovernmentAlertRulesChanged()
  return alert
}

export async function deleteGovernmentAlertRule(alertId: string) {
  const response = await fetch(`/api/government-alert-rules/${alertId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Unable to delete government alert rule')
  }

  dispatchGovernmentAlertRulesChanged()
}

function mapAlertRule(alert: GovernmentAlertRuleDto): GovernmentAlert {
  return {
    condition: alert.condition,
    createdAt: formatAlertDate(alert.createdAt),
    currentValue: alert.currentValue,
    id: alert.id,
    isEnabled: alert.isEnabled,
    metric: alert.metric,
    name: alert.name,
    notificationMessage: alert.notificationMessage,
    status: alert.status,
    thresholdValue: alert.thresholdValue,
    unit: alert.unit,
    updatedAt: formatAlertDate(alert.updatedAt),
  }
}

function formatAlertDate(date: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function dispatchGovernmentAlertRulesChanged() {
  window.dispatchEvent(new Event('government-alert-rules-changed'))
}
