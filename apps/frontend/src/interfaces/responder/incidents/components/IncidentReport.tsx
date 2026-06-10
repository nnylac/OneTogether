import type { ReactNode } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
} from "../../../../components/chakra-ui";
import type { IncidentReportDraft, IncidentStatus } from "../types";

type IncidentReportProps = {
  draft: IncidentReportDraft;
  error?: string | null;
  generatedBy?: "ai" | "rules" | null;
  isGenerating: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onDraftChange: (draft: IncidentReportDraft) => void;
  onSave: () => void;
  status: IncidentStatus;
};

export function IncidentReport({
  draft,
  error,
  generatedBy,
  isGenerating,
  isSaving,
  onGenerate,
  onDraftChange,
  onSave,
  status,
}: IncidentReportProps) {
  function updateDraft(field: keyof IncidentReportDraft, value: string) {
    onDraftChange({ ...draft, [field]: value });
  }

  return (
    <Box flex="1" minH="0" overflowY="auto" p="6">
      <VStack align="stretch" gap="6">
        <Box>
          <Heading size="xl" color="gray.900">
            Incident report
          </Heading>
          <Text color="gray.500" mt="1">
            Keep the response record updated throughout the incident.
          </Text>
        </Box>

        <VStack
          as="form"
          align="stretch"
          gap="5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <FormField label="Name of incident">
            <Input
              value={draft.incidentName}
              onChange={(event) =>
                updateDraft("incidentName", event.currentTarget.value)
              }
            />
          </FormField>

          <FormField label="Date of incident">
            <Input
              value={draft.incidentDate}
              onChange={(event) =>
                updateDraft("incidentDate", event.currentTarget.value)
              }
            />
          </FormField>

          <FormField label="Description of incident">
            <Textarea
              value={draft.incidentDescription}
              minH="32"
              onChange={(event) =>
                updateDraft("incidentDescription", event.currentTarget.value)
              }
              placeholder="Summarise what happened, who was affected, and the current situation."
              resize="vertical"
            />
          </FormField>

          <FormField label="Executive summary">
            <Textarea
              value={draft.executiveSummary}
              minH="36"
              onChange={(event) =>
                updateDraft("executiveSummary", event.currentTarget.value)
              }
              placeholder="A concise paragraph explaining what happened and how the incident concluded."
              resize="vertical"
            />
          </FormField>

          <FormField label="Response plan">
            <Textarea
              value={draft.responsePlan}
              minH="40"
              onChange={(event) =>
                updateDraft("responsePlan", event.currentTarget.value)
              }
              placeholder="Describe what responders did to address the incident, including deployment, coordination, treatment, evacuation, containment, or handover steps."
              resize="vertical"
            />
          </FormField>

          <FormField label="Extracted entities">
            <Textarea
              value={draft.entities}
              minH="32"
              onChange={(event) =>
                updateDraft("entities", event.currentTarget.value)
              }
              placeholder="A readable paragraph covering organisations, location, casualties, resources, hospitals, and hazards."
              resize="vertical"
            />
          </FormField>

          {error && <Text color="red.600">{error}</Text>}

          <Box alignItems="center" display="flex" flexWrap="wrap" gap="3">
            <Button type="submit" colorPalette="purple" loading={isSaving}>
              Save report
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={status !== "closed"}
              loading={isGenerating}
              onClick={onGenerate}
            >
              Regenerate analysis
            </Button>
            {generatedBy === "ai" && (
              <Text color="purple.600" fontSize="sm" fontWeight="600">
                AI-generated draft — review before saving
              </Text>
            )}
            {generatedBy === "rules" && (
              <Text color="gray.500" fontSize="sm" fontWeight="600">
                Rule-based draft (AI unavailable)
              </Text>
            )}
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <VStack align="stretch" gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="700">
        {label}
      </Text>
      {children}
    </VStack>
  );
}
