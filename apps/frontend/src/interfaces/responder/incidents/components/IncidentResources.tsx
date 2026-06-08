import { Fragment, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Select,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import {
  assignOrganisationToIncident,
  fetchOrganisations,
} from '../api/incidentsApi'
import { fetchIncidentMap } from '../api/incidentMapApi'
import type { IncidentMapDto, IncidentMapResourceDto } from '../api/incidentMapDto'
import type { OrganisationApiDto } from '../api/incidentsDto'
import type { IncidentResource } from '../types'
import {
  ARRIVED_STATUSES,
  kindMeta,
  liveEtaMinutes,
  remainingKm,
  statusColor,
  statusLabel,
} from '../utils/incidentMapResource'

const MAP_REFRESH_MS = 2500
const CLOCK_TICK_MS = 1000

type IncidentResourcesProps = {
  incidentId: string
  onResourcesChange: (resources: IncidentResource[]) => void
  resources: IncidentResource[]
}

export function IncidentResources({
  incidentId,
  onResourcesChange,
  resources,
}: IncidentResourcesProps) {
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAssignPanelOpen, setIsAssignPanelOpen] = useState(false)
  const [openNotesResourceId, setOpenNotesResourceId] = useState<string | null>(null)
  const [organisations, setOrganisations] = useState<OrganisationApiDto[]>([])
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('')

  const [snapshot, setSnapshot] = useState<IncidentMapDto | null>(null)
  const [isLoadingUnits, setIsLoadingUnits] = useState(true)
  const [unitsError, setUnitsError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Poll the operational map snapshot so the assigned-units view matches the Map tab.
  useEffect(() => {
    let isMounted = true

    async function load(showLoading: boolean) {
      if (showLoading) {
        setIsLoadingUnits(true)
        setSnapshot(null)
      }
      try {
        const data = await fetchIncidentMap(incidentId)
        if (!isMounted) return
        setSnapshot(data)
        setUnitsError(null)
      } catch {
        if (isMounted) setUnitsError('Unable to load dispatched units.')
      } finally {
        if (showLoading && isMounted) setIsLoadingUnits(false)
      }
    }

    void load(true)
    const refreshId = window.setInterval(() => void load(false), MAP_REFRESH_MS)
    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [incidentId])

  // Tick a steady clock so ETA and distance count down live.
  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS)
    return () => window.clearInterval(tickId)
  }, [])

  const units = useMemo(() => snapshot?.resources ?? [], [snapshot])

  useEffect(() => {
    if (!isAssignPanelOpen || organisations.length > 0) {
      return
    }

    let isMounted = true

    fetchOrganisations()
      .then((loadedOrganisations) => {
        if (isMounted) {
          setOrganisations(loadedOrganisations)
          setSelectedOrganisationId(loadedOrganisations[0]?.id ?? '')
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssignmentError('Unable to load organisations.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAssignPanelOpen, organisations.length])

  const assignedAgencies = new Set(resources.map((resource) => resource.agency))
  const assignableOrganisations = organisations.filter(
    (organisation) => !assignedAgencies.has(organisation.orgName),
  )

  // Derive the effective selection so it stays valid as the assignable list changes,
  // without an effect that syncs state back into itself.
  const effectiveSelectedId =
    selectedOrganisationId &&
    assignableOrganisations.some((organisation) => organisation.id === selectedOrganisationId)
      ? selectedOrganisationId
      : assignableOrganisations[0]?.id ?? ''

  async function assignOrganisation() {
    if (!effectiveSelectedId) {
      return
    }

    setAssignmentError(null)
    setIsAssigning(true)

    try {
      const updatedIncident = await assignOrganisationToIncident(
        incidentId,
        effectiveSelectedId,
      )

      onResourcesChange(updatedIncident.resources ?? [])
      setIsAssignPanelOpen(false)
    } catch {
      setAssignmentError('Unable to assign organisation to this incident.')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Box flex="1" minH="0" overflowY="auto" p="6">
      <VStack align="stretch" gap="5">
        <Flex justify="space-between" align={{ base: 'stretch', lg: 'center' }} gap="4" direction={{ base: 'column', lg: 'row' }}>
          <Box>
            <Heading size="xl" color="gray.900">
              Assigned resources
            </Heading>
            <Text color="gray.500" mt="1">
              {units.length} {units.length === 1 ? 'unit' : 'units'} dispatched
            </Text>
          </Box>

          <Button
            bg="purple.600"
            color="white"
            alignSelf={{ base: 'flex-start', lg: 'center' }}
            onClick={() => {
              setAssignmentError(null)
              setIsAssignPanelOpen((isOpen) => !isOpen)
            }}
            _hover={{ bg: 'purple.700' }}
          >
            <Icon as={Plus} />
            Assign unit
          </Button>
        </Flex>

        {isAssignPanelOpen && (
          <Box bg="gray.50" borderColor="gray.200" borderWidth="1px" p="4">
            <Flex
              align={{ base: 'stretch', md: 'end' }}
              direction={{ base: 'column', md: 'row' }}
              gap="3"
            >
              <Box flex="1">
                <Text color="gray.700" fontSize="sm" fontWeight="700" mb="2">
                  Organisation
                </Text>
                <Select
                  aria-label="Organisation to assign"
                  onChange={(event) => setSelectedOrganisationId(event.currentTarget.value)}
                  value={effectiveSelectedId}
                >
                  {assignableOrganisations.length > 0 ? (
                    assignableOrganisations.map((organisation) => (
                      <option key={organisation.id} value={organisation.id}>
                        {organisation.orgName}
                      </option>
                    ))
                  ) : (
                    <option value="">No organisations available</option>
                  )}
                </Select>
              </Box>

              <Button
                bg="gray.900"
                color="white"
                disabled={!effectiveSelectedId || isAssigning}
                onClick={assignOrganisation}
                _hover={{ bg: 'gray.800' }}
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </Button>
            </Flex>

            {assignmentError && (
              <Text color="red.600" fontSize="sm" fontWeight="700" mt="3">
                {assignmentError}
              </Text>
            )}
          </Box>
        )}

        <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" tableLayout="fixed" minW="1020px">
            <Box as="colgroup">
              <Box as="col" width="18%" />
              <Box as="col" width="11%" />
              <Box as="col" width="14%" />
              <Box as="col" width="18%" />
              <Box as="col" width="15%" />
              <Box as="col" width="12%" />
              <Box as="col" width="12%" />
            </Box>

            <Box as="thead" bg="gray.50">
              <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
                <HeaderCell>Unit</HeaderCell>
                <HeaderCell>Agency</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell>Responding from</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell textAlign="right">ETA</HeaderCell>
                <HeaderCell textAlign="right">Distance</HeaderCell>
              </Box>
            </Box>

            <Box as="tbody">
              {units.length === 0 ? (
                <Box as="tr">
                  <td colSpan={7}>
                    <Box px="5" py="10" textAlign="center">
                      <Text color="gray.500" fontWeight="600">
                        {isLoadingUnits
                          ? 'Loading dispatched units…'
                          : unitsError ?? 'No units dispatched yet.'}
                      </Text>
                    </Box>
                  </td>
                </Box>
              ) : (
                units.map((unit) => (
                  <UnitRow
                    key={unit.id}
                    unit={unit}
                    nowMs={nowMs}
                    isOpen={openNotesResourceId === unit.id}
                    onToggle={() =>
                      setOpenNotesResourceId((currentId) =>
                        currentId === unit.id ? null : unit.id,
                      )
                    }
                  />
                ))
              )}
            </Box>
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}

function UnitRow({
  unit,
  nowMs,
  isOpen,
  onToggle,
}: {
  unit: IncidentMapResourceDto
  nowMs: number
  isOpen: boolean
  onToggle: () => void
}) {
  const arrived = ARRIVED_STATUSES.has(unit.status)
  const eta = liveEtaMinutes(unit, nowMs)
  const remaining = remainingKm(unit, nowMs)

  return (
    <Fragment>
      <Box
        as="tr"
        borderBottomWidth="1px"
        borderColor="gray.100"
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: 'gray.50' }}
      >
        <BodyCell>
          <Flex align="center" gap="2" minW="0">
            <Icon as={kindMeta(unit.resourceKind).icon} color="gray.500" boxSize="4" flexShrink="0" />
            <Text color="gray.900" fontWeight="700" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {unit.unitRef}
            </Text>
          </Flex>
        </BodyCell>

        <BodyCell>
          <Text color="gray.700" fontWeight="700">
            {unit.agency}
          </Text>
        </BodyCell>

        <BodyCell>
          <Text color="gray.600">{kindMeta(unit.resourceKind).label}</Text>
        </BodyCell>

        <BodyCell>
          <Text color="gray.600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {unit.originStation ?? '—'}
          </Text>
        </BodyCell>

        <BodyCell>
          <Flex align="center" gap="2">
            <Box width="8px" height="8px" borderRadius="full" bg={statusColor(unit.status)} flexShrink="0" />
            <Text color="gray.700" fontWeight="600">
              {statusLabel(unit.status)}
            </Text>
          </Flex>
        </BodyCell>

        <BodyCell textAlign="right">
          {arrived ? (
            <Text color="green.600" fontWeight="600">
              On scene
            </Text>
          ) : eta != null ? (
            <Text color="gray.700" fontWeight="600">
              {eta} min
            </Text>
          ) : (
            <Text color="gray.400">—</Text>
          )}
        </BodyCell>

        <BodyCell textAlign="right">
          {remaining != null ? (
            <Text color="gray.700" fontWeight="600">
              {remaining.toFixed(1)} km
            </Text>
          ) : (
            <Text color="gray.400">—</Text>
          )}
        </BodyCell>
      </Box>

      {isOpen && (
        <Box as="tr" borderBottomWidth="1px" borderColor="gray.100">
          <td colSpan={7}>
            <Box bg="gray.50" px="5" py="4">
              <Flex gap="8" wrap="wrap">
                <Box>
                  <DetailLabel>Dispatched</DetailLabel>
                  <Text color="gray.800" fontWeight="600">
                    {formatDispatchedAt(unit.dispatchedAt)}
                  </Text>
                </Box>
                <Box flex="1" minW="240px">
                  <DetailLabel>Notes</DetailLabel>
                  <Text color="gray.800">{unit.notes?.trim() || 'No notes recorded.'}</Text>
                </Box>
              </Flex>
            </Box>
          </td>
        </Box>
      )}
    </Fragment>
  )
}

function formatDispatchedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date)
}

function DetailLabel({ children }: { children: ReactNode }) {
  return (
    <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase" mb="1">
      {children}
    </Text>
  )
}

function HeaderCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box
      as="th"
      color="gray.500"
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0"
      px="5"
      py="3"
      textAlign={textAlign}
      textTransform="uppercase"
    >
      {children}
    </Box>
  )
}

function BodyCell({
  children,
  textAlign = 'left',
}: {
  children: ReactNode
  textAlign?: 'left' | 'center' | 'right'
}) {
  return (
    <Box as="td" px="5" py="4" textAlign={textAlign} verticalAlign="middle">
      {children}
    </Box>
  )
}
