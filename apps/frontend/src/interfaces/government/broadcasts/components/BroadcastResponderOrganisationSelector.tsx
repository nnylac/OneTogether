import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, HStack, Stack, Text } from '../../../../components/chakra-ui'
import { fetchOrganisations } from '../../../responder/incidents/api/incidentsApi'
import type { OrganisationApiDto } from '../../../responder/incidents/api/incidentsDto'

type BroadcastResponderOrganisationSelectorProps = {
  selectedOrganisationIds: string[]
  onSelectOrganisations: (organisations: OrganisationApiDto[]) => void
}

function isSelectableOrganisation(organisation: OrganisationApiDto) {
  return organisation.orgName.trim().toLowerCase() !== 'scenario engine'
}

export function BroadcastResponderOrganisationSelector({
  selectedOrganisationIds,
  onSelectOrganisations,
}: BroadcastResponderOrganisationSelectorProps) {
  const [organisations, setOrganisations] = useState<OrganisationApiDto[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasDefaultedToAll = useRef(false)

  const selectedIdSet = useMemo(
    () => new Set(selectedOrganisationIds),
    [selectedOrganisationIds],
  )
  const isAllSelected =
    organisations.length > 0 &&
    organisations.every((organisation) => selectedIdSet.has(organisation.id))

  useEffect(() => {
    let isMounted = true

    fetchOrganisations()
      .then((loadedOrganisations) => {
        if (!isMounted) {
          return
        }

        const selectableOrganisations = loadedOrganisations.filter(
          isSelectableOrganisation,
        )
        setOrganisations(selectableOrganisations)
        setErrorMessage(null)

        if (!hasDefaultedToAll.current) {
          hasDefaultedToAll.current = true
          onSelectOrganisations(selectableOrganisations)
        }
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load responder organisations.')
      })

    return () => {
      isMounted = false
    }
  }, [onSelectOrganisations])

  function handleToggleAll() {
    onSelectOrganisations(isAllSelected ? [] : organisations)
  }

  function handleToggleOrganisation(organisation: OrganisationApiDto) {
    const nextSelectedIds = new Set(selectedOrganisationIds)

    if (nextSelectedIds.has(organisation.id)) {
      nextSelectedIds.delete(organisation.id)
    } else {
      nextSelectedIds.add(organisation.id)
    }

    onSelectOrganisations(
      organisations.filter((currentOrganisation) =>
        nextSelectedIds.has(currentOrganisation.id),
      ),
    )
  }

  return (
    <Stack gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="800">
        Responder Organisations
      </Text>

      <HStack gap="3" wrap="wrap">
        <Button
          size="sm"
          borderRadius="full"
          variant="outline"
          bg={isAllSelected ? 'blue.900' : 'white'}
          color={isAllSelected ? 'white' : 'gray.600'}
          borderColor={isAllSelected ? 'blue.900' : 'gray.200'}
          px="5"
          minH="10"
          onClick={handleToggleAll}
          _hover={{
            bg: isAllSelected ? 'blue.900' : 'gray.50',
            borderColor: isAllSelected ? 'blue.900' : 'gray.300',
          }}
        >
          All
        </Button>

        {organisations.map((organisation) => {
          const isActive = selectedIdSet.has(organisation.id)

          return (
            <Button
              key={organisation.id}
              size="sm"
              borderRadius="full"
              variant="outline"
              bg={isActive ? 'blue.900' : 'white'}
              color={isActive ? 'white' : 'gray.600'}
              borderColor={isActive ? 'blue.900' : 'gray.200'}
              px="5"
              minH="10"
              onClick={() => handleToggleOrganisation(organisation)}
              _hover={{
                bg: isActive ? 'blue.900' : 'gray.50',
                borderColor: isActive ? 'blue.900' : 'gray.300',
              }}
            >
              {organisation.orgName}
            </Button>
          )
        })}
      </HStack>

      {errorMessage && (
        <Text color="red.600" fontSize="sm">
          {errorMessage}
        </Text>
      )}
    </Stack>
  )
}
