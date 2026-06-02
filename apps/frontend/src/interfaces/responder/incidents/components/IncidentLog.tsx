import { Activity, Clock, FileText, HeartPulse, Truck } from 'lucide-react'
import type { ElementType } from 'react'
import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import type { IncidentLogCategory, IncidentLogEntry } from '../types'

const categoryMeta: Record<
  IncidentLogCategory,
  { label: string; colorPalette: string; icon: ElementType }
> = {
  initial: {
    label: 'Initial',
    colorPalette: 'yellow',
    icon: Clock,
  },
  status: {
    label: 'Status',
    colorPalette: 'blue',
    icon: Activity,
  },
  deploy: {
    label: 'Deploy',
    colorPalette: 'green',
    icon: Truck,
  },
  medical: {
    label: 'Medical',
    colorPalette: 'red',
    icon: HeartPulse,
  },
  note: {
    label: 'Note',
    colorPalette: 'gray',
    icon: FileText,
  },
}

export function IncidentLog({ entries }: { entries: IncidentLogEntry[] }) {
  return (
    <Box flex="1" minH="0" p="6" overflowY="auto">
      <VStack align="stretch" gap="0">
        {entries.map((entry, index) => (
          <IncidentLogRow
            key={entry.id}
            entry={entry}
            isLast={index === entries.length - 1}
          />
        ))}
      </VStack>
    </Box>
  )
}

function IncidentLogRow({
  entry,
  isLast,
}: {
  entry: IncidentLogEntry
  isLast: boolean
}) {
  const meta = categoryMeta[entry.category]

  return (
    <Flex align="stretch" gap="4">
      <VStack gap="0" align="center">
        <Flex
          align="center"
          justify="center"
          boxSize="9"
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          color={`${meta.colorPalette}.600`}
        >
          <Icon as={meta.icon} boxSize="4" />
        </Flex>

        {!isLast && <Box w="1px" flex="1" bg="gray.200" />}
      </VStack>

      <Box flex="1" pb={isLast ? '0' : '8'}>
        <Flex justify="space-between" align="start" gap="4">
          <Box>
            <HStack gap="2" mb="1" wrap="wrap">
              <Text color={`${meta.colorPalette}.700`} fontWeight="800">
                {meta.label}
              </Text>

              <Badge colorPalette="gray" variant="subtle">
                {entry.source}
              </Badge>
            </HStack>

            <Text color="gray.500" fontSize="sm">
              {entry.author}
            </Text>

            <Text color="gray.800" mt="1">
              {entry.body}
            </Text>
          </Box>

          <Text color="gray.400" fontSize="sm" whiteSpace="nowrap">
            {entry.time}
          </Text>
        </Flex>
      </Box>
    </Flex>
  )
}
