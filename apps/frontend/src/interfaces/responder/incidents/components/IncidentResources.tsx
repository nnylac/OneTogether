import { Fragment, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Pencil, Plus } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Select,
  Text,
  Textarea,
  VStack,
} from '../../../../components/chakra-ui'
import {
  assignOrganisationToIncident,
  fetchOrganisations,
  updateIncidentAssignedOrganisation,
} from '../api/incidentsApi'
import type { OrganisationApiDto } from '../api/incidentsDto'
import type { IncidentResource, IncidentResourceStatus } from '../types'

const MAP_REFRESH_MS = 2500
const CLOCK_TICK_MS = 1000
const resourceStatuses: IncidentResourceStatus[] = ['dispatched', 'on scene', 'engaged']

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
  const [resourceUpdateError, setResourceUpdateError] = useState<string | null>(null)
  const [savingResourceId, setSavingResourceId] = useState<string | null>(null)
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('')

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

  useEffect(() => {
    if (
      selectedOrganisationId &&
      assignableOrganisations.some((organisation) => organisation.id === selectedOrganisationId)
    ) {
      return
    }

    setSelectedOrganisationId(assignableOrganisations[0]?.id ?? '')
  }, [assignableOrganisations, selectedOrganisationId])

  function updateResource(id: string, updates: Partial<Pick<IncidentResource, 'notes' | 'status'>>) {
    onResourcesChange(
      resources.map((resource) =>
        resource.id === id ? { ...resource, ...updates } : resource,
      ),
    )
  }

  function getResourceOrganisationId(resource: IncidentResource) {
    return resource.organisationId ?? resource.id.split(':')[1] ?? ''
  }

  async function persistResourceUpdate(
    resource: IncidentResource,
    updates: Partial<Pick<IncidentResource, 'notes' | 'status'>>,
  ) {
    const organisationId = getResourceOrganisationId(resource)

    if (!organisationId) {
      setResourceUpdateError('Unable to identify the assigned organisation.')
      return
    }

    setResourceUpdateError(null)
    setSavingResourceId(resource.id)

    try {
      const updatedIncident = await updateIncidentAssignedOrganisation(
        incidentId,
        organisationId,
        updates,
      )

      onResourcesChange(updatedIncident.resources ?? [])
    } catch (error) {
      setResourceUpdateError(
        error instanceof Error ? error.message : 'Unable to save resource updates.',
      )
      onResourcesChange(resources)
    } finally {
      setSavingResourceId(null)
    }
  }

  async function updateResourceStatus(resource: IncidentResource, status: IncidentResourceStatus) {
    updateResource(resource.id, { status })
    await persistResourceUpdate(resource, { status })
  }

  async function closeResourceNotes(resource: IncidentResource) {
    await persistResourceUpdate(resource, { notes: resource.notes })
    setOpenNotesResourceId(null)
  }

  async function assignOrganisation() {
    if (!selectedOrganisationId) {
      return
    }

    setAssignmentError(null)
    setIsAssigning(true)

    try {
      const updatedIncident = await assignOrganisationToIncident(
        incidentId,
        selectedOrganisationId,
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
              {resources.length} units deployed
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
                  value={selectedOrganisationId}
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
                disabled={!selectedOrganisationId || isAssigning}
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

        {resourceUpdateError && (
          <Text color="red.600" fontSize="sm" fontWeight="700">
            {resourceUpdateError}
          </Text>
        )}

        <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
          <Box as="table" width="100%" borderCollapse="collapse" tableLayout="fixed" minW="920px">
            <Box as="colgroup">
              <Box as="col" width="22%" />
              <Box as="col" width="13%" />
              <Box as="col" width="17%" />
              <Box as="col" width="20%" />
              <Box as="col" width="13%" />
              <Box as="col" width="15%" />
            </Box>

            <Box as="thead" bg="gray.50">
              <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
                <HeaderCell>Unit</HeaderCell>
                <HeaderCell>Agency</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell>Assigned</HeaderCell>
                <HeaderCell textAlign="center">Status</HeaderCell>
                <HeaderCell>Notes</HeaderCell>
              </Box>
            </Box>

            <Box as="tbody">
              {resources.map((resource) => (
                <Fragment key={resource.id}>
                  <Box
                    as="tr"
                    borderBottomWidth="1px"
                    borderColor="gray.100"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <BodyCell>
                      <Text color="gray.900" fontWeight="700">
                        {resource.unit}
                      </Text>
                    </BodyCell>

                    <BodyCell>
                      <Text color="gray.700" fontWeight="700">
                        {resource.agency}
                      </Text>
                    </BodyCell>

                    <BodyCell>
                      <Text color="gray.600">{resource.type}</Text>
                    </BodyCell>

                    <BodyCell>
                      <Text color="gray.600">{resource.assignedAt}</Text>
                    </BodyCell>

                    <BodyCell textAlign="center">
                      <Select
                        aria-label={`${resource.unit} status`}
                        onChange={(event) =>
                          updateResource(resource.id, {
                            status: event.currentTarget.value as IncidentResourceStatus,
                          })
                        }
                        value={resource.status}
                      >
                        {resourceStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </BodyCell>

                    <BodyCell>
                      <Button
                        aria-expanded={openNotesResourceId === resource.id}
                        color="gray.600"
                        fontWeight="600"
                        gap="2"
                        justifyContent="space-between"
                        maxW="100%"
                        minW="0"
                        onClick={() =>
                          setOpenNotesResourceId((currentId) =>
                            currentId === resource.id ? null : resource.id,
                          )
                        }
                        px="0"
                        variant="ghost"
                        width="100%"
                        _hover={{ bg: 'transparent', color: 'gray.900' }}
                      >
                        <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                          {resource.notes || 'Add notes'}
                        </Text>
                        <Icon as={Pencil} color="gray.500" flexShrink="0" boxSize="4" />
                      </Button>
                    </BodyCell>
                  </Box>

                  {openNotesResourceId === resource.id && (
                    <Box as="tr" borderBottomWidth="1px" borderColor="gray.100">
                      <td colSpan={6}>
                        <Box bg="gray.50" px="5" py="4">
                          <Flex justify="space-between" align="center" gap="3" mb="3">
                            <Box>
                              <Text color="gray.900" fontWeight="700">
                                Resource notes
                              </Text>
                              <Text color="gray.500" fontSize="sm">
                                {resource.unit}
                              </Text>
                            </Box>
                            <Button
                              borderColor="gray.300"
                              borderWidth="1px"
                              disabled={savingResourceId === resource.id}
                              onClick={() => setOpenNotesResourceId(null)}
                              variant="ghost"
                            >
                              Done
                            </Button>
                          </Flex>

                          <Textarea
                            aria-label={`${resource.unit} full notes`}
                            bg="white"
                            borderColor="gray.300"
                            minH="32"
                            onChange={(event) =>
                              updateResource(resource.id, { notes: event.currentTarget.value })
                            }
                            placeholder="Add notes for this resource"
                            resize="vertical"
                            value={resource.notes}
                            _focus={{ borderColor: 'purple.500', outline: 'none' }}
                          />
                        </Box>
                      </td>
                    </Box>
                  )}
                </Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      </VStack>
    </Box>
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
