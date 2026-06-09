import { Trash2 } from 'lucide-react'
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { BroadcastTypeBadge } from './BroadcastTypeBadge'
import type { GovernmentBroadcast } from '../types/broadcast'

type BroadcastListItemProps = {
  broadcast: GovernmentBroadcast
  onDelete: (broadcastId: string) => void
}

export function BroadcastListItem({
  broadcast,
  onDelete,
}: BroadcastListItemProps) {
  return (
    <Flex
      align="center"
      borderTopColor="gray.100"
      borderTopWidth="1px"
      gap="4"
      justify="space-between"
      px="4"
      py="4"
    >
      <Stack gap="1" flex="1">
        <HStack gap="2" wrap="wrap">
          <Text color="gray.900" fontSize="md" fontWeight="800">
            {broadcast.title}
          </Text>

          <BroadcastTypeBadge label={broadcast.audience} />

          {broadcast.audience === 'Zone' && broadcast.zone && (
            <BroadcastTypeBadge label={broadcast.zone} />
          )}

          {broadcast.audience === 'Responders' &&
            broadcast.responderOrganisationNames?.map((organisationName) => (
              <BroadcastTypeBadge
                key={organisationName}
                label={organisationName}
              />
            ))}
        </HStack>

        <Text color="gray.600" fontSize="sm">
          {broadcast.message}
        </Text>

        <Text color="gray.500" fontSize="xs">
          {broadcast.authorName} - {broadcast.createdAt}
        </Text>
      </Stack>

      <Box>
        <IconButton
          aria-label={`Delete ${broadcast.title}`}
          color="gray.400"
          size="sm"
          variant="ghost"
          onClick={() => onDelete(broadcast.id)}
          _hover={{
            bg: 'red.50',
            color: 'red.500',
          }}
        >
          <Icon as={Trash2} />
        </IconButton>
      </Box>
    </Flex>
  )
}
