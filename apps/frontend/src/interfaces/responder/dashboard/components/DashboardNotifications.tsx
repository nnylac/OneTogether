import { Card, Flex, Heading, Stack, Text } from '../../../../components/chakra-ui'
import { ChevronRightLink } from '../../../../components/ui/ChevronRightLink'
import type { DashboardNotification } from '../types'

type DashboardNotificationsProps = {
  notifications: DashboardNotification[]
}

export function DashboardNotifications({ notifications }: DashboardNotificationsProps) {
  return (
    <Card.Root bg="white" borderColor="gray.200" borderWidth="1px" borderRadius="sm" h="100%">
      <Card.Header>
        <Flex justify="space-between" align="center" gap="4">
          <Heading size="md" color="gray.900">
            Notifications
          </Heading>
          <ChevronRightLink to="/responder/notifications" label="View all notifications" />
        </Flex>
      </Card.Header>

      <Card.Body>
        <Stack gap="0">
          {notifications.map((notification) => (
            <Stack
              key={notification.id}
              borderBottomColor="gray.100"
              borderBottomWidth="1px"
              gap="1"
              py="4"
              _last={{ borderBottomWidth: '0' }}
            >
              <Text color="gray.900" fontWeight="800">
                {notification.title}
              </Text>
              <Text color="gray.500" fontSize="sm">
                {notification.time}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
