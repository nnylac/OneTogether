import type { GovernmentAlert } from '../types/alert'
import { formatAlertValue } from '../utils/alertStatus'

type CreateNotificationPayload = {
  title: string
  message: string
  notificationType: string
  referenceType?: string
  recipients: Array<{
    recipientType: 'role'
    recipientRole: 'government'
  }>
}

export async function createGovernmentAlertNotification(
  alert: GovernmentAlert,
) {
  const response = await fetch('/api/notifications', {
    body: JSON.stringify(toNotificationPayload(alert)),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Unable to create alert notification')
  }

  const notification = await response.json()
  window.dispatchEvent(new Event('government-alert-notification-created'))
  return notification
}

function toNotificationPayload(alert: GovernmentAlert): CreateNotificationPayload {
  const currentValue = formatAlertValue(alert.currentValue, alert.unit)
  const thresholdValue = formatAlertValue(alert.thresholdValue, alert.unit)

  return {
    title: `${alert.name} triggered`,
    message: `${alert.notificationMessage} Current value is ${currentValue}; threshold limit is ${thresholdValue}.`,
    notificationType: 'government_alert_triggered',
    referenceType: 'government_alert',
    recipients: [
      {
        recipientType: 'role',
        recipientRole: 'government',
      },
    ],
  }
}
