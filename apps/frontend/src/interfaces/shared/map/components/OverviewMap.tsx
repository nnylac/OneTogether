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
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
} from '../../../../components/chakra-ui'
import { LabelBox } from '../../../../components/ui/LabelBox'
import { resolveIncidentCoordinates } from '../geocode'
import type { CoordinateSource } from '../geocode'
import type { OverviewIncident } from '../types/overviewIncident'
import {
  MAP_ID,
  SINGAPORE_CENTRE,
  severityColor,
  severityTone,
  statusTone,
  typeLabel,
  typeMeta,
} from '../mapShared'

type PlacedIncident = {
  incident: OverviewIncident
  lat: number
  lng: number
  source: CoordinateSource
}

type OverviewMapProps = {
  detailLink?: (incident: OverviewIncident) => string | null
  detailLinkLabel?: string
  incidents: OverviewIncident[]
  onSelect: (id: string | null) => void
  selectedId: string | null
}

const SEVERITY_LEGEND: Array<{ label: string; color: string }> = [
  { label: 'Critical', color: '#ef4444' },
  { label: 'High', color: '#f97316' },
  { label: 'Medium', color: '#f59e0b' },
  { label: 'Low', color: '#3b82f6' },
]

export function OverviewMap({
  detailLink,
  detailLinkLabel = 'Open incident',
  incidents,
  onSelect,
  selectedId,
}: OverviewMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const placed = useMemo<PlacedIncident[]>(
    () =>
      incidents.map((incident) => ({
        incident,
        ...resolveIncidentCoordinates(incident),
      })),
    [incidents],
  )
  const selected = useMemo(
    () => placed.find((entry) => entry.incident.id === selectedId) ?? null,
    [placed, selectedId],
  )
  const approximateCount = useMemo(
    () => placed.filter((entry) => entry.source === 'approximate').length,
    [placed],
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
          <MapAutoFit placed={placed} />
          <MapPanTo selected={selected} />

          {placed.map((entry) => (
            <AdvancedMarker
              key={entry.incident.id}
              position={{ lat: entry.lat, lng: entry.lng }}
              zIndex={
                entry.incident.id === selectedId ? 60 : entry.incident.isCritical ? 40 : 20
              }
              title={`${entry.incident.title} - ${entry.incident.location}`}
              onClick={() => onSelect(entry.incident.id)}
            >
              <IncidentPin
                incident={entry.incident}
                source={entry.source}
                selected={entry.incident.id === selectedId}
              />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              pixelOffset={[0, -42]}
              onCloseClick={() => onSelect(null)}
            >
              <IncidentCallout
                detailLink={detailLink}
                detailLinkLabel={detailLinkLabel}
                incident={selected.incident}
                source={selected.source}
              />
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>

      <MapLegend plotted={placed.length} approximate={approximateCount} />
    </Box>
  )
}

function MapAutoFit({ placed }: { placed: PlacedIncident[] }) {
  const map = useMap()
  const coreLib = useMapsLibrary('core')
  const fittedRef = useRef<string>('')
  const fingerprint = placed
    .map((entry) => entry.incident.id)
    .sort()
    .join('|')

  useEffect(() => {
    if (!map || !coreLib || placed.length === 0) return
    if (fittedRef.current === fingerprint) return
    fittedRef.current = fingerprint

    if (placed.length === 1) {
      map.setCenter({ lat: placed[0].lat, lng: placed[0].lng })
      map.setZoom(14)
      return
    }

    const bounds = new coreLib.LatLngBounds()
    for (const entry of placed) {
      bounds.extend({ lat: entry.lat, lng: entry.lng })
    }
    map.fitBounds(bounds, 64)
  }, [map, coreLib, placed, fingerprint])

  return null
}

function MapPanTo({ selected }: { selected: PlacedIncident | null }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !selected) return
    map.panTo({ lat: selected.lat, lng: selected.lng })
  }, [map, selected])

  return null
}

function IncidentPin({
  incident,
  selected,
  source,
}: {
  incident: OverviewIncident
  selected: boolean
  source: CoordinateSource
}) {
  const color = severityColor(incident.severity)
  const { icon } = typeMeta(incident.incidentType)
  const size = selected ? '40px' : '32px'
  const isApproximate = source === 'approximate'

  return (
    <Box
      bg={color}
      color="white"
      borderRadius="full"
      borderWidth="3px"
      borderColor="white"
      borderStyle={isApproximate ? 'dashed' : 'solid'}
      boxShadow={
        selected
          ? `0 0 0 5px ${color}66`
          : incident.isCritical
            ? `0 0 0 4px ${color}40`
            : '0 1px 4px rgba(0,0,0,0.45)'
      }
      opacity={isApproximate ? 0.9 : 1}
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

function IncidentCallout({
  detailLink,
  detailLinkLabel,
  incident,
  source,
}: {
  detailLink?: (incident: OverviewIncident) => string | null
  detailLinkLabel: string
  incident: OverviewIncident
  source: CoordinateSource
}) {
  const href = detailLink?.(incident) ?? null

  return (
    <Box minW="220px" maxW="280px" p="1">
      <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.04em">
        {incident.incidentCode ?? typeLabel(incident.incidentType)}
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

      {source === 'approximate' && (
        <Text fontSize="2xs" color="orange.500" mt="1.5" fontWeight="600">
          Approximate location - no precise coordinates
        </Text>
      )}

      {incident.assignedOrgs && incident.assignedOrgs.length > 0 && (
        <Text fontSize="xs" color="gray.500" mt="2">
          Agencies: {incident.assignedOrgs.join(', ')}
        </Text>
      )}
      <Text fontSize="xs" color="gray.400" mt="1">
        {incident.date}
      </Text>

      {href && (
        <Link
          to={href}
          style={{ color: '#6d28d9', fontWeight: 700, fontSize: '0.8rem', display: 'inline-block', marginTop: '8px' }}
        >
          {detailLinkLabel} -&gt;
        </Link>
      )}
    </Box>
  )
}

function MapLegend({ plotted, approximate }: { plotted: number; approximate: number }) {
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
        {plotted} plotted
        {approximate > 0 ? ` / ${approximate} approximate` : ''}
      </Text>
    </Box>
  )
}
