import { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
} from '../../../../components/chakra-ui'
import { AiDraftAssistant } from './AiDraftAssistant'
import { BroadcastAudienceSelector } from './BroadcastAudienceSelector'
import { BroadcastSeveritySelector } from './BroadcastSeveritySelector'
import { BroadcastZoneSelector } from './BroadcastZoneSelector'
import type {
  BroadcastAudience,
  BroadcastSeverity,
  BroadcastZone,
  NewBroadcastInput,
} from '../types/broadcast'

type BroadcastFormDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onPublish: (broadcast: NewBroadcastInput) => void
}

const initialFormState: NewBroadcastInput = {
  title: '',
  message: '',
  audience: 'Public',
  zone: 'Nationwide',
  severity: 'Low',
}

function getAudienceLabel(audience: BroadcastAudience, zone: BroadcastZone) {
  if (audience === 'Public') {
    return 'members of the public'
  }

  if (audience === 'Responders') {
    return 'all response teams'
  }

  return `residents and responders in ${zone}`
}

function getActionBySeverity(severity: BroadcastSeverity) {
  if (severity === 'Critical') {
    return 'take immediate precautions, avoid the affected area, and follow official emergency instructions.'
  }

  if (severity === 'High') {
    return 'avoid the affected area where possible, stay alert, and monitor official updates closely.'
  }

  if (severity === 'Medium') {
    return 'exercise caution, expect possible disruption, and check official channels for updates.'
  }

  return 'stay informed and follow official updates if the situation changes.'
}

function getGeneratedDraft(form: NewBroadcastInput) {
  const audienceLabel = getAudienceLabel(form.audience, form.zone)
  const action = getActionBySeverity(form.severity)

  const zoneText = form.audience === 'Zone' ? ` - ${form.zone}` : ''

  const title = `${form.severity} Advisory${zoneText}`

  const message = `This is a ${form.severity.toLowerCase()} advisory for ${audienceLabel}. Please ${action} Further updates will be provided through OneTogether as the situation develops.`

  return {
    title,
    message,
  }
}

export function BroadcastFormDrawer({
  isOpen,
  onClose,
  onPublish,
}: BroadcastFormDrawerProps) {
  const [form, setForm] = useState<NewBroadcastInput>(initialFormState)

  function updateForm<Key extends keyof NewBroadcastInput>(
    key: Key,
    value: NewBroadcastInput[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
  }

  function handleSelectAudience(audience: BroadcastAudience) {
    setForm((currentForm) => ({
      ...currentForm,
      audience,
      zone: audience === 'Zone' ? currentForm.zone : 'Nationwide',
    }))
  }

  function handleRegenerateDraft() {
    const generatedDraft = getGeneratedDraft(form)

    setForm((currentForm) => ({
      ...currentForm,
      title: generatedDraft.title,
      message: generatedDraft.message,
    }))
  }

  function handlePublish() {
    if (!form.title.trim() || !form.message.trim()) {
      return
    }

    onPublish(form)
    setForm(initialFormState)
  }

  function handleCancel() {
    setForm(initialFormState)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="5">
      <Stack gap="5">
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          gap="3"
          justify="space-between"
        >
          <Box>
            <Heading size="lg" color="gray.900">
              New Broadcast
            </Heading>

            <Text color="gray.500" fontSize="sm" mt="1">
              Create an emergency communication for citizens, responders, or
              selected zones.
            </Text>
          </Box>

          <Button
            alignSelf={{ base: 'flex-start', md: 'center' }}
            variant="outline"
            onClick={handleCancel}
          >
            Close
          </Button>
        </Flex>

        <BroadcastAudienceSelector
          selectedAudience={form.audience}
          onSelectAudience={handleSelectAudience}
        />

        {form.audience === 'Zone' && (
          <BroadcastZoneSelector
            selectedZone={form.zone}
            onSelectZone={(zone: BroadcastZone) => updateForm('zone', zone)}
          />
        )}

        <BroadcastSeveritySelector
          selectedSeverity={form.severity}
          onSelectSeverity={(severity: BroadcastSeverity) =>
            updateForm('severity', severity)
          }
        />

        <AiDraftAssistant onRegenerate={handleRegenerateDraft} />

        <Box>
          <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
            Title
          </Text>

          <Input
            bg="white"
            borderColor="gray.300"
            value={form.title}
            onChange={(event) => updateForm('title', event.target.value)}
            placeholder="e.g. Emergency Advisory - Immediate Action Required"
          />
        </Box>

        <Box>
          <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
            Message
          </Text>

          <Textarea
            bg="white"
            borderColor="gray.300"
            minH="140px"
            value={form.message}
            onChange={(event) => updateForm('message', event.target.value)}
            placeholder="Write the broadcast message. Include what happened, who is affected, what action to take, and where to get updates."
          />
        </Box>

        <HStack justify="flex-end" gap="3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <Button
            bg="blue.900"
            color="white"
            disabled={!form.title.trim() || !form.message.trim()}
            onClick={handlePublish}
            _hover={{
              bg: 'blue.800',
            }}
          >
            Publish Broadcast
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}