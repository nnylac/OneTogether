import { ExternalLink, MapPinOff, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Box, Flex, HStack, Icon, Text, VStack } from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { Incident } from '../../incidents/types'
import { severityColor, severityTone, statusTone } from '../mapShared'

type OverviewIncidentListProps = {
  incidents: Incident[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function OverviewIncidentList({
  incidents,
  selectedId,
  onSelect,
}: OverviewIncidentListProps) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" display="flex" flexDirection="column" minH="0" flex="1">
      <Flex
        align="center"
        justify="space-between"
        px="4"
        py="3"
        borderBottomWidth="1px"
        borderColor="gray.200"
        bg="gray.50"
      >
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          Incident feed
        </Text>
        <Text fontSize="xs" color="gray.500">
          {incidents.length} shown
        </Text>
      </Flex>

      <Box overflowY="auto" flex="1" minH="0" maxH={{ base: '420px', xl: 'none' }}>
        {incidents.length === 0 ? (
          <Box px="4" py="8">
            <Text color="gray.500" fontSize="sm" textAlign="center">
              No incidents match the current filters.
            </Text>
          </Box>
        ) : (
          incidents.map((incident) => {
            const isSelected = incident.id === selectedId
            const isPlotted =
              typeof incident.lat === 'number' && typeof incident.lng === 'number'
            return (
              <Box
                key={incident.id}
                role="button"
                tabIndex={0}
                cursor="pointer"
                width="100%"
                textAlign="left"
                px="4"
                py="3"
                borderBottomWidth="1px"
                borderColor="gray.100"
                borderLeftWidth="3px"
                borderLeftColor={isSelected ? severityColor(incident.severity) : 'transparent'}
                bg={isSelected ? 'gray.50' : 'white'}
                _hover={{ bg: 'gray.50' }}
                onClick={() => onSelect(isSelected ? null : incident.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(isSelected ? null : incident.id)
                  }
                }}
              >
                <Flex align="start" gap="3">
                  <Box
                    mt="1"
                    width="10px"
                    height="10px"
                    borderRadius="full"
                    bg={severityColor(incident.severity)}
                    flexShrink="0"
                  />
                  <VStack gap="1" align="stretch" flex="1" minW="0">
                    <Flex align="center" justify="space-between" gap="2">
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color="gray.900"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {incident.title}
                      </Text>
                      <Text fontSize="2xs" color="gray.400" flexShrink="0">
                        {incident.incidentCode ?? ''}
                      </Text>
                    </Flex>

                    <HStack gap="1.5" align="center" color="gray.500" fontSize="xs">
                      {!isPlotted && <Icon as={MapPinOff} boxSize="3.5" color="orange.400" />}
                      <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {incident.location || 'Location unknown'}
                      </Text>
                    </HStack>

                    <HStack gap="1.5" wrap="wrap" mt="0.5">
                      {incident.severity && (
                        <LabelBox tone={severityTone[incident.severity]}>{incident.severity}</LabelBox>
                      )}
                      <LabelBox tone={statusTone[incident.status]}>
                        {incident.status.replace(/_/g, ' ')}
                      </LabelBox>
                    </HStack>

                    <Flex align="center" justify="space-between" mt="1" gap="2">
                      <HStack gap="2" color="gray.500" fontSize="2xs" wrap="wrap">
                        {incident.assignedOrgs && incident.assignedOrgs.length > 0 && (
                          <Text>{incident.assignedOrgs.join(' · ')}</Text>
                        )}
                        {incident.resources && incident.resources.length > 0 && (
                          <HStack gap="1">
                            <Icon as={Users} boxSize="3" />
                            <Text>{incident.resources.length}</Text>
                          </HStack>
                        )}
                      </HStack>
                      <Text fontSize="2xs" color="gray.400" flexShrink="0">
                        {incident.date}
                      </Text>
                    </Flex>

                    {isSelected && (
                      <Link
                        to={`/responder/incidents/${incident.id}/room`}
                        style={{
                          color: '#6d28d9',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Icon as={ExternalLink} boxSize="3" />
                        Open incident room
                      </Link>
                    )}
                  </VStack>
                </Flex>
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}
