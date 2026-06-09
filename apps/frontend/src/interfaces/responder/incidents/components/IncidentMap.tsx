import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Check,
  Flame,
  LifeBuoy,
  Shield,
  Siren,
  Truck,
} from 'lucide-react'
import { Box, Flex, HStack, Heading, Icon, Text, VStack } from '../../../../components/chakra-ui'
import { fetchIncidentMap } from '../api/incidentMapApi'
import type { IncidentMapDto, IncidentMapResourceDto } from '../api/incidentMapDto'
import {
  destinationOf,
  haversineMeters,
  lerp,
  movementState,
  originOf,
  progressOf,
  statusColor,
  statusLabel,
} from '../api/incidentMapUtils'
import type { LatLng } from '../api/incidentMapUtils'

const MAP_REFRESH_MS = 2500
// Fast tick so markers glide between the dense road vertices instead of hopping.
const CLOCK_TICK_MS = 200
const SINGAPORE_CENTRE = { lat: 1.3521, lng: 103.8198 }
const MAP_ID = 'DEMO_MAP_ID'

type KindMeta = { label: string; icon: ElementType }

const KIND_META: Record<string, KindMeta> = {
  fire_engine: { label: 'Fire engine', icon: Flame },
  rescue_team: { label: 'Rescue team', icon: LifeBuoy },
  ambulance: { label: 'Ambulance', icon: Ambulance },
  police: { label: 'Police', icon: Shield },
  other: { label: 'Unit', icon: Truck },
}

function kindMeta(kind: string): KindMeta {
  return KIND_META[kind] ?? KIND_META.other
}

function severityColor(severity: number): string {
  if (severity >= 4) return '#ef4444'
  if (severity >= 3) return '#f97316'
  return '#f59e0b'
}

/** A drivable route resolved from the Directions API (or a straight-line fallback). */
type RouteData = {
  path: LatLng[]
  /** Running distance to each vertex; cumulative[0] === 0, length === path.length. */
  cumulative: number[]
  totalMeters: number
}

function buildRoute(path: LatLng[]): RouteData {
  const cumulative: number[] = [0]
  for (let i = 1; i < path.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineMeters(path[i - 1], path[i]))
  }
  return {
    path,
    cumulative,
    totalMeters: cumulative[cumulative.length - 1] ?? 0,
  }
}

/** Stable identity for a route request — refetch only when the endpoints move. */
function routeKey(resource: IncidentMapResourceDto): string {
  return `${resource.id}:${resource.originLat},${resource.originLng}->${resource.destLat},${resource.destLng}`
}

/**
 * Resolves a real drivable route (origin station -> incident) for every resource
 * via the Google Directions API, once per endpoint pair. Falls back to a straight
 * two-point line if Directions is unavailable so the map always renders.
 */
function useResourceRoutes(resources: IncidentMapResourceDto[]): Map<string, RouteData> {
  const routesLib = useMapsLibrary('routes')
  const [routes, setRoutes] = useState<Map<string, RouteData>>(new Map())
  const requestedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!routesLib) return
    const service = new routesLib.DirectionsService()
    let cancelled = false

    for (const resource of resources) {
      const origin = originOf(resource)
      const destination = destinationOf(resource)
      if (!origin || !destination) continue

      const key = routeKey(resource)
      if (requestedRef.current.has(key)) continue
      requestedRef.current.add(key)

      const straightLine = buildRoute([origin, destination])

      service
        .route({
          origin,
          destination,
          travelMode: routesLib.TravelMode.DRIVING,
        })
        .then((result) => {
          if (cancelled) return
          const overview = result.routes[0]?.overview_path
          const path =
            overview && overview.length > 1
              ? overview.map((point) => ({ lat: point.lat(), lng: point.lng() }))
              : straightLine.path
          setRoutes((prev) => new Map(prev).set(resource.id, buildRoute(path)))
        })
        .catch(() => {
          if (cancelled) return
          // Directions disabled / no result / quota — degrade to a straight line.
          setRoutes((prev) => new Map(prev).set(resource.id, straightLine))
        })
    }

    return () => {
      cancelled = true
    }
  }, [routesLib, resources])

  return routes
}

