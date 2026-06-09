const GOVERNMENT_ALERT_NOTIFICATION_TYPE = 'government_alert_triggered'

type NotificationResponse = {
  id: string
}

export async function fetchUnreadGovernmentAlertNotificationCount() {
  const searchParams = new URLSearchParams({
    recipientType: 'role',
    recipientRole: 'government',
    notificationType: GOVERNMENT_ALERT_NOTIFICATION_TYPE,
    isRead: 'false',
  })

  const response = await fetch(`/api/notifications?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Unable to load unread alert notifications')
  }

  const notifications = (await response.json()) as NotificationResponse[]
  return notifications.length
}

export async function markGovernmentAlertNotificationsRead() {
  const response = await fetch('/api/notifications/read-all', {
    body: JSON.stringify({
      recipientType: 'role',
      recipientRole: 'government',
      notificationType: GOVERNMENT_ALERT_NOTIFICATION_TYPE,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })

  if (!response.ok) {
    throw new Error('Unable to mark alert notifications as read')
  }

  return response.json()
}
