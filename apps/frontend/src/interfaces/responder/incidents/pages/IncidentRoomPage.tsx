import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Box, Stack, Text } from "../../../../components/chakra-ui";
import {
  fetchIncident,
  regenerateFinalAnalysis,
  updateIncident,
} from "../api/incidentsApi";
import {
  createIncidentRoomSocket,
  fetchIncidentRoomMessages,
  mapIncidentRoomMessage,
} from "../api/incidentRoomApi";
import type { IncidentRoomMessageApiDto } from "../api/incidentRoomApi";
import type { ChatMessage } from "../components/IncidentDiscussion";
import { IncidentRoomHeader } from "../components/IncidentRoomHeader";
import { IncidentRoomTabs } from "../components/IncidentRoomTabs";
import { useAuth } from "../../../auth/useAuth";
import type { Incident, IncidentReportDraft } from "../types";
import type { Socket } from "socket.io-client";

function createReportDraft(incident: Incident): IncidentReportDraft {
  return {
    incidentName: incident.title,
    incidentDate: incident.date,
    incidentDescription: incident.description,
    executiveSummary: incident.analysis?.finalAnalysis.executiveSummary ?? "",
    responsePlan:
      incident.analysis?.finalAnalysis.responsePlan ?? incident.report ?? "",
    entities: incident.analysis?.finalAnalysis.entities ?? "",
  };
}

export function IncidentRoomPage() {
  const { incidentId } = useParams();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [discussionDraft, setDiscussionDraft] = useState("");
  const [reportDraft, setReportDraft] = useState<IncidentReportDraft | null>(
    null,
  );
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportIsGenerating, setReportIsGenerating] = useState(false);
  const [reportIsSaving, setReportIsSaving] = useState(false);
  const [reportGeneratedBy, setReportGeneratedBy] = useState<
    "ai" | "rules" | null
  >(null);
  const roomSocketRef = useRef<Socket | null>(null);
  const pendingMessageRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadIncident() {
      if (!incidentId) {
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        const nextIncident = await fetchIncident(incidentId);

        if (isMounted) {
          setIncident(nextIncident);
          setReportDraft(createReportDraft(nextIncident));
        }
      } catch {
        if (isMounted) {
          setError("Unable to load this incident from the backend.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadIncident();

    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  useEffect(() => {
    if (!incidentId) {
      return;
    }

    const activeIncidentId = incidentId;
    let isMounted = true;
    const socket = createIncidentRoomSocket(activeIncidentId);
    roomSocketRef.current = socket;

    function addMessage(message: ChatMessage) {
      setMessages((currentMessages) => {
        if (
          currentMessages.some(
            (currentMessage) => currentMessage.id === message.id,
          )
        ) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });

      if (
        message.senderId === user?.id &&
        message.body === pendingMessageRef.current
      ) {
        pendingMessageRef.current = null;
        setDiscussionDraft("");
      }
    }

    async function loadMessages() {
      try {
        setDiscussionError(null);
        const nextMessages = await fetchIncidentRoomMessages(activeIncidentId);

        if (isMounted) {
          setMessages(nextMessages);
        }
      } catch {
        if (isMounted) {
          setDiscussionError("Unable to load discussion messages.");
        }
      }
    }

    socket.on(
      "incident-room.message.created",
      (message: IncidentRoomMessageApiDto) => {
        addMessage(mapIncidentRoomMessage(message));
      },
    );
    socket.on("incident-room.message.error", (error?: { message?: string }) => {
      pendingMessageRef.current = null;
      setDiscussionError(error?.message ?? "Unable to send message.");
    });
    socket.on("connect_error", () => {
      pendingMessageRef.current = null;
      setDiscussionError("Unable to connect to the discussion server.");
    });
    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        pendingMessageRef.current = null;
        setDiscussionError("Discussion server disconnected.");
      }
    });

    void loadMessages();

    return () => {
      isMounted = false;
      if (roomSocketRef.current === socket) {
        roomSocketRef.current = null;
      }
      socket.disconnect();
    };
  }, [incidentId]);

  function updateDiscussionDraft(nextDraft: string) {
    setDiscussionDraft(nextDraft);
    if (discussionError) {
      setDiscussionError(null);
    }
  }

  function submitDiscussionMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = discussionDraft.trim();

    if (!body || !incidentId || !user) {
      return;
    }

    const socket = roomSocketRef.current;

    if (!socket?.connected) {
      setDiscussionError("Unable to connect to discussion room.");
      return;
    }

    try {
      setDiscussionError(null);
      pendingMessageRef.current = body;
      socket.emit("incident-room.message.create", {
        incidentId,
        senderId: user.id,
        body,
      });
    } catch {
      pendingMessageRef.current = null;
      setDiscussionError("Unable to send message.");
    }
  }

  async function saveReport() {
    if (!incident || !reportDraft) {
      return;
    }
    try {
      setReportError(null);
      setReportIsSaving(true);
      const updated = await updateIncident(incident.id, {
        title: reportDraft.incidentName,
        description: reportDraft.incidentDescription,
        report: reportDraft.responsePlan,
        executiveSummary: reportDraft.executiveSummary,
        responsePlan: reportDraft.responsePlan,
        entities: reportDraft.entities,
      });
      setIncident(updated);
      setReportDraft(createReportDraft(updated));
    } catch (saveError) {
      setReportError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save report.",
      );
    } finally {
      setReportIsSaving(false);
    }
  }

  async function generateReport() {
    if (!incident || incident.status !== "closed") {
      return;
    }
    try {
      setReportError(null);
      setReportIsGenerating(true);
      const analysis = await regenerateFinalAnalysis(incident.id);
      setReportGeneratedBy(analysis.generatedBy ?? null);
      const updated = await fetchIncident(incident.id);
      setIncident(updated);
      setReportDraft(createReportDraft(updated));
    } catch (generateError) {
      setReportError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate analysis.",
      );
    } finally {
      setReportIsGenerating(false);
    }
  }

  if (!incidentId) {
    return <Navigate to="/responder/incidents" replace />;
  }

  if (isLoading) {
    return (
      <Box color="gray.500" p="6">
        <Text>Loading incident...</Text>
      </Box>
    );
  }

  if (error || !incident || !reportDraft) {
    return (
      <Box color="red.700" p="6">
        <Text fontWeight="700">{error ?? "Incident not found."}</Text>
      </Box>
    );
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
        reportError={reportError}
        reportGeneratedBy={reportGeneratedBy}
        reportIsGenerating={reportIsGenerating}
        reportIsSaving={reportIsSaving}
        onDiscussionDraftChange={updateDiscussionDraft}
        onGenerateReport={generateReport}
        onReportDraftChange={setReportDraft}
        onSaveReport={saveReport}
        onSendMessage={submitDiscussionMessage}
        reportDraft={reportDraft}
      />
    </Stack>
  );
}
