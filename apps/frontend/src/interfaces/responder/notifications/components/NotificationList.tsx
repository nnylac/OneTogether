import { Stack, Text } from "../../../../components/chakra-ui";
import { NotificationListItem } from "./NotificationListItem";
import type { ResponderNotificationResponse } from "../api/responderNotificationsApi";

type NotificationListProps = {
  onNotificationClick: (notification: ResponderNotificationResponse) => void;
  unreadIds: Set<string>;
  notifications: ResponderNotificationResponse[];
};

export function NotificationList({
  onNotificationClick,
  unreadIds,
  notifications,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm">
        No notifications found.
      </Text>
    );
  }

  return (
    <Stack gap="3">
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          isUnread={unreadIds.has(notification.id)}
          onClick={() => onNotificationClick(notification)}
        />
      ))}
    </Stack>
  );
}
