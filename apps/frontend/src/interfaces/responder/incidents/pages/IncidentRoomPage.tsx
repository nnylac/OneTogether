import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Stack } from '../../../../components/chakra-ui'
import type { ChatMessage } from '../components/IncidentDiscussion'
import { IncidentRoomHeader } from '../components/IncidentRoomHeader'
import { IncidentRoomTabs } from '../components/IncidentRoomTabs'
import { incidentLogEntries } from '../data/sampleIncidentLog'
import { incidents } from '../data/sampleIncidents'
import type { Incident, IncidentReportDraft } from '../types'

function createReportDraft(incident: Incident): IncidentReportDraft {
  return {
    incidentName: incident.title,
    incidentDate: incident.date,
    incidentDescription: incident.description,
    responsePlan: '',
    otherNotes: '',
  }
}

export function IncidentRoomPage() {
  const { incidentId } = useParams()
  const incident = incidents.find((item) => item.id === incidentId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [discussionDraft, setDiscussionDraft] = useState('')
  const [reportDraft, setReportDraft] = useState<IncidentReportDraft | null>(() =>
    incident ? createReportDraft(incident) : null,
  )

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

  if (!incident) {
    return <Navigate to="/responder/incidents" replace />
  }

  if (!reportDraft) {
    return null
  }

  return (
    <Stack gap="5">
      <IncidentRoomHeader incident={incident} />

      <IncidentRoomTabs
        discussionDraft={discussionDraft}
        logEntries={incidentLogEntries}
        messages={messages}
        onDiscussionDraftChange={setDiscussionDraft}
        onReportDraftChange={setReportDraft}
        onSendMessage={sendMessage}
        reportDraft={reportDraft}
      />
    </Stack>
  )
}
