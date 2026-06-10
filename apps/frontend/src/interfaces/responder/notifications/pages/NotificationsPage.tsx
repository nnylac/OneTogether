import { useCallback, useEffect, useMemo, useState } from "react";
import { Heading, Stack, Text } from "../../../../components/chakra-ui";
import { useAuth } from "../../../auth/useAuth";
import { NotificationList } from "../components/NotificationList";
import {
  fetchResponderNotifications,
  getResponderOrganisationRecipient,
  isResponderOrganisationNotification,
  isUnreadResponderNotification,
  markResponderNotificationRead,
  subscribeToResponderNotificationCreated,
  type ResponderNotificationResponse,
} from "../api/responderNotificationsApi";

export function NotificationsPage() {
  const { user } = useAuth();
  const organisationId =
    user?.userOrganisationId ?? user?.organisations[0]?.id ?? undefined;
  const [notifications, setNotifications] = useState<
    ResponderNotificationResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const unreadIds = useMemo(
    () =>
      new Set(
        notifications
          .filter((notification) =>
            organisationId
              ? isUnreadResponderNotification(notification, organisationId)
              : false,
          )
          .map((notification) => notification.id),
      ),
    [notifications, organisationId],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!organisationId) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const nextNotifications = await fetchResponderNotifications(organisationId);
        if (isMounted) {
          setNotifications(nextNotifications);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  useEffect(() => {
    if (!organisationId) {
      return undefined;
    }

    return subscribeToResponderNotificationCreated((notification) => {
      if (!isResponderOrganisationNotification(notification, organisationId)) {
        return;
      }

      setNotifications((currentNotifications) => [
        notification,
        ...currentNotifications.filter(
          (currentNotification) => currentNotification.id !== notification.id,
        ),
      ]);
    });
  }, [organisationId]);

  const handleNotificationClick = useCallback(
    (notification: ResponderNotificationResponse) => {
      if (!organisationId) {
        return;
      }

      const recipient = getResponderOrganisationRecipient(
        notification,
        organisationId,
      );

      if (!recipient || recipient.isRead) {
        return;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? {
                ...currentNotification,
                recipients: currentNotification.recipients.map(
                  (currentRecipient) =>
                    currentRecipient.id === recipient.id
                      ? { ...currentRecipient, isRead: true }
                      : currentRecipient,
                ),
              }
            : currentNotification,
        ),
      );

      void markResponderNotificationRead(recipient.id)
        .then(() => {
          window.dispatchEvent(new CustomEvent("responder-notification-read"));
        })
        .catch(() => {
          setNotifications((currentNotifications) =>
            currentNotifications.map((currentNotification) =>
              currentNotification.id === notification.id
                ? {
                    ...currentNotification,
                    recipients: currentNotification.recipients.map(
                      (currentRecipient) =>
                        currentRecipient.id === recipient.id
                          ? { ...currentRecipient, isRead: false }
                          : currentRecipient,
                    ),
                  }
                : currentNotification,
            ),
          );
        });
    },
    [organisationId],
  );

  return (
    <Stack gap="6">
      <Heading size="3xl" color="gray.900">
        Notifications
      </Heading>
      {!organisationId && (
        <Text color="gray.500">
          No responder organisation is linked to this account.
        </Text>
      )}
      {organisationId && isLoading ? (
        <Text color="gray.500">Loading notifications...</Text>
      ) : (
        <NotificationList
          onNotificationClick={handleNotificationClick}
          unreadIds={unreadIds}
          notifications={notifications}
        />
      )}
    </Stack>
  );
}