/** Position along a resolved route at journey fraction t (0 = origin, 1 = incident). */
function pointAlongRoute(route: RouteData, t: number): LatLng | null {
  const { path, cumulative, totalMeters } = route
  if (path.length === 0) return null
  if (t <= 0 || totalMeters === 0) return path[0]
  if (t >= 1) return path[path.length - 1]

  const target = t * totalMeters
  let i = 0
  while (i < cumulative.length - 1 && cumulative[i + 1] < target) i += 1

  const segStart = cumulative[i]
  const segLen = cumulative[i + 1] - segStart
  const localT = segLen > 0 ? (target - segStart) / segLen : 0
  return {
    lat: lerp(path[i].lat, path[i + 1].lat, localT),
    lng: lerp(path[i].lng, path[i + 1].lng, localT),
  }
}

/** Current marker position: follows the real route when available, else a straight lerp. */
function positionOf(
  resource: IncidentMapResourceDto,
  route: RouteData | undefined,
  nowMs: number,
): LatLng | null {
  const origin = originOf(resource)
  const destination = destinationOf(resource)
  const t = progressOf(resource, nowMs)

  if (route) {
    return pointAlongRoute(route, t)
  }
  if (!destination) return origin
  if (!origin) return destination
  return {
    lat: lerp(origin.lat, destination.lat, t),
    lng: lerp(origin.lng, destination.lng, t),
  }
}

type LocalSummary = {
  total: number
  dispatched: number
  enRoute: number
  onScene: number
  returning: number
  unavailable: number
  completed: number
}

function summarise(resources: IncidentMapResourceDto[]): LocalSummary {
  const summary: LocalSummary = {
    total: resources.length,
    dispatched: 0,
    enRoute: 0,
    onScene: 0,
    returning: 0,
    unavailable: 0,
    completed: 0,
  }
  for (const resource of resources) {
    if (resource.status === 'dispatched') summary.dispatched += 1
    else if (resource.status === 'en_route') summary.enRoute += 1
    else if (resource.status === 'on_scene') summary.onScene += 1
    else if (resource.status === 'returning') summary.returning += 1
    else if (resource.status === 'unavailable') summary.unavailable += 1
    else if (resource.status === 'completed') summary.completed += 1
  }
  return summary
}

type IncidentMapProps = {
  incidentId: string
}

export function IncidentMap({ incidentId }: IncidentMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const [snapshot, setSnapshot] = useState<IncidentMapDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disabledKinds, setDisabledKinds] = useState<Set<string>>(new Set())
  const [disabledStatuses, setDisabledStatuses] = useState<Set<string>>(new Set())

  // Poll the map snapshot. First load shows the loading state; refreshes are silent.
  useEffect(() => {
    let isMounted = true

    async function load(showLoading: boolean) {
      if (showLoading) {
        setIsLoading(true)
        setSnapshot(null)
      }
      try {
        const data = await fetchIncidentMap(incidentId)
        if (!isMounted) return
        setSnapshot(data)
        setError(null)
      } catch {
        if (isMounted) setError('Unable to load incident map.')
      } finally {
        if (showLoading && isMounted) setIsLoading(false)
      }
    }

    void load(true)
    const refreshId = window.setInterval(() => void load(false), MAP_REFRESH_MS)
    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [incidentId])

  const resources = useMemo(() => snapshot?.resources ?? [], [snapshot])

  const availableKinds = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.resourceKind))),
    [resources],
  )
  const availableStatuses = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.status))),
    [resources],
  )

  const visibleResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          !disabledKinds.has(resource.resourceKind) &&
          !disabledStatuses.has(resource.status),
      ),
    [resources, disabledKinds, disabledStatuses],
  )

  const summary = useMemo(() => summarise(visibleResources), [visibleResources])

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  if (!apiKey) {
    return (
      <MapNotice
        tone="warning"
        title="Map unavailable"
        body="Set VITE_GOOGLE_MAPS_API_KEY in apps/frontend/.env to enable the operational map."
      />
    )
  }

  if (isLoading) {
    return (
      <MapNotice tone="muted" title="Loading operational map…" body="Fetching incident location and assigned resources." />
    )
  }

  if (error) {
    return <MapNotice tone="error" title="Map error" body={error} />
  }

  const incident = snapshot?.incident
  const incidentPosition =
    incident?.lat != null && incident?.lng != null
      ? { lat: incident.lat, lng: incident.lng }
      : null

  return (
    <Flex flex="1" minH="0" direction={{ base: 'column', lg: 'row' }}>
      <Box
        width={{ base: '100%', lg: '340px' }}
        flexShrink="0"
        borderRightWidth={{ lg: '1px' }}
        borderBottomWidth={{ base: '1px', lg: '0' }}
        borderColor="gray.200"
        bg="white"
        overflowY="auto"
        maxH={{ base: '40%', lg: 'none' }}
      >
        <SummaryPanel summary={summary} />
        <FilterPanel
          availableKinds={availableKinds}
          availableStatuses={availableStatuses}
          disabledKinds={disabledKinds}
          disabledStatuses={disabledStatuses}
          onToggleKind={(kind) => setDisabledKinds((prev) => toggle(prev, kind))}
          onToggleStatus={(status) => setDisabledStatuses((prev) => toggle(prev, status))}
        />
        <ResourceList resources={visibleResources} />
      </Box>

      <Box flex="1" position="relative" minH={{ base: '360px', lg: 'auto' }}>
        {!incidentPosition && (
          <Box
            position="absolute"
            top="3"
            left="3"
            right="3"
            zIndex="1"
            bg="orange.50"
            borderWidth="1px"
            borderColor="orange.200"
            color="orange.800"
            px="3"
            py="2"
            fontSize="sm"
            fontWeight="600"
          >
            Incident location coordinates unavailable — showing region overview.
          </Box>
        )}

        <APIProvider apiKey={apiKey}>
          <GoogleMap
            mapId={MAP_ID}
            colorScheme="DARK"
            defaultCenter={incidentPosition ?? SINGAPORE_CENTRE}
            defaultZoom={incidentPosition ? 14 : 11}
            gestureHandling="greedy"
            disableDefaultUI
            style={{ width: '100%', height: '100%' }}
          >
            <MapScene
              incidentId={incidentId}
              incident={incident}
              incidentPosition={incidentPosition}
              resources={resources}
              visibleResources={visibleResources}
            />
          </GoogleMap>
        </APIProvider>
      </Box>
    </Flex>
  )
}

