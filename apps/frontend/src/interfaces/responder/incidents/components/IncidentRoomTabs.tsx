import { useEffect, useState } from "react";
import type { ElementType, FormEvent } from "react";
import {
  ClipboardList,
  FileText,
  FolderOpen,
  Info,
  Map,
  MessageSquare,
} from "lucide-react";
import { Box, Button, HStack, Icon } from "../../../../components/chakra-ui";
import type { Incident, IncidentReportDraft } from "../types";
import { IncidentDiscussion } from "./IncidentDiscussion";
import type { ChatMessage } from "./IncidentDiscussion";
import { IncidentInformation } from "./IncidentInformation";
import { IncidentLog } from "./IncidentLog";
import { IncidentMap } from "./IncidentMap";
import { IncidentReport } from "./IncidentReport";
import { IncidentResources } from "./IncidentResources";
import { IncidentRoomCard, IncidentRoomContent } from "./IncidentRoomShell";

type RoomTab =
  | "discussion"
  | "incident-log"
  | "report"
  | "resources"
  | "map"
  | "information";

const roomTabs: Array<{ id: RoomTab; label: string; icon: ElementType }> = [
  { id: "discussion", label: "Discussion", icon: MessageSquare },
  { id: "incident-log", label: "Incident Log", icon: ClipboardList },
  { id: "report", label: "Report", icon: FileText },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "map", label: "Map", icon: Map },
  { id: "information", label: "Information", icon: Info },
];

type IncidentRoomTabsProps = {
  currentUserId?: string;
  discussionDraft: string;
  discussionError?: string | null;
  incident: Incident;
  messages: ChatMessage[];
  reportError?: string | null;
  reportIsGenerating: boolean;
  reportIsSaving: boolean;
  onDiscussionDraftChange: (draft: string) => void;
  onGenerateReport: () => void;
  onReportDraftChange: (draft: IncidentReportDraft) => void;
  onSaveReport: () => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  reportDraft: IncidentReportDraft;
};

export function IncidentRoomTabs({
  currentUserId,
  discussionDraft,
  discussionError,
  incident,
  messages,
  reportError,
  reportIsGenerating,
  reportIsSaving,
  onDiscussionDraftChange,
  onGenerateReport,
  onReportDraftChange,
  onSaveReport,
  onSendMessage,
  reportDraft,
}: IncidentRoomTabsProps) {
  const [activeTab, setActiveTab] = useState<RoomTab>("discussion");
  const [resources, setResources] = useState(incident.resources ?? []);
  const logEntries = incident.logs ?? [];

  useEffect(() => {
    setResources(incident.resources ?? []);
  }, [incident.id, incident.resources]);

  return (
    <IncidentRoomCard>
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
            borderBottomColor={
              activeTab === tab.id ? "purple.500" : "transparent"
            }
            borderRadius="0"
            color={activeTab === tab.id ? "purple.700" : "gray.600"}
            h="12"
            onClick={() => setActiveTab(tab.id)}
            px="4"
            _hover={{
              bg: "white",
              color: activeTab === tab.id ? "purple.700" : "gray.900",
            }}
          >
            <Icon as={tab.icon} />
            {tab.label}
          </Button>
        ))}
      </HStack>

      <IncidentRoomContent>
        {activeTab === "discussion" && (
          <IncidentDiscussion
            currentUserId={currentUserId}
            draft={discussionDraft}
            error={discussionError}
            messages={messages}
            onDraftChange={onDiscussionDraftChange}
            onSendMessage={onSendMessage}
          />
        )}

        {activeTab === "incident-log" && <IncidentLog entries={logEntries} />}

        {activeTab === "report" && (
          <IncidentReport
            draft={reportDraft}
            error={reportError}
            isGenerating={reportIsGenerating}
            isSaving={reportIsSaving}
            onGenerate={onGenerateReport}
            onDraftChange={onReportDraftChange}
            onSave={onSaveReport}
            status={incident.status}
          />
        )}

        {activeTab === "resources" && (
          <IncidentResources incidentId={incident.id} />
        )}

        {activeTab === "information" && (
          <IncidentInformation incident={incident} resources={resources} />
        )}

        {activeTab === "map" && <IncidentMap incidentId={incident.id} />}

        {activeTab !== "discussion" &&
          activeTab !== "incident-log" &&
          activeTab !== "report" &&
          activeTab !== "resources" &&
          activeTab !== "information" &&
          activeTab !== "map" && <Box flex="1" />}
      </IncidentRoomContent>
    </IncidentRoomCard>
  );
}
