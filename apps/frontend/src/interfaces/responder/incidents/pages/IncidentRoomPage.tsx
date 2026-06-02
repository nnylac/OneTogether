import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  FolderOpen,
  Info,
  Map,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Textarea,
  VStack,
} from '../../../../components/chakra-ui'
import { IncidentStatusBadge } from '../components/IncidentStatusBadge'
import { incidents } from '../data/sampleIncidents'

const roomTabs = [
  { label: 'Discussion', icon: MessageSquare, isActive: true },
  { label: 'Incident Log', icon: ClipboardList },
  { label: 'Report', icon: FileText },
  { label: 'Resources', icon: FolderOpen },
  { label: 'Map', icon: Map },
  { label: 'Information', icon: Info },
  { label: 'AI Advisory', icon: Sparkles },
]

type ChatMessage = {
  id: string
  author: string
  role: string
  time: string
  body: string
}

export function IncidentRoomPage() {
  const { incidentId } = useParams()
  const incident = incidents.find((item) => item.id === incidentId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = draft.trim()

    if (!body) {
      return
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        author: 'Chen Xiao Ling',
        role: 'SCDF',
        time: new Intl.DateTimeFormat('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
        body,
      },
    ])
    setDraft('')
  }

  if (!incident) {
    return <Navigate to="/responder/incidents" replace />
  }

  return (
    <Stack gap="5">
      <Flex justify="space-between" align={{ base: 'stretch', xl: 'start' }} gap="4" direction={{ base: 'column', xl: 'row' }}>
        <VStack align="stretch" gap="3">
          <Button
            asChild
            variant="ghost"
            alignSelf="flex-start"
            color="gray.600"
            px="0"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          >
            <Link to="/responder/incidents">
              <Icon as={ArrowLeft} />
              Back to incidents
            </Link>
          </Button>

          <Box>
            <HStack gap="3" wrap="wrap">
              <Heading size="2xl" color="gray.900">
                {incident.title}
              </Heading>
              <IncidentStatusBadge status={incident.status} />
            </HStack>
            <Text color="gray.500" fontWeight="700" mt="1">
              {incident.location}
            </Text>
            <Text color="gray.600" mt="2" maxW="3xl">
              {incident.description}
            </Text>
          </Box>
        </VStack>

        <VStack align={{ base: 'stretch', xl: 'end' }} gap="1">
          <Text color="gray.500" fontSize="sm" fontWeight="700">
            Room opened
          </Text>
          <Text color="gray.900" fontWeight="800">
            {incident.date}
          </Text>
        </VStack>
      </Flex>

      <Box bg="white" borderWidth="1px" borderColor="gray.200">
        <HStack
          as="nav"
          gap="0"
          overflowX="auto"
          borderBottomWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
        >
          {roomTabs.map((tab) => (
            <Button
              key={tab.label}
              variant="ghost"
              borderBottomWidth="2px"
              borderBottomColor={tab.isActive ? 'purple.500' : 'transparent'}
              borderRadius="0"
              color={tab.isActive ? 'purple.700' : 'gray.600'}
              h="12"
              px="4"
              _hover={{ bg: 'white', color: tab.isActive ? 'purple.700' : 'gray.900' }}
            >
              <Icon as={tab.icon} />
              {tab.label}
            </Button>
          ))}
        </HStack>

        <VStack align="stretch" gap="0" minH="620px">
          <Box flex="1" p="5" overflowY="auto">
            {messages.length === 0 ? (
              <Flex align="center" justify="center" minH="460px" textAlign="center">
                <VStack gap="3">
                  <Flex align="center" justify="center" boxSize="12" bg="gray.100" color="gray.600">
                    <Icon as={MessageSquare} boxSize="5" />
                  </Flex>
                  <Box>
                    <Text color="gray.900" fontWeight="800">
                      No messages yet
                    </Text>
                    <Text color="gray.500" maxW="sm">
                      Start the discussion when there is an update for the responders in this room.
                    </Text>
                  </Box>
                </VStack>
              </Flex>
            ) : (
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
          </Box>

          <Box borderTopWidth="1px" borderColor="gray.200" bg="white" p="4">
            <form onSubmit={sendMessage}>
              <HStack align="end" gap="3">
                <Textarea
                  aria-label="Message"
                  borderWidth="1px"
                  borderColor="gray.300"
                  flex="1"
                  minH="12"
                  onChange={(event) => setDraft(event.currentTarget.value)}
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
        </VStack>
      </Box>
    </Stack>
  )
}
