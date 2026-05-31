import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  DbChatMessage, DbTimelineEvent, DbResourceAssignment,
  DbUpload, DbParticipant, DbIncident,
} from '../api/incidents.api';
import { fetchIncident, fetchMessages } from '../api/incidents.api';

const WS_URL = (import.meta.env.VITE_API_URL as string).replace('/api', '');

interface UseIncidentRoomOptions {
  incidentId: string;
  userId: string;
  userName: string;
  userRole?: string;
}

export function useIncidentRoom({ incidentId, userId, userName, userRole }: UseIncidentRoomOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [incident, setIncident] = useState<DbIncident | null>(null);
  const [messages, setMessages] = useState<DbChatMessage[]>([]);
  const [timeline, setTimeline] = useState<DbTimelineEvent[]>([]);
  const [resources, setResources] = useState<DbResourceAssignment[]>([]);
  const [uploads, setUploads] = useState<DbUpload[]>([]);
  const [participants, setParticipants] = useState<DbParticipant[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load initial data via REST
  useEffect(() => {
    fetchIncident(incidentId).then((inc) => {
      setIncident(inc);
      setTimeline(inc.timeline ?? []);
      setResources(inc.resources ?? []);
      setUploads(inc.uploads ?? []);
      setParticipants(inc.participants ?? []);
    });
    fetchMessages(incidentId).then(setMessages);
  }, [incidentId]);

  // WebSocket connection
  useEffect(() => {
    const socket = io(`${WS_URL}/incident-room`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { incidentId, userId, userName });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new-message', (msg: DbChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.isAi) setAiThinking(false);
    });

    socket.on('ai-thinking', () => setAiThinking(true));

    socket.on('new-timeline-event', (event: DbTimelineEvent) => {
      setTimeline((prev) => [...prev, event]);
    });

    socket.on('resource-updated', (assignment: DbResourceAssignment) => {
      setResources((prev) =>
        prev.map((r) => (r.id === assignment.id ? { ...r, ...assignment } : r)),
      );
    });

    socket.on('incident-updated', (patch: Partial<DbIncident>) => {
      setIncident((prev) => (prev ? { ...prev, ...patch } : prev));
    });

    socket.on('participants-update', (list: DbParticipant[]) => setParticipants(list));

    socket.on('new-upload', (upload: DbUpload) => {
      setUploads((prev) => [...prev, upload]);
    });

    socket.on('typing', ({ userId: uid, userName: uname }: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === uid)) return prev;
        return [...prev, { userId: uid, userName: uname }];
      });
      const existing = typingTimers.current.get(uid);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(
        uid,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== uid));
          typingTimers.current.delete(uid);
        }, 2500),
      );
    });

    return () => {
      socket.emit('leave-room', { incidentId, userId, userName });
      socket.disconnect();
    };
  }, [incidentId, userId, userName]);

  const sendMessage = useCallback((content: string) => {
    socketRef.current?.emit('send-message', {
      incidentId,
      content,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
    });
  }, [incidentId, userId, userName, userRole]);

  const emitTyping = useCallback(() => {
    socketRef.current?.emit('typing', { incidentId, userId, userName });
  }, [incidentId, userId, userName]);

  const updateResourceStatus = useCallback((unitId: string, status: string) => {
    socketRef.current?.emit('update-resource', { incidentId, unitId, status });
  }, [incidentId]);

  const updateIncidentStatus = useCallback((status: string, actorName: string, actorOrg?: string) => {
    socketRef.current?.emit('update-incident-status', {
      incidentId, status, actorId: userId, actorName, actorOrg,
    });
  }, [incidentId, userId]);

  const addResourceLocally = useCallback((assignment: DbResourceAssignment) => {
    setResources((prev) => {
      if (prev.some((r) => r.id === assignment.id)) return prev;
      return [...prev, assignment];
    });
  }, []);

  const addUploadLocally = useCallback((upload: DbUpload) => {
    setUploads((prev) => [...prev, upload]);
  }, []);

  return {
    connected, incident, messages, timeline, resources, uploads,
    participants, typingUsers, aiThinking,
    sendMessage, emitTyping, updateResourceStatus, updateIncidentStatus,
    addResourceLocally, addUploadLocally,
  };
}
