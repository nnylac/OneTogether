import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import {
  fetchSituationSummary,
  type SituationSummary,
} from '../api/situationSummaryApi'

const sectionLabels: Array<{
  id: keyof NonNullable<SituationSummary['sections']>
  label: string
}> = [
  { id: 'overview', label: 'Overview' },
  { id: 'keyRisks', label: 'Key risks' },
  { id: 'resourcePosture', label: 'Resource posture' },
  { id: 'recommendedActions', label: 'Recommended attention items' },
]

const unavailableMessage = 'Situation summary is unavailable right now.'

// Fetches independently of useGovernmentDashboard so a slow AI call never
// blocks the rest of the dashboard.
export function SituationSummaryPanel() {
  const [summary, setSummary] = useState<SituationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const next = await fetchSituationSummary(false)
        if (!isMounted) return
        setSummary(next)
        setError(null)
      } catch {
        if (isMounted) setError(unavailableMessage)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleRefresh() {
    setIsLoading(true)
    setError(null)
    try {
      setSummary(await fetchSituationSummary(true))
    } catch {
      setError(unavailableMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="5">
      <Flex align="center" justify="space-between" gap="3" mb="3">
        <Box>
          <Heading size="md" color="gray.900">
            Situation briefing
          </Heading>
          <Text color="gray.500" fontSize="sm" mt="1">
            AI-generated national situation summary for command review.
          </Text>
        </Box>

        <Button
          loading={isLoading}
          size="sm"
          variant="outline"
          onClick={() => void handleRefresh()}
        >
          <Icon as={RefreshCw} />
          Refresh
        </Button>
      </Flex>

      {error && (
        <Text color="orange.600" fontSize="sm" fontWeight="600">
          {error}
        </Text>
      )}

      {isLoading && !summary && (
        <Text color="gray.500" fontSize="sm">
          Generating situation briefing...
        </Text>
      )}

      {summary?.sections && (
        <Stack gap="3">
          {sectionLabels.map(({ id, label }) => (
            <Box key={id}>
              <Text color="gray.700" fontSize="sm" fontWeight="800">
                {label}
              </Text>
              <Text color="gray.700" fontSize="sm" mt="1" whiteSpace="pre-wrap">
                {summary.sections?.[id]}
              </Text>
            </Box>
          ))}
        </Stack>
      )}

      {summary && summary.source === 'fallback' && (
        <Box>
          <Text color="orange.600" fontSize="sm" fontWeight="600" mb="1">
            AI summary unavailable — showing aggregate figures.
          </Text>
          <Text color="gray.700" fontSize="sm">
            {summary.fallbackText}
          </Text>
        </Box>
      )}

      {summary && (
        <Text color="gray.400" fontSize="xs" mt="3">
          Generated {new Date(summary.generatedAt).toLocaleString('en-SG')} ·
          AI-assisted, verify before acting
        </Text>
      )}
    </Box>
  )
}
