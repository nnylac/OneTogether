import { Package } from 'lucide-react'
import { Box, Flex, HStack, Icon, Text, VStack } from '../../../../components/chakra-ui'
import type {
  ResourceStatus,
  ResourceSummary,
  ResourceSummaryGroup,
  ResourceTotals,
} from '../../resources/api/resourcesApi'

type OverviewResourcePanelProps = {
  summary: ResourceSummary | null
}

const STATUS_COLOR: Record<ResourceStatus, string> = {
  healthy: '#16a34a',
  strained: '#f59e0b',
  critical: '#ef4444',
}

const STATUS_SPLIT: Array<{ key: keyof ResourceTotals; label: string; color: string }> = [
  { key: 'available', label: 'Available', color: '#16a34a' },
  { key: 'deployed', label: 'Deployed', color: '#2563eb' },
  { key: 'reserved', label: 'Reserved', color: '#7c3aed' },
  { key: 'maintenance', label: 'Maintenance', color: '#9ca3af' },
]

export function OverviewResourcePanel({ summary }: OverviewResourcePanelProps) {
  const totals = summary?.totals

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" p="4">
      <Flex justify="space-between" align="center" mb="3">
        <HStack gap="2" align="center">
          <Box
            bg="#0d948814"
            color="#0d9488"
            borderRadius="md"
            width="8"
            height="8"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={Package} boxSize="4.5" />
          </Box>
          <Text fontSize="sm" fontWeight="700" color="gray.800">
            Resources
          </Text>
        </HStack>
        {summary?.lastSyncedAt && (
          <Text fontSize="2xs" color="gray.400">
            synced{' '}
            {new Date(summary.lastSyncedAt).toLocaleTimeString('en-SG', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </Flex>

      {totals ? (
        <VStack gap="4" align="stretch">
          <AvailabilityHeadline totals={totals} />
          <StatusSplit totals={totals} />
          {summary && summary.byAgency.length > 0 && (
            <GroupBreakdown title="By agency" groups={summary.byAgency} />
          )}
          {summary && summary.byCategory.length > 0 && (
            <GroupBreakdown title="By category" groups={summary.byCategory.slice(0, 5)} />
          )}
        </VStack>
      ) : (
        <Text fontSize="sm" color="gray.400">
          Resource feed unavailable
        </Text>
      )}
    </Box>
  )
}

function AvailabilityHeadline({ totals }: { totals: ResourceTotals }) {
  const ratio = totals.total > 0 ? totals.available / totals.total : 0
  return (
    <Box>
      <Flex align="baseline" justify="space-between">
        <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1">
          {totals.available}
          <Text as="span" fontSize="md" fontWeight="600" color="gray.400">
            {' '}
            / {totals.total} available
          </Text>
        </Text>
        <Text fontSize="sm" fontWeight="700" color="gray.600">
          {Math.round(ratio * 100)}%
        </Text>
      </Flex>
      <ProgressBar ratio={ratio} color="#16a34a" mt="2" />
      <Text fontSize="xs" color="gray.500" mt="1">
        {totals.deployed} deployed across all agencies
      </Text>
    </Box>
  )
}

function StatusSplit({ totals }: { totals: ResourceTotals }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em" mb="2">
        Status split
      </Text>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="2">
        {STATUS_SPLIT.map((entry) => (
          <HStack key={entry.key} gap="2" align="center">
            <Box width="9px" height="9px" borderRadius="full" bg={entry.color} flexShrink="0" />
            <Text fontSize="xs" color="gray.600" flex="1">
              {entry.label}
            </Text>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {totals[entry.key]}
            </Text>
          </HStack>
        ))}
      </Box>
    </Box>
  )
}

function GroupBreakdown({ title, groups }: { title: string; groups: ResourceSummaryGroup[] }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.04em" mb="2">
        {title}
      </Text>
      <VStack gap="2.5" align="stretch">
        {groups.map((group) => {
          const ratio = group.totals.total > 0 ? group.totals.available / group.totals.total : 0
          return (
            <Box key={group.key}>
              <Flex align="center" justify="space-between" mb="1" gap="2">
                <HStack gap="1.5" minW="0">
                  <Box
                    width="8px"
                    height="8px"
                    borderRadius="full"
                    bg={STATUS_COLOR[group.status]}
                    flexShrink="0"
                  />
                  <Text fontSize="sm" color="gray.700" fontWeight="600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {group.key}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" flexShrink="0">
                  {group.totals.available}/{group.totals.total}
                </Text>
              </Flex>
              <ProgressBar ratio={ratio} color={STATUS_COLOR[group.status]} />
            </Box>
          )
        })}
      </VStack>
    </Box>
  )
}

function ProgressBar({ ratio, color, mt }: { ratio: number; color: string; mt?: string }) {
  return (
    <Box mt={mt} height="6px" borderRadius="full" bg="gray.100" overflow="hidden">
      <Box
        height="100%"
        borderRadius="full"
        bg={color}
        width={`${Math.max(0, Math.min(1, ratio)) * 100}%`}
        transition="width 0.2s ease"
      />
    </Box>
  )
}
