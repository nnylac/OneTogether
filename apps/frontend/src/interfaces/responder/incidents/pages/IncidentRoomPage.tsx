import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Box, Stack, Text } from '../../../../components/chakra-ui'
import { fetchIncident } from '../api/incidentsApi'
import {
  createIncidentRoomSocket,
  fetchIncidentRoomMessages,
  mapIncidentRoomMessage,
} from '../api/incidentRoomApi'
import type { IncidentRoomMessageApiDto } from '../api/incidentRoomApi'
import type { ChatMessage } from '../components/IncidentDiscussion'
import { IncidentRoomHeader } from '../components/IncidentRoomHeader'
import { IncidentRoomTabs } from '../components/IncidentRoomTabs'
import { useAuth } from '../../../auth/useAuth'
import type { Incident, IncidentReportDraft } from '../types'
import type { Socket } from 'socket.io-client'

function createReportDraft(incident: Incident): IncidentReportDraft {
  return {
    incidentName: incident.title,
    incidentDate: incident.date,
    incidentDescription: incident.description,
    responsePlan: incident.report ?? '',
    otherNotes: '',
  }
}

export function IncidentRoomPage() {
  const { incidentId } = useParams()
  const { user } = useAuth()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [discussionError, setDiscussionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [discussionDraft, setDiscussionDraft] = useState('')
  const [reportDraft, setReportDraft] = useState<IncidentReportDraft | null>(null)
  const roomSocketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadIncident() {
      if (!incidentId) {
        return
      }

      try {
        setError(null)
        setIsLoading(true)
        const nextIncident = await fetchIncident(incidentId)

        if (isMounted) {
          setIncident(nextIncident)
          setReportDraft(createReportDraft(nextIncident))
        }
      } catch {
        if (isMounted) {
          setError('Unable to load this incident from the backend.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadIncident()

    return () => {
      isMounted = false
    }
  }, [incidentId])

  useEffect(() => {
    if (!incidentId) {
      return
    }

    const activeIncidentId = incidentId
    let isMounted = true
    const socket = createIncidentRoomSocket(activeIncidentId)
    roomSocketRef.current = socket

    function addMessage(message: ChatMessage) {
      setMessages((currentMessages) => {
        if (currentMessages.some((currentMessage) => currentMessage.id === message.id)) {
          return currentMessages
        }

        return [...currentMessages, message]
      })
    }

    async function loadMessages() {
      try {
        setDiscussionError(null)
        const nextMessages = await fetchIncidentRoomMessages(activeIncidentId)

        if (isMounted) {
          setMessages(nextMessages)
        }
      } catch {
        if (isMounted) {
          setDiscussionError('Unable to load discussion messages.')
        }
      }
    }

    socket.on('incident-room.message.created', (message: IncidentRoomMessageApiDto) => {
      addMessage(mapIncidentRoomMessage(message))
    })
    socket.on('incident-room.message.error', () => {
      setDiscussionError('Unable to send message.')
    })

    void loadMessages()

    return () => {
      isMounted = false
      if (roomSocketRef.current === socket) {
        roomSocketRef.current = null
      }
      socket.disconnect()
    }
  }, [incidentId])

  function updateDiscussionDraft(nextDraft: string) {
    setDiscussionDraft(nextDraft)
    if (discussionError) {
      setDiscussionError(null)
    }
  }

  function submitDiscussionMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = discussionDraft.trim()

    if (!body || !incidentId || !user) {
      return
    }

    const socket = roomSocketRef.current

    if (!socket) {
      setDiscussionError('Unable to connect to discussion room.')
      return
    }

    try {
      setDiscussionError(null)
      socket.emit('incident-room.message.create', {
        incidentId,
        senderId: user.id,
        body,
      })
      setDiscussionDraft('')
    } catch {
      setDiscussionError('Unable to send message.')
    }
  }

  if (!incidentId) {
    return <Navigate to="/responder/incidents" replace />
  }

  if (isLoading) {
    return (
      <Box color="gray.500" p="6">
        <Text>Loading incident...</Text>
      </Box>
    )
  }

  if (error || !incident || !reportDraft) {
    return (
      <Box color="red.700" p="6">
        <Text fontWeight="700">{error ?? 'Incident not found.'}</Text>
      </Box>
    )
  }

  return (
    <Stack gap="5">
      <IncidentRoomHeader incident={incident} />

      <IncidentRoomTabs
        currentUserId={user?.id}
        discussionDraft={discussionDraft}
        discussionError={discussionError}
        incident={incident}
        messages={messages}
        onDiscussionDraftChange={updateDiscussionDraft}
        onReportDraftChange={setReportDraft}
        onSendMessage={submitDiscussionMessage}
        reportDraft={reportDraft}
      />
    </Stack>
  )
}
