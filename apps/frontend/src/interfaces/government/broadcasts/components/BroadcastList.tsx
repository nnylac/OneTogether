import { RefreshCcw } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { BroadcastListItem } from './BroadcastListItem'
import type { GovernmentBroadcast } from '../types/broadcast'

type BroadcastListProps = {
  title: string
  broadcasts: GovernmentBroadcast[]
  isLoading: boolean
  onDelete: (broadcastId: string) => void
  onRefresh: () => void
}

export function BroadcastList({
  title,
  broadcasts,
  isLoading,
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
          bg="green.600"
          color="white"
          size="sm"
          onClick={onRefresh}
          _hover={{
            bg: 'green.700',
          }}
        >
          <Icon as={RefreshCcw} />
          Refresh
        </Button>
      </Flex>

      {isLoading ? (
        <Box borderTopColor="gray.100" borderTopWidth="1px" px="4" py="8">
          <Text color="gray.500">Loading broadcasts...</Text>
        </Box>
      ) : broadcasts.length === 0 ? (
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