/** Everything that lives inside the map: routes, markers, animation clock, auto-fit. */
function MapScene({
  incidentId,
  incident,
  incidentPosition,
  resources,
  visibleResources,
}: {
  incidentId: string
  incident: IncidentMapDto['incident'] | undefined
  incidentPosition: LatLng | null
  resources: IncidentMapResourceDto[]
  visibleResources: IncidentMapResourceDto[]
}) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const routes = useResourceRoutes(resources)

  // Drive interpolated movement with a steady clock tick.
  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS)
    return () => window.clearInterval(tickId)
  }, [])

  return (
    <>
      <MapAutoFit incidentId={incidentId} incident={incidentPosition} routes={routes} resources={resources} />

      {incidentPosition && incident && (
        <AdvancedMarker position={incidentPosition} zIndex={50} title={incident.title}>
          <IncidentPin severity={incident.severity} />
        </AdvancedMarker>
      )}

      {visibleResources.map((resource) => {
        const route = routes.get(resource.id)
        if (!route || route.path.length < 2) return null
        return (
          <RoutePolyline
            key={`route-${resource.id}`}
            path={route.path}
            color={statusColor(resource.status)}
          />
        )
      })}

      {visibleResources.map((resource) => {
        const position = positionOf(resource, routes.get(resource.id), nowMs)
        if (!position) return null
        const arrived = movementState(resource.status, progressOf(resource, nowMs)) === 'arrived'
        return (
          <AdvancedMarker
            key={resource.id}
            position={position}
            zIndex={arrived ? 30 : 20}
            title={`${resource.unitRef} · ${statusLabel(resource.status)}`}
          >
            <ResourcePin resource={resource} arrived={arrived} />
          </AdvancedMarker>
        )
      })}
    </>
  )
}

/** Fits the viewport to the incident and all route paths once per incident. */
function MapAutoFit({
  incidentId,
  incident,
  routes,
  resources,
}: {
  incidentId: string
  incident: LatLng | null
  routes: Map<string, RouteData>
  resources: IncidentMapResourceDto[]
}) {
  const map = useMap()
  const mapsLib = useMapsLibrary('core')
  const fittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!map || !mapsLib || !incident) return
    if (fittedRef.current === incidentId) return

    const bounds = new mapsLib.LatLngBounds()
    bounds.extend(incident)
    for (const resource of resources) {
      const origin = originOf(resource)
      if (origin) bounds.extend(origin)
    }
    for (const route of routes.values()) {
      for (const point of route.path) bounds.extend(point)
    }

    map.fitBounds(bounds, 80)
    // Only lock the fit once routes have started resolving, so the curved paths fit.
    if (routes.size > 0) fittedRef.current = incidentId
  }, [map, mapsLib, incident, routes, resources, incidentId])

  return null
}

