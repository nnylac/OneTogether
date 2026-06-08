import { io, type Socket } from 'socket.io-client'
import type { ChatMessage } from '../components/IncidentDiscussion'

export type IncidentRoomMessageApiDto = {
  author: string
  body: string
  createdAt: string
  discussionId: string
  id: string
  role: string
  senderId: string
}

export async function fetchIncidentRoomMessages(incidentId: string) {
  const response = await fetch(`/api/incident-room/incidents/${incidentId}/messages`)

  if (!response.ok) {
    throw new Error('Unable to load incident room messages')
  }

  const messages = (await response.json()) as IncidentRoomMessageApiDto[]
  return messages.map(mapIncidentRoomMessage)
}

export function createIncidentRoomSocket(incidentId: string) {
  const socket: Socket = io(getSocketOrigin(), {
    path: '/socket.io',
  })

  socket.on('connect', () => {
    socket.emit('incident-room.join', { incidentId })
  })

  return socket
}

export function mapIncidentRoomMessage(message: IncidentRoomMessageApiDto): ChatMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    author: message.author,
    role: message.role,
    time: formatMessageTime(message.createdAt),
    body: message.body,
  }
}

function getSocketOrigin() {
  return import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : undefined)
}

function formatMessageTime(date: string) {
  return new Intl.DateTimeFormat('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
