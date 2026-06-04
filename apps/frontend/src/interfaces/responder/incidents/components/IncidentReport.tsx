import type { ReactNode } from 'react'
import {
  Box,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
} from '../../../../components/chakra-ui'
import type { IncidentReportDraft } from '../types'

type IncidentReportProps = {
  draft: IncidentReportDraft
  onDraftChange: (draft: IncidentReportDraft) => void
}

export function IncidentReport({ draft, onDraftChange }: IncidentReportProps) {
  function updateDraft(field: keyof IncidentReportDraft, value: string) {
    onDraftChange({ ...draft, [field]: value })
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

        <VStack as="form" align="stretch" gap="5">
          <FormField label="Name of incident">
            <Input
              value={draft.incidentName}
              onChange={(event) => updateDraft('incidentName', event.currentTarget.value)}
            />
          </FormField>

          <FormField label="Date of incident">
            <Input
              value={draft.incidentDate}
              onChange={(event) => updateDraft('incidentDate', event.currentTarget.value)}
            />
          </FormField>

          <FormField label="Description of incident">
            <Textarea
              value={draft.incidentDescription}
              minH="32"
              onChange={(event) => updateDraft('incidentDescription', event.currentTarget.value)}
              placeholder="Summarise what happened, who was affected, and the current situation."
              resize="vertical"
            />
          </FormField>

          <FormField label="Response plan">
            <Textarea
              value={draft.responsePlan}
              minH="40"
              onChange={(event) => updateDraft('responsePlan', event.currentTarget.value)}
              placeholder="Describe what responders did to address the incident, including deployment, coordination, treatment, evacuation, containment, or handover steps."
              resize="vertical"
            />
          </FormField>

          <FormField label="Other notes about incident">
            <Textarea
              value={draft.otherNotes}
              minH="32"
              onChange={(event) => updateDraft('otherNotes', event.currentTarget.value)}
              placeholder="Add any additional observations, constraints, follow-ups, or handover notes."
              resize="vertical"
            />
          </FormField>
        </VStack>
      </VStack>
    </Box>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <VStack align="stretch" gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="700">
        {label}
      </Text>
      {children}
    </VStack>
  )
}
