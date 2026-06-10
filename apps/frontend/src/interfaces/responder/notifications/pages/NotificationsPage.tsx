import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from "../../../../components/chakra-ui";
import { useAuth } from "../../../auth/useAuth";
import { NotificationList } from "../components/NotificationList";
import {
  fetchResponderNotifications,
  getResponderOrganisationRecipient,
  isResponderOrganisationNotification,
  isUnreadResponderNotification,
  markResponderNotificationRead,
  markResponderNotificationsRead,
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
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [markAllError, setMarkAllError] = useState<string | null>(null);
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

    return subscribeToResponderNotificationCreated(
      (notification) => {
        if (!isResponderOrganisationNotification(notification, organisationId)) {
          return;
        }

        setNotifications((currentNotifications) => [
          notification,
          ...currentNotifications.filter(
            (currentNotification) => currentNotification.id !== notification.id,
          ),
        ]);
      },
      () => {
        void fetchResponderNotifications(organisationId)
          .then(setNotifications)
          .catch(() => undefined);
      },
    );
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

  const handleMarkAllRead = useCallback(async () => {
    if (!organisationId || unreadIds.size === 0 || isMarkingAllRead) {
      return;
    }

    const previousNotifications = notifications;
    setMarkAllError(null);
    setIsMarkingAllRead(true);
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        recipients: notification.recipients.map((recipient) =>
          recipient.recipientType === "organisation" &&
          recipient.recipientId === organisationId
            ? { ...recipient, isRead: true }
            : recipient,
        ),
      })),
    );

    try {
      await markResponderNotificationsRead(organisationId);
      window.dispatchEvent(new CustomEvent("responder-notification-read"));
    } catch {
      setNotifications(previousNotifications);
      setMarkAllError("Unable to mark all notifications as read.");
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [
    isMarkingAllRead,
    notifications,
    organisationId,
    unreadIds.size,
  ]);

  return (
    <Stack gap="6">
      <Flex align="center" justify="space-between" gap="4" wrap="wrap">
        <Heading size="3xl" color="gray.900">
          Notifications
        </Heading>
        {organisationId && (
          <Button
            disabled={unreadIds.size === 0 || isMarkingAllRead}
            loading={isMarkingAllRead}
            loadingText="Marking..."
            onClick={() => void handleMarkAllRead()}
            variant="outline"
          >
            Mark all as read
          </Button>
        )}
      </Flex>
      {!organisationId && (
        <Text color="gray.500">
          No responder organisation is linked to this account.
        </Text>
      )}
      {markAllError && <Text color="red.600">{markAllError}</Text>}
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
