import { Box, Select, Text } from '../../../../components/chakra-ui'
import { alertMetricDefinitions } from '../data/sampleGovernmentAlerts'
import type { AlertMetric } from '../types/alert'

type AlertMetricSelectorProps = {
  selectedMetric: AlertMetric
  onSelectMetric: (metric: AlertMetric) => void
}

export function AlertMetricSelector({
  selectedMetric,
  onSelectMetric,
}: AlertMetricSelectorProps) {
  return (
    <Box>
      <Text color="gray.700" fontSize="sm" fontWeight="800" mb="2">
        Metric to monitor
      </Text>

      <Select
        bg="white"
        borderColor="gray.300"
        value={selectedMetric}
        onChange={(event) => onSelectMetric(event.target.value as AlertMetric)}
      >
        {alertMetricDefinitions.map((metric) => (
          <option key={metric.value} value={metric.value}>
            {metric.label}
          </option>
        ))}
      </Select>
    </Box>
  )
}
