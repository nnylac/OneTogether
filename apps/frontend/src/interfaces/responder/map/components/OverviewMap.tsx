import { useEffect, useMemo, useRef } from 'react'
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { Link } from 'react-router-dom'
import { Box, Flex, HStack, Icon, Stack, Text, VStack } from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import type { Incident } from '../../incidents/types'
import {
  MAP_ID,
  SINGAPORE_CENTRE,
  severityColor,
  severityTone,
  statusTone,
  typeMeta,
} from '../mapShared'

type PlottedIncident = Incident & { lat: number; lng: number }

type OverviewMapProps = {
  incidents: Incident[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function hasCoordinates(incident: Incident): incident is PlottedIncident {
  return typeof incident.lat === 'number' && typeof incident.lng === 'number'
}

const SEVERITY_LEGEND: Array<{ label: string; color: string }> = [
  { label: 'Critical', color: '#ef4444' },
  { label: 'High', color: '#f97316' },
  { label: 'Medium', color: '#f59e0b' },
  { label: 'Low', color: '#3b82f6' },
]

export function OverviewMap({ incidents, selectedId, onSelect }: OverviewMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const plotted = useMemo(() => incidents.filter(hasCoordinates), [incidents])
  const selected = useMemo(
    () => plotted.find((incident) => incident.id === selectedId) ?? null,
    [plotted, selectedId],
  )

  if (!apiKey) {
    return (
      <Box
        height="100%"
        minH="420px"
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p="6"
      >
        <VStack gap="1" textAlign="center">
          <Text color="gray.800" fontWeight="700">
            Map unavailable
          </Text>
          <Text color="gray.500" fontSize="sm">
            Set VITE_GOOGLE_MAPS_API_KEY in apps/frontend/.env to enable the operational map.
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box position="relative" height="100%" minH="420px">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          mapId={MAP_ID}
          colorScheme="DARK"
          defaultCenter={SINGAPORE_CENTRE}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI
          style={{ width: '100%', height: '100%' }}
        >
          <MapAutoFit incidents={plotted} />
          <MapPanTo selected={selected} />

          {plotted.map((incident) => (
            <AdvancedMarker
              key={incident.id}
              position={{ lat: incident.lat, lng: incident.lng }}
              zIndex={incident.id === selectedId ? 60 : incident.isCritical ? 40 : 20}
              title={`${incident.title} · ${incident.location}`}
              onClick={() => onSelect(incident.id)}
            >
              <IncidentPin incident={incident} selected={incident.id === selectedId} />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              pixelOffset={[0, -42]}
              onCloseClick={() => onSelect(null)}
            >
              <IncidentCallout incident={selected} />
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>

      <MapLegend plotted={plotted.length} total={incidents.length} />
    </Box>
  )
}

/** Fits the viewport to every plotted incident; refits only when the marker set changes. */
function MapAutoFit({ incidents }: { incidents: PlottedIncident[] }) {
  const map = useMap()
  const coreLib = useMapsLibrary('core')
  const fittedRef = useRef<string>('')
  const fingerprint = incidents
    .map((incident) => incident.id)
    .sort()
    .join('|')

  useEffect(() => {
    if (!map || !coreLib || incidents.length === 0) return
    if (fittedRef.current === fingerprint) return
    fittedRef.current = fingerprint

    if (incidents.length === 1) {
      map.setCenter({ lat: incidents[0].lat, lng: incidents[0].lng })
      map.setZoom(14)
      return
    }

    const bounds = new coreLib.LatLngBounds()
    for (const incident of incidents) {
      bounds.extend({ lat: incident.lat, lng: incident.lng })
    }
    map.fitBounds(bounds, 64)
  }, [map, coreLib, incidents, fingerprint])

  return null
}

/** Gently recentres on the selected incident without changing zoom. */
function MapPanTo({ selected }: { selected: PlottedIncident | null }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !selected) return
    map.panTo({ lat: selected.lat, lng: selected.lng })
  }, [map, selected])

  return null
}

function IncidentPin({ incident, selected }: { incident: PlottedIncident; selected: boolean }) {
  const color = severityColor(incident.severity)
  const { icon } = typeMeta(incident.incidentType)
  const size = selected ? '40px' : '32px'

  return (
    <Box
      bg={color}
      color="white"
      borderRadius="full"
      borderWidth="3px"
      borderColor="white"
      boxShadow={
        selected
          ? `0 0 0 5px ${color}66`
          : incident.isCritical
            ? `0 0 0 4px ${color}40`
            : '0 1px 4px rgba(0,0,0,0.45)'
      }
      width={size}
      height={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      transition="all 0.12s ease"
    >
      <Icon as={icon} boxSize={selected ? '5' : '4'} />
    </Box>
  )
}

function IncidentCallout({ incident }: { incident: PlottedIncident }) {
  return (
    <Box minW="220px" maxW="280px" p="1">
      <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.04em">
        {incident.incidentCode ?? incident.incidentType ?? 'Incident'}
      </Text>
      <Text fontSize="md" fontWeight="700" color="gray.900" mt="0.5">
        {incident.title}
      </Text>
      <Text fontSize="sm" color="gray.600" mt="0.5">
        {incident.location}
      </Text>

      <HStack gap="1.5" mt="2" wrap="wrap">
        {incident.severity && (
          <LabelBox tone={severityTone[incident.severity]}>{incident.severity}</LabelBox>
        )}
        <LabelBox tone={statusTone[incident.status]}>
          {incident.status.replace(/_/g, ' ')}
        </LabelBox>
      </HStack>

      {incident.assignedOrgs && incident.assignedOrgs.length > 0 && (
        <Text fontSize="xs" color="gray.500" mt="2">
          Agencies: {incident.assignedOrgs.join(', ')}
        </Text>
      )}
      <Text fontSize="xs" color="gray.400" mt="1">
        {incident.date}
      </Text>

      <Link
        to={`/responder/incidents/${incident.id}/room`}
        style={{ color: '#6d28d9', fontWeight: 700, fontSize: '0.8rem', display: 'inline-block', marginTop: '8px' }}
      >
        Open incident room →
      </Link>
    </Box>
  )
}

function MapLegend({ plotted, total }: { plotted: number; total: number }) {
  return (
    <Box
      position="absolute"
      bottom="3"
      left="3"
      bg="rgba(17,24,39,0.82)"
      color="white"
      borderRadius="md"
      px="3"
      py="2.5"
      backdropFilter="blur(4px)"
    >
      <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="gray.300">
        Severity
      </Text>
      <Stack gap="1" mt="1.5">
        {SEVERITY_LEGEND.map((entry) => (
          <Flex key={entry.label} align="center" gap="2">
            <Box width="10px" height="10px" borderRadius="full" bg={entry.color} />
            <Text fontSize="xs" color="gray.100">
              {entry.label}
            </Text>
          </Flex>
        ))}
      </Stack>
      <Text fontSize="2xs" color="gray.400" mt="2">
        {plotted} of {total} plotted
      </Text>
    </Box>
  )
}
