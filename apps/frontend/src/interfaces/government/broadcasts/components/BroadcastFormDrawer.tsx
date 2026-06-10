import { useCallback, useState } from 'react'
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
import { BroadcastTranslationPanel } from './BroadcastTranslationPanel'
import {
  requestAiBroadcastDraft,
  requestBroadcastTranslations,
  type BroadcastTranslations,
} from '../api/aiBroadcastApi'
import { BroadcastAudienceSelector } from './BroadcastAudienceSelector'
import { BroadcastResponderOrganisationSelector } from './BroadcastResponderOrganisationSelector'
import { BroadcastSeveritySelector } from './BroadcastSeveritySelector'
import { BroadcastZoneSelector } from './BroadcastZoneSelector'
import type { OrganisationApiDto } from '../../../responder/incidents/api/incidentsDto'
import type {
  BroadcastAudience,
  BroadcastSeverity,
  BroadcastZone,
  NewBroadcastInput,
} from '../types/broadcast'

type BroadcastFormDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onPublish: (broadcast: NewBroadcastInput) => Promise<void>
}

const initialFormState: NewBroadcastInput = {
  title: '',
  message: '',
  audience: 'Public',
  zone: 'Nationwide',
  responderOrganisationIds: [],
  responderOrganisationNames: [],
  severity: 'info',
}

function getAudienceLabel(audience: BroadcastAudience, zone: BroadcastZone) {
  if (audience === 'Public') {
    return 'members of the public'
  }

  if (audience === 'Responders') {
    return 'selected response teams'
  }

  return `residents and responders in ${zone}`
}

function getActionBySeverity(severity: BroadcastSeverity) {
  if (severity === 'critical') {
    return 'take immediate precautions, avoid the affected area, and follow official emergency instructions.'
  }

  if (severity === 'warning') {
    return 'avoid the affected area where possible, stay alert, and monitor official updates closely.'
  }

  if (severity === 'advisory') {
    return 'exercise caution, expect possible disruption, and check official channels for updates.'
  }

  return 'stay informed and follow official updates if the situation changes.'
}

function getGeneratedDraft(form: NewBroadcastInput) {
  const audienceLabel = getAudienceLabel(form.audience, form.zone)
  const action = getActionBySeverity(form.severity)

  const zoneText = form.audience === 'Zone' ? ` - ${form.zone}` : ''
  const severityText =
    form.severity.charAt(0).toUpperCase() + form.severity.slice(1)

  const title = `${severityText} Advisory${zoneText}`

  const message = `This is a ${form.severity} advisory for ${audienceLabel}. Please ${action} Further updates will be provided through OneTogether as the situation develops.`

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
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translations, setTranslations] =
    useState<BroadcastTranslations | null>(null)
  const [translationError, setTranslationError] = useState<string | null>(null)

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
      responderOrganisationIds:
        audience === 'Responders'
          ? currentForm.responderOrganisationIds
          : [],
      responderOrganisationNames:
        audience === 'Responders'
          ? currentForm.responderOrganisationNames
          : [],
    }))
  }

  const handleSelectResponderOrganisations = useCallback(
    (organisations: OrganisationApiDto[]) => {
      setForm((currentForm) => ({
        ...currentForm,
        responderOrganisationIds: organisations.map(
          (organisation) => organisation.id,
        ),
        responderOrganisationNames: organisations.map(
          (organisation) => organisation.orgName,
        ),
      }))
    },
    [],
  )

  async function handleRegenerateDraft() {
    setIsDrafting(true)
    setDraftNotice(null)
    setTranslations(null)

    try {
      const aiDraft = await requestAiBroadcastDraft(form)
      setForm((currentForm) => ({
        ...currentForm,
        title: aiDraft.title,
        message: aiDraft.message,
      }))
    } catch {
      // Backend AI is unavailable — keep the original client-side template
      // so the assistant always produces a usable draft.
      const generatedDraft = getGeneratedDraft(form)
      setForm((currentForm) => ({
        ...currentForm,
        title: generatedDraft.title,
        message: generatedDraft.message,
      }))
      setDraftNotice('Showing template draft (AI unavailable).')
    } finally {
      setIsDrafting(false)
    }
  }

  async function handleTranslate() {
    if (!form.title.trim() || !form.message.trim()) {
      return
    }

    setIsTranslating(true)
    setTranslationError(null)

    try {
      setTranslations(
        await requestBroadcastTranslations({
          title: form.title,
          message: form.message,
        }),
      )
    } catch {
      setTranslations(null)
      setTranslationError('Translation unavailable. Try again later.')
    } finally {
      setIsTranslating(false)
    }
  }

  async function handlePublish() {
    if (
      !form.title.trim() ||
      !form.message.trim() ||
      (form.audience === 'Responders' &&
        form.responderOrganisationIds.length === 0)
    ) {
      return
    }

    setIsPublishing(true)

    try {
      await onPublish(form)
      setForm(initialFormState)
      resetAiState()
    } finally {
      setIsPublishing(false)
    }
  }

  function resetAiState() {
    setDraftNotice(null)
    setTranslations(null)
    setTranslationError(null)
  }

  function handleCancel() {
    setForm(initialFormState)
    resetAiState()
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

        {form.audience === 'Responders' && (
          <BroadcastResponderOrganisationSelector
            selectedOrganisationIds={form.responderOrganisationIds}
            onSelectOrganisations={handleSelectResponderOrganisations}
          />
        )}

        <BroadcastSeveritySelector
          selectedSeverity={form.severity}
          onSelectSeverity={(severity: BroadcastSeverity) =>
            updateForm('severity', severity)
          }
        />

        <AiDraftAssistant
          isGenerating={isDrafting}
          notice={draftNotice}
          onRegenerate={() => void handleRegenerateDraft()}
        />

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

        {translationError && (
          <Text color="orange.600" fontSize="sm" fontWeight="600">
            {translationError}
          </Text>
        )}

        {translations && <BroadcastTranslationPanel translations={translations} />}

        <HStack justify="flex-end" gap="3">
          <Button
            disabled={
              isTranslating || !form.title.trim() || !form.message.trim()
            }
            loading={isTranslating}
            variant="outline"
            onClick={() => void handleTranslate()}
          >
            Translate (EN/中文/MS/TA)
          </Button>

          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <Button
            bg="blue.900"
            color="white"
            disabled={
              isPublishing ||
              !form.title.trim() ||
              !form.message.trim() ||
              (form.audience === 'Responders' &&
                form.responderOrganisationIds.length === 0)
            }
            onClick={handlePublish}
            _hover={{
              bg: 'blue.800',
            }}
          >
            {isPublishing ? 'Publishing...' : 'Publish Broadcast'}
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}
