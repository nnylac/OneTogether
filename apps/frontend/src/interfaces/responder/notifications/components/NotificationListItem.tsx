import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Box,
  Flex,
  Icon,
  Stack,
  Text,
} from "../../../../components/chakra-ui";
import type { ResponderNotificationResponse } from "../api/responderNotificationsApi";

type NotificationListItemProps = {
  isUnread: boolean;
  notification: ResponderNotificationResponse;
  onClick: () => void;
};

export function NotificationListItem({
  isUnread,
  notification,
  onClick,
}: NotificationListItemProps) {
  return (
    <Box
      asChild
      bg={isUnread ? "rgba(254, 226, 226, 0.55)" : "white"}
      borderColor={isUnread ? "red.300" : "gray.200"}
      borderWidth="1px"
      color="inherit"
      display="block"
      px="5"
      py="4"
      textDecoration="none"
      transition="background-color 0.16s ease, border-color 0.16s ease"
      _hover={{ bg: "gray.50", borderColor: "purple.200" }}
    >
      <Link to="/responder/incidents" onClick={onClick}>
        <Flex align="center" gap="4" justify="space-between">
          <Stack gap="1" minW="0">
            <Text color="gray.900" fontSize="md" fontWeight="700" lineClamp="1">
              {notification.title}
            </Text>
            <Text color="gray.500" fontSize="sm">
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </Stack>

          <Icon as={ChevronRight} boxSize="5" color="gray.400" flexShrink="0" />
        </Flex>
      </Link>
    </Box>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const deltaMs = Date.now() - timestamp;

  if (!Number.isFinite(timestamp) || deltaMs < 0) {
    return "Just now";
  }

  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
