import type { FormEvent } from 'react'
import { Send } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  Textarea,
  VStack,
} from '../../../../components/chakra-ui'
import { IncidentRoomScrollArea } from './IncidentRoomShell'

export type ChatMessage = {
  id: string
  author: string
  role: string
  time: string
  body: string
}

type IncidentDiscussionProps = {
  draft: string
  messages: ChatMessage[]
  onDraftChange: (draft: string) => void
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void
}

export function IncidentDiscussion({
  draft,
  messages,
  onDraftChange,
  onSendMessage,
}: IncidentDiscussionProps) {
  return (
    <>
      <IncidentRoomScrollArea>
        {messages.length > 0 && (
          <VStack align="stretch" gap="4">
            {messages.map((message) => (
              <Flex key={message.id} justify="flex-end">
                <Box bg="purple.50" borderWidth="1px" borderColor="purple.100" maxW="70%" p="4">
                  <Flex justify="space-between" align="start" gap="4">
                    <Box>
                      <HStack gap="2">
                        <Text color="gray.900" fontWeight="800">
                          {message.author}
                        </Text>
                        <Text color="gray.500" fontSize="sm">
                          {message.role}
                        </Text>
                      </HStack>
                      <Text color="gray.500" fontSize="sm">
                        {message.time}
                      </Text>
                    </Box>
                  </Flex>

                  <Text color="gray.800" mt="3" whiteSpace="pre-wrap">
                    {message.body}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        )}
      </IncidentRoomScrollArea>

      <Box borderTopWidth="1px" borderColor="gray.200" bg="white" p="4">
        <form onSubmit={onSendMessage}>
          <HStack align="end" gap="3">
            <Textarea
              aria-label="Message"
              borderWidth="1px"
              borderColor="gray.300"
              flex="1"
              minH="12"
              onChange={(event) => onDraftChange(event.currentTarget.value)}
              px="3"
              py="3"
              placeholder="Message responders in this incident room"
              resize="none"
              value={draft}
              _focus={{ borderColor: 'purple.500', outline: 'none' }}
            />
            <Button
              bg="purple.600"
              color="white"
              disabled={!draft.trim()}
              h="12"
              minW="12"
              type="submit"
              _hover={{ bg: 'purple.700' }}
            >
              <Icon as={Send} />
            </Button>
          </HStack>
        </form>
      </Box>
    </>
  )
}
