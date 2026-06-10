import { Box, Flex, Stack, Text } from '../../../../components/chakra-ui'
import type { AnalyticsDistributionItem } from '../../analytics/api/analyticsApi'

type IncidentsByTypeSummaryProps = {
  incidentsByType: AnalyticsDistributionItem[]
}

const barColors = ['#ef4444', '#f59e0b', '#f97316', '#2563eb', '#22a77a', '#64748b']

export function IncidentsByTypeSummary({
  incidentsByType,
}: IncidentsByTypeSummaryProps) {
  const totalIncidents = incidentsByType.reduce(
    (total, item) => total + item.count,
    0,
  )
  const maxCount = Math.max(...incidentsByType.map((item) => item.count), 1)

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" minH="72" p="5">
      <Flex align="center" justify="space-between" gap="4">
        <Text color="gray.900" fontSize="md" fontWeight="900">
          Incidents by Type
        </Text>
        <Text color="gray.700" fontSize="md" fontWeight="800">
          Total: {totalIncidents}
        </Text>
      </Flex>

      <Box bg="gray.200" h="1px" my="5" />

      {incidentsByType.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          No incident types recorded for this period.
        </Text>
      ) : (
        <Stack gap="3">
          {incidentsByType.map((item, index) => (
            <Box
              key={item.key}
              alignItems="center"
              display="grid"
              gap={{ base: '2', md: '4' }}
              gridTemplateColumns={{
                base: '10rem minmax(0, 1fr) 7.5rem',
                md: '13rem minmax(0, 1fr) 10rem',
              }}
              minH="8"
            >
              <Box minW="0">
                <Text
                  color="gray.700"
                  fontSize="sm"
                  overflowWrap="anywhere"
                  textAlign="left"
                >
                  {item.key}
                </Text>
              </Box>

              <Box flex="1" minW="0">
                <Box
                  bg={barColors[index % barColors.length]}
                  h="7"
                  transition="width 0.2s ease"
                  w={getNormalizedWidth(item.count, maxCount)}
                />
              </Box>

              <Text
                color="gray.700"
                fontSize="sm"
                fontWeight="800"
                textAlign="right"
              >
                {item.count} {item.count === 1 ? 'case' : 'cases'}{' '}
                <Text as="span" color="gray.400">
                  ({getPercentageOfTotal(item.count, totalIncidents)}%)
                </Text>
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function getNormalizedWidth(count: number, maxCount: number) {
  if (count <= 0) {
    return '0%'
  }

  return `${Math.max((count / maxCount) * 100, 3)}%`
}

function getPercentageOfTotal(count: number, total: number) {
  if (total === 0) {
    return 0
  }

  return Math.round((count / total) * 100)
}