/** Imperative polyline tracing a unit's drivable route to the incident. */
type PolylineLike = {
  setMap(map: unknown): void
  setPath(path: LatLng[]): void
}

function RoutePolyline({ path, color }: { path: LatLng[]; color: string }) {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')
  const lineRef = useRef<PolylineLike | null>(null)

  useEffect(() => {
    if (!map || !mapsLib) return
    const line = new mapsLib.Polyline({
      geodesic: false,
      strokeColor: color,
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map,
    })
    lineRef.current = line as unknown as PolylineLike
    return () => {
      line.setMap(null)
      lineRef.current = null
    }
  }, [map, mapsLib, color])

  useEffect(() => {
    lineRef.current?.setPath(path)
  }, [path])

  return null
}

function IncidentPin({ severity }: { severity: number }) {
  const color = severityColor(severity)
  return (
    <Box
      bg={color}
      color="white"
      borderRadius="full"
      borderWidth="3px"
      borderColor="white"
      boxShadow="0 0 0 4px rgba(239,68,68,0.35)"
      width="40px"
      height="40px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Icon as={Siren} boxSize="5" />
    </Box>
  )
}

function ResourcePin({ resource, arrived }: { resource: IncidentMapResourceDto; arrived: boolean }) {
  const meta = kindMeta(resource.resourceKind)
  const arrivedColor = '#22c55e'
  const color = arrived ? arrivedColor : statusColor(resource.status)
  return (
    <Box position="relative">
      <Box
        bg="gray.900"
        color="white"
        borderRadius="full"
        borderWidth="2px"
        borderColor={color}
        width="30px"
        height="30px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow={`0 0 0 3px ${color}55`}
      >
        <Icon as={meta.icon} boxSize="4" />
      </Box>
      {arrived && (
        <Box
          position="absolute"
          top="-5px"
          right="-5px"
          bg={arrivedColor}
          color="white"
          borderRadius="full"
          borderWidth="2px"
          borderColor="white"
          width="16px"
          height="16px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={Check} boxSize="2.5" />
        </Box>
      )}
    </Box>
  )
}

const SUMMARY_ITEMS: Array<{ key: keyof LocalSummary; label: string; color: string }> = [
  { key: 'total', label: 'Total', color: 'gray.700' },
  { key: 'dispatched', label: 'Dispatched', color: '#3b82f6' },
  { key: 'enRoute', label: 'En route', color: '#f59e0b' },
  { key: 'onScene', label: 'On scene', color: '#22c55e' },
  { key: 'returning', label: 'Returning', color: '#a855f7' },
  { key: 'completed', label: 'Completed', color: '#14b8a6' },
  { key: 'unavailable', label: 'Unavailable', color: '#9ca3af' },
]

