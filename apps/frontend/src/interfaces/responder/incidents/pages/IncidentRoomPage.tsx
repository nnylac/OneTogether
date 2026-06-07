import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Box, Stack, Text } from '../../../../components/chakra-ui'
import { fetchIncident } from '../api/incidentsApi'
import type { ChatMessage } from '../components/IncidentDiscussion'
import { IncidentRoomHeader } from '../components/IncidentRoomHeader'
import { IncidentRoomTabs } from '../components/IncidentRoomTabs'
import type { Incident, IncidentReportDraft } from '../types'

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
  const [incident, setIncident] = useState<Incident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [discussionDraft, setDiscussionDraft] = useState('')
  const [reportDraft, setReportDraft] = useState<IncidentReportDraft | null>(null)

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

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = discussionDraft.trim()

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
    setDiscussionDraft('')
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
        discussionDraft={discussionDraft}
        incident={incident}
        messages={messages}
        onDiscussionDraftChange={setDiscussionDraft}
        onReportDraftChange={setReportDraft}
        onSendMessage={sendMessage}
        reportDraft={reportDraft}
      />
    </Stack>
  )
}
