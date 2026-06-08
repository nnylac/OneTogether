import { Box, Button, Flex, Stack, Text } from '../../../../components/chakra-ui'
import { BroadcastListItem } from './BroadcastListItem'
import type { GovernmentBroadcast } from '../types/broadcast'

type BroadcastListProps = {
  title: string
  broadcasts: GovernmentBroadcast[]
  onDelete: (broadcastId: string) => void
  onRefresh: () => void
}

export function BroadcastList({
  title,
  broadcasts,
  onDelete,
  onRefresh,
}: BroadcastListProps) {
  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px">
      <Flex align="center" justify="space-between" px="4" py="4">
        <Text color="gray.900" fontSize="md" fontWeight="800">
          {title}
        </Text>

        <Button
          color="green.600"
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          _hover={{
            bg: 'green.50',
          }}
        >
          Refresh
        </Button>
      </Flex>

      {broadcasts.length === 0 ? (
        <Box borderTopColor="gray.100" borderTopWidth="1px" px="4" py="8">
          <Text color="gray.500">No broadcasts found for this filter.</Text>
        </Box>
      ) : (
        <Stack gap="0">
          {broadcasts.map((broadcast) => (
            <BroadcastListItem
              key={broadcast.id}
              broadcast={broadcast}
              onDelete={onDelete}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}