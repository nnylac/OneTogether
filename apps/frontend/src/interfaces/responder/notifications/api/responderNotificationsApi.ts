import { io, type Socket } from "socket.io-client";

export const responderIncidentAssignedNotificationType = "incident_assigned";

export type ResponderNotificationResponse = {
  createdAt: string;
  id: string;
  message: string;
  metadata?: unknown;
  notificationType: string;
  recipients: Array<{
    id: string;
    isRead: boolean;
    recipientId: string | null;
    recipientRole: string | null;
    recipientType: string;
  }>;
  referenceId: string | null;
  referenceType: string | null;
  title: string;
};

let notificationSocket: Socket | null = null;

export async function fetchResponderNotifications(organisationId: string) {
  const params = new URLSearchParams({
    notificationType: responderIncidentAssignedNotificationType,
    recipientId: organisationId,
    recipientType: "organisation",
    take: "20",
  });

  const response = await fetch(`/api/notifications?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load responder notifications");
  }

  return (await response.json()) as ResponderNotificationResponse[];
}

export async function fetchUnreadResponderNotificationCount(
  organisationId: string,
) {
  const params = new URLSearchParams({
    isRead: "false",
    notificationType: responderIncidentAssignedNotificationType,
    recipientId: organisationId,
    recipientType: "organisation",
  });

  const response = await fetch(`/api/notifications?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load responder notification count");
  }

  const notifications =
    (await response.json()) as ResponderNotificationResponse[];
  return notifications.length;
}

export async function markResponderNotificationsRead(organisationId: string) {
  const response = await fetch("/api/notifications/read-all", {
    body: JSON.stringify({
      notificationType: responderIncidentAssignedNotificationType,
      recipientId: organisationId,
      recipientType: "organisation",
    }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Unable to mark responder notifications read");
  }

  return response.json() as Promise<{ count: number }>;
}

export async function markResponderNotificationRead(recipientId: string) {
  const response = await fetch(`/api/notifications/recipients/${recipientId}/read`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Unable to mark responder notification read");
  }

  return response.json() as Promise<{
    id: string;
    isRead: boolean;
    readAt: string | null;
  }>;
}

export function subscribeToResponderNotificationCreated(
  onNotificationCreated: (notification: ResponderNotificationResponse) => void,
) {
  notificationSocket ??= io();
  notificationSocket.on("notification.created", onNotificationCreated);

  return () => {
    notificationSocket?.off("notification.created", onNotificationCreated);
  };
}

export function isResponderOrganisationNotification(
  notification: ResponderNotificationResponse,
  organisationId: string,
) {
  return (
    notification.notificationType === responderIncidentAssignedNotificationType &&
    notification.recipients.some(
      (recipient) =>
        recipient.recipientType === "organisation" &&
        recipient.recipientId === organisationId,
    )
  );
}

export function getResponderOrganisationRecipient(
  notification: ResponderNotificationResponse,
  organisationId: string,
) {
  return notification.recipients.find(
    (recipient) =>
      recipient.recipientType === "organisation" &&
      recipient.recipientId === organisationId,
  );
}

export function isUnreadResponderNotification(
  notification: ResponderNotificationResponse,
  organisationId: string,
) {
  return getResponderOrganisationRecipient(notification, organisationId)?.isRead === false;
}
