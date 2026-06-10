import { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
} from '../../../../components/chakra-ui'
import { AlertConditionSelector } from './AlertConditionSelector'
import { AlertMetricSelector } from './AlertMetricSelector'
import type {
  AlertCondition,
  AlertMetric,
  AlertMetricDefinition,
  AlertUnit,
  NewAlertInput,
} from '../types/alert'

type AlertFormPanelProps = {
  metricDefinitions: AlertMetricDefinition[]
  isOpen: boolean
  onClose: () => void
  onCreateAlert: (alert: NewAlertInput) => void
}

function getDefaultMessage(
  metricDefinitions: AlertMetricDefinition[],
  metric: AlertMetric,
  condition: AlertCondition,
  thresholdValue: number,
  unit: AlertUnit,
) {
  const metricLabel =
    metricDefinitions.find((definition) => definition.value === metric)?.label ??
    metric
  const conditionText = condition === 'above' ? 'exceeds' : 'drops below'
  const suffix = unit === 'percent' ? '%' : ''

  return `Notify government command when ${metricLabel.toLowerCase()} ${conditionText} ${thresholdValue}${suffix}.`
}

function getInitialFormState(
  metricDefinitions: AlertMetricDefinition[],
): NewAlertInput {
  const firstMetric = metricDefinitions[0]
  if (!firstMetric) {
    return {
      name: '',
      metric: 'openIncidents',
      thresholdValue: 10,
      condition: 'above',
      unit: 'count',
      notificationMessage: '',
    }
  }

  return {
    name: `${firstMetric.label} threshold`,
    metric: firstMetric.value,
    thresholdValue: firstMetric.defaultThresholdValue,
    condition: 'above',
    unit: firstMetric.defaultUnit,
    notificationMessage: getDefaultMessage(
      metricDefinitions,
      firstMetric.value,
      'above',
      firstMetric.defaultThresholdValue,
      firstMetric.defaultUnit,
    ),
  }
}

export function AlertFormPanel({
  metricDefinitions,
  isOpen,
  onClose,
  onCreateAlert,
}: AlertFormPanelProps) {
  const [form, setForm] = useState<NewAlertInput>(() =>
    getInitialFormState(metricDefinitions),
  )

  function updateForm<Key extends keyof NewAlertInput>(
    key: Key,
    value: NewAlertInput[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
  }

  function handleSelectMetric(metric: AlertMetric) {
    const metricDefinition = metricDefinitions.find(
      (definition) => definition.value === metric,
    )

    if (!metricDefinition) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      metric,
      name: `${metricDefinition.label} threshold`,
      unit: metricDefinition.defaultUnit,
      thresholdValue: metricDefinition.defaultThresholdValue,
      notificationMessage: getDefaultMessage(
        metricDefinitions,
        metric,
        currentForm.condition,
        metricDefinition.defaultThresholdValue,
        metricDefinition.defaultUnit,
      ),
    }))
  }

  function handleRegenerateMessage() {
    setForm((currentForm) => ({
      ...currentForm,
      notificationMessage: getDefaultMessage(
        metricDefinitions,
        currentForm.metric,
        currentForm.condition,
        currentForm.thresholdValue,
        currentForm.unit,
      ),
    }))
  }

  function handleCreateAlert() {
    if (!form.name.trim() || !form.notificationMessage.trim()) {
      return
    }

    if (Number.isNaN(form.thresholdValue) || form.thresholdValue <= 0) {
      return
    }

    onCreateAlert(form)
    setForm(getInitialFormState(metricDefinitions))
  }

  function handleCancel() {
    setForm(getInitialFormState(metricDefinitions))
    onClose()
  }

  if (!isOpen) {
    return null
  }

  if (metricDefinitions.length === 0) {
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
              Create Alert Rule
            </Heading>

            <Text color="gray.500" fontSize="sm" mt="1">
              Set a monitored metric, threshold limit, and notification message.
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

        <AlertMetricSelector
          metricDefinitions={metricDefinitions}
          selectedMetric={form.metric}
          onSelectMetric={handleSelectMetric}
        />

        <AlertConditionSelector
          selectedCondition={form.condition}
          onSelectCondition={(condition) => updateForm('condition', condition)}
        />

        <Flex direction={{ base: 'column', md: 'row' }} gap="4">
          <Box flex="1">
            <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
              Threshold value
            </Text>
            <Input
              bg="white"
              borderColor="gray.300"
              min="1"
              type="number"
              value={form.thresholdValue}
              onChange={(event) =>
                updateForm('thresholdValue', Number(event.target.value))
              }
            />
          </Box>

          <Box flex="1">
            <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
              Unit
            </Text>
            <Select
              bg="white"
              borderColor="gray.300"
              value={form.unit}
              onChange={(event) =>
                updateForm('unit', event.target.value as AlertUnit)
              }
            >
              <option value="count">Count</option>
              <option value="percent">Percent (%)</option>
            </Select>
          </Box>
        </Flex>

        <Box>
          <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
            Alert name
          </Text>
          <Input
            bg="white"
            borderColor="gray.300"
            value={form.name}
            onChange={(event) => updateForm('name', event.target.value)}
            placeholder="e.g. Hospital occupancy threshold"
          />
        </Box>

        <Box>
          <Flex align="center" justify="space-between" mb="2" gap="3">
            <Text color="gray.700" fontSize="sm" fontWeight="800">
              Notification message
            </Text>

            <Button size="xs" variant="outline" onClick={handleRegenerateMessage}>
              Generate message
            </Button>
          </Flex>

          <Textarea
            bg="white"
            borderColor="gray.300"
            minH="110px"
            value={form.notificationMessage}
            onChange={(event) =>
              updateForm('notificationMessage', event.target.value)
            }
            placeholder="Write what government command should be notified about."
          />
        </Box>

        <HStack justify="flex-end" gap="3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <Button
            bg="blue.900"
            color="white"
            disabled={
              !form.name.trim() ||
              !form.notificationMessage.trim() ||
              form.thresholdValue <= 0
            }
            onClick={handleCreateAlert}
            _hover={{
              bg: 'blue.800',
            }}
          >
            Create Alert
          </Button>
        </HStack>
      </Stack>
    </Box>
  )
}