function SummaryPanel({ summary }: { summary: LocalSummary }) {
  return (
    <Box p="4" borderBottomWidth="1px" borderColor="gray.100">
      <HStack gap="2" mb="3">
        <Icon as={Activity} color="purple.600" />
        <Heading size="sm" color="gray.900">
          Operational status
        </Heading>
      </HStack>
      <Flex wrap="wrap" gap="2">
        {SUMMARY_ITEMS.map((item) => (
          <Box
            key={item.key}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="sm"
            px="3"
            py="2"
            minW="84px"
            flex="1"
          >
            <Text fontSize="xl" fontWeight="700" color={item.color}>
              {summary[item.key]}
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">
              {item.label}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}

function FilterPanel({
  availableKinds,
  availableStatuses,
  disabledKinds,
  disabledStatuses,
  onToggleKind,
  onToggleStatus,
}: {
  availableKinds: string[]
  availableStatuses: string[]
  disabledKinds: Set<string>
  disabledStatuses: Set<string>
  onToggleKind: (kind: string) => void
  onToggleStatus: (status: string) => void
}) {
  if (availableKinds.length === 0 && availableStatuses.length === 0) {
    return null
  }

  return (
    <Box p="4" borderBottomWidth="1px" borderColor="gray.100">
      <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase" mb="2">
        Filter by type
      </Text>
      <Flex wrap="wrap" gap="2" mb="4">
        {availableKinds.map((kind) => (
          <FilterChip
            key={kind}
            label={kindMeta(kind).label}
            icon={kindMeta(kind).icon}
            active={!disabledKinds.has(kind)}
            onClick={() => onToggleKind(kind)}
          />
        ))}
      </Flex>

      <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase" mb="2">
        Filter by status
      </Text>
      <Flex wrap="wrap" gap="2">
        {availableStatuses.map((status) => (
          <FilterChip
            key={status}
            label={statusLabel(status)}
            dotColor={statusColor(status)}
            active={!disabledStatuses.has(status)}
            onClick={() => onToggleStatus(status)}
          />
        ))}
      </Flex>
    </Box>
  )
}

function FilterChip({
  label,
  icon,
  dotColor,
  active,
  onClick,
}: {
  label: string
  icon?: ElementType
  dotColor?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      aria-pressed={active}
      display="inline-flex"
      alignItems="center"
      gap="2"
      borderWidth="1px"
      borderRadius="full"
      px="3"
      py="1"
      fontSize="sm"
      fontWeight="600"
      cursor="pointer"
      bg={active ? 'purple.50' : 'white'}
      borderColor={active ? 'purple.300' : 'gray.200'}
      color={active ? 'purple.700' : 'gray.400'}
      _hover={{ borderColor: active ? 'purple.400' : 'gray.300' }}
    >
      {icon && <Icon as={icon} boxSize="3.5" />}
      {dotColor && (
        <Box width="8px" height="8px" borderRadius="full" bg={active ? dotColor : 'gray.300'} />
      )}
      {label}
    </Box>
  )
}

function ResourceList({ resources }: { resources: IncidentMapResourceDto[] }) {
  return (
    <Box p="4">
      <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase" mb="2">
        Assigned units ({resources.length})
      </Text>
      {resources.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          No resources assigned yet.
        </Text>
      ) : (
        <VStack align="stretch" gap="2">
          {resources.map((resource) => (
            <Box
              key={resource.id}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="sm"
              px="3"
              py="2"
            >
              <Flex justify="space-between" align="center" gap="2">
                <HStack gap="2" minW="0">
                  <Icon as={kindMeta(resource.resourceKind).icon} color="gray.600" boxSize="4" />
                  <Text fontWeight="700" color="gray.900" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {resource.unitRef}
                  </Text>
                </HStack>
                <HStack gap="1" flexShrink="0">
                  <Box width="8px" height="8px" borderRadius="full" bg={statusColor(resource.status)} />
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    {statusLabel(resource.status)}
                  </Text>
                </HStack>
              </Flex>
              <Flex justify="space-between" mt="1">
                <Text fontSize="xs" color="gray.500">
                  {resource.agency}
                  {resource.originStation ? ` · ${resource.originStation}` : ''}
                </Text>
                {resource.etaMinutes != null && resource.status !== 'on_scene' && resource.status !== 'completed' && (
                  <Text fontSize="xs" color="gray.500">
                    ETA {resource.etaMinutes} min
                  </Text>
                )}
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  )
}

function MapNotice({
  tone,
  title,
  body,
}: {
  tone: 'muted' | 'warning' | 'error'
  title: string
  body: string
}) {
  const palette = {
    muted: { bg: 'gray.50', border: 'gray.200', color: 'gray.700', icon: Activity },
    warning: { bg: 'orange.50', border: 'orange.200', color: 'orange.800', icon: AlertTriangle },
    error: { bg: 'red.50', border: 'red.200', color: 'red.700', icon: AlertTriangle },
  }[tone]

  return (
    <Flex flex="1" minH="0" align="center" justify="center" p="8">
      <Box
        bg={palette.bg}
        borderWidth="1px"
        borderColor={palette.border}
        color={palette.color}
        borderRadius="md"
        px="6"
        py="5"
        maxW="420px"
        textAlign="center"
      >
        <Icon as={palette.icon} boxSize="6" />
        <Heading size="sm" mt="2">
          {title}
        </Heading>
        <Text fontSize="sm" mt="1">
          {body}
        </Text>
      </Box>
    </Flex>
  )
}
