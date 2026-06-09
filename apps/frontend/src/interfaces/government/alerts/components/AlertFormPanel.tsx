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
import {
  alertMetricDefinitions,
  alertMetricLabelByValue,
} from '../data/sampleGovernmentAlerts'
import type {
  AlertCondition,
  AlertMetric,
  AlertUnit,
  NewAlertInput,
} from '../types/alert'

type AlertFormPanelProps = {
  isOpen: boolean
  onClose: () => void
  onCreateAlert: (alert: NewAlertInput) => void
}

const firstMetric = alertMetricDefinitions[0]

const initialFormState: NewAlertInput = {
  name: `${firstMetric.label} threshold`,
  metric: firstMetric.value,
  thresholdValue: 10,
  condition: 'above',
  unit: firstMetric.defaultUnit,
  notificationMessage:
    'Notify government command when this metric exceeds the configured threshold.',
}

function getDefaultMessage(
  metric: AlertMetric,
  condition: AlertCondition,
  thresholdValue: number,
  unit: AlertUnit,
) {
  const metricLabel = alertMetricLabelByValue[metric].toLowerCase()
  const conditionText = condition === 'above' ? 'exceeds' : 'drops below'
  const suffix = unit === 'percent' ? '%' : ''

  return `Notify government command when ${metricLabel} ${conditionText} ${thresholdValue}${suffix}.`
}

export function AlertFormPanel({
  isOpen,
  onClose,
  onCreateAlert,
}: AlertFormPanelProps) {
  const [form, setForm] = useState<NewAlertInput>(initialFormState)

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
    const metricDefinition = alertMetricDefinitions.find(
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
      notificationMessage: getDefaultMessage(
        metric,
        currentForm.condition,
        currentForm.thresholdValue,
        metricDefinition.defaultUnit,
      ),
    }))
  }

  function handleRegenerateMessage() {
    setForm((currentForm) => ({
      ...currentForm,
      notificationMessage: getDefaultMessage(
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
