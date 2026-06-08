import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { Activity, AlertTriangle, Siren } from 'lucide-react'
import { Box, Flex, HStack, Heading, Icon, Text, VStack } from '../../../../components/chakra-ui'
import { fetchIncidentMap } from '../api/incidentMapApi'
import type { IncidentMapDto, IncidentMapResourceDto } from '../api/incidentMapDto'
import {
  ARRIVED_STATUSES,
  MOVING_STATUSES,
  agencyColor,
  clamp01,
  destinationOf,
  kindMeta,
  liveEtaMinutes,
  originOf,
  progressOf,
  remainingKm,
  statusColor,
  statusLabel,
} from '../utils/incidentMapResource'
import type { LatLng } from '../utils/incidentMapResource'

const MAP_REFRESH_MS = 2500
const CLOCK_TICK_MS = 1000
const SINGAPORE_CENTRE = { lat: 1.3521, lng: 103.8198 }
const MAP_ID = 'DEMO_MAP_ID'

function severityColor(severity: number): string {
  if (severity >= 4) return '#ef4444'
  if (severity >= 3) return '#f97316'
  return '#f59e0b'
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/** Interpolated current position of a unit along its origin -> incident path. */
function positionOf(resource: IncidentMapResourceDto, nowMs: number): LatLng | null {
  const origin = originOf(resource)
  const destination = destinationOf(resource)
  if (!destination) {
    return origin
  }
  if (!origin) {
    return destination
  }
  const t = progressOf(resource, nowMs)
  return {
    lat: lerp(origin.lat, destination.lat, t),
    lng: lerp(origin.lng, destination.lng, t),
  }
}

/** Planar distance between two points — accurate enough to parameterise a short city route. */
function planarDist(a: LatLng, b: LatLng): number {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng)
}

/** Point a fraction `t` (0..1) of the way along a polyline, measured by cumulative length. */
function pointAlongPath(path: LatLng[], t: number): LatLng {
  if (path.length === 0) return SINGAPORE_CENTRE
  if (path.length === 1) return path[0]

  const segLens: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    const len = planarDist(path[i - 1], path[i])
    segLens.push(len)
    total += len
  }
  if (total === 0) return path[0]

  let target = clamp01(t) * total
  for (let i = 0; i < segLens.length; i += 1) {
    if (target <= segLens[i]) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i]
      return {
        lat: lerp(path[i].lat, path[i + 1].lat, f),
        lng: lerp(path[i].lng, path[i + 1].lng, f),
      }
    }
    target -= segLens[i]
  }
  return path[path.length - 1]
}

/** Position of a unit, following its real road route when one has been resolved. */
function positionAlong(
  resource: IncidentMapResourceDto,
  nowMs: number,
  routePath: LatLng[] | undefined,
): LatLng | null {
  if (routePath && routePath.length >= 2 && MOVING_STATUSES.has(resource.status)) {
    return pointAlongPath(routePath, progressOf(resource, nowMs))
  }
  if (routePath && routePath.length >= 2 && resource.status !== 'unavailable') {
    // on_scene / completed / returning snap to the incident end of the route.
    return pointAlongPath(routePath, progressOf(resource, nowMs))
  }
  return positionOf(resource, nowMs)
}

/** Stable cache key for an origin -> incident pair (units from one station share a route). */
function routeKey(origin: LatLng, dest: LatLng): string {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${dest.lat.toFixed(5)},${dest.lng.toFixed(5)}`
}

// Minimal structural shapes for the Directions API (avoids depending on the `google` namespace).
type DirectionsPoint = { lat(): number; lng(): number }
type DirectionsResultLike = { routes?: Array<{ overview_path?: DirectionsPoint[] }> }
type DirectionsServiceLike = {
  route(
    request: { origin: LatLng; destination: LatLng; travelMode: string },
    callback: (result: DirectionsResultLike | null, status: string) => void,
  ): void
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
  const [nowMs, setNowMs] = useState(() => Date.now())
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

  // Drive interpolated movement with a steady clock tick.
  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS)
    return () => window.clearInterval(tickId)
  }, [])

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
        <ResourceList resources={visibleResources} nowMs={nowMs} />
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
            <MapAutoFit incidentId={incidentId} incident={incidentPosition} resources={resources} />

            {incidentPosition && incident && (
              <AdvancedMarker position={incidentPosition} zIndex={50} title={incident.title}>
                <IncidentPin severity={incident.severity} />
              </AdvancedMarker>
            )}

            <MapLayers resources={visibleResources} incident={incidentPosition} nowMs={nowMs} />
          </GoogleMap>
        </APIProvider>
      </Box>
    </Flex>
  )
}

/**
 * Routes, animated unit markers, and the click-to-inspect popup. Lives inside the
 * map (under APIProvider) so it can use the Directions library.
 */
function MapLayers({
  resources,
  incident,
  nowMs,
}: {
  resources: IncidentMapResourceDto[]
  incident: LatLng | null
  nowMs: number
}) {
  const routesLib = useMapsLibrary('routes')
  const [routesByKey, setRoutesByKey] = useState<Record<string, LatLng[]>>({})
  const requestedRef = useRef<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Resolve a real road route per origin -> incident pair, once each, with a straight-line fallback.
  useEffect(() => {
    if (!routesLib || !incident) return
    const service = new routesLib.DirectionsService() as unknown as DirectionsServiceLike

    for (const resource of resources) {
      const origin = originOf(resource)
      if (!origin) continue
      const key = routeKey(origin, incident)
      if (requestedRef.current.has(key)) continue
      requestedRef.current.add(key)

      service.route(
        { origin, destination: incident, travelMode: 'DRIVING' },
        (result, status) => {
          const overview = result?.routes?.[0]?.overview_path
          const path: LatLng[] =
            status === 'OK' && overview && overview.length >= 2
              ? overview.map((point) => ({ lat: point.lat(), lng: point.lng() }))
              : [origin, incident]
          setRoutesByKey((prev) => ({ ...prev, [key]: path }))
        },
      )
    }
  }, [routesLib, resources, incident])

  function pathFor(resource: IncidentMapResourceDto): LatLng[] | undefined {
    const origin = originOf(resource)
    if (!origin || !incident) return undefined
    return routesByKey[routeKey(origin, incident)]
  }

  const selected = resources.find((resource) => resource.id === selectedId) ?? null
  const selectedPosition = selected ? positionAlong(selected, nowMs, pathFor(selected)) : null

  return (
    <>
      {incident &&
        resources.map((resource) => {
          const path = pathFor(resource)
          const origin = originOf(resource)
          if (!path && !origin) return null
          return (
            <RoutePolyline
              key={`route-${resource.id}`}
              path={path ?? [origin as LatLng, incident]}
              color={statusColor(resource.status)}
            />
          )
        })}

      {resources.map((resource) => {
        const position = positionAlong(resource, nowMs, pathFor(resource))
        if (!position) return null
        return (
          <AdvancedMarker
            key={resource.id}
            position={position}
            zIndex={resource.id === selectedId ? 40 : 20}
            title={`${resource.unitRef} · ${statusLabel(resource.status)}`}
            onClick={() => setSelectedId(resource.id)}
          >
            <ResourcePin resource={resource} />
          </AdvancedMarker>
        )
      })}

      {selected && selectedPosition && (
        <InfoWindow position={selectedPosition} onCloseClick={() => setSelectedId(null)}>
          <ResourceCallout resource={selected} nowMs={nowMs} />
        </InfoWindow>
      )}
    </>
  )
}

/** Read-only detail card shown when a unit marker is clicked. */
function ResourceCallout({ resource, nowMs }: { resource: IncidentMapResourceDto; nowMs: number }) {
  const arrived = ARRIVED_STATUSES.has(resource.status)
  const eta = liveEtaMinutes(resource, nowMs)
  const remaining = remainingKm(resource, nowMs)
  return (
    <div style={{ minWidth: 188, fontFamily: 'inherit', color: '#111827' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor(resource.status),
            display: 'inline-block',
          }}
        />
        <strong style={{ fontSize: 14 }}>{resource.unitRef}</strong>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
        {kindMeta(resource.resourceKind).label} · {resource.agency}
      </div>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        <span style={{ fontWeight: 600, color: statusColor(resource.status) }}>
          {statusLabel(resource.status)}
        </span>
        {!arrived && eta != null && (
          <span style={{ color: '#6b7280' }}> · ETA {eta} min</span>
        )}
        {!arrived && remaining != null && (
          <span style={{ color: '#6b7280' }}> · {remaining.toFixed(1)} km out</span>
        )}
        {arrived && <span style={{ color: '#6b7280' }}> · at incident</span>}
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 6, paddingTop: 6, fontSize: 12 }}>
        <CalloutRow label="Responding from" value={resource.originStation ?? '—'} />
        <CalloutRow label="Dispatched" value={formatClockTime(resource.dispatchedAt)} />
        {resource.notes?.trim() && <CalloutRow label="Notes" value={resource.notes.trim()} />}
      </div>
    </div>
  )
}

function CalloutRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
      <span style={{ color: '#9ca3af', minWidth: 92, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#374151' }}>{value}</span>
    </div>
  )
}

function formatClockTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Fits the viewport to the incident and all unit origins once per incident. */
function MapAutoFit({
  incidentId,
  incident,
  resources,
}: {
  incidentId: string
  incident: LatLng | null
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

    map.fitBounds(bounds, 80)
    fittedRef.current = incidentId
  }, [map, mapsLib, incident, resources, incidentId])

  return null
}

/** Imperative polyline from a unit's origin to the incident. */
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
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.6,
      strokeWeight: 2,
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

function ResourcePin({ resource }: { resource: IncidentMapResourceDto }) {
  const meta = kindMeta(resource.resourceKind)
  const ring = statusColor(resource.status)
  const badge = agencyColor(resource.agency)
  return (
    <Box
      bg={badge}
      color="white"
      borderRadius="full"
      borderWidth="2px"
      borderColor={ring}
      width="30px"
      height="30px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxShadow={`0 0 0 3px ${ring}55`}
    >
      <Icon as={meta.icon} boxSize="4" />
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

function ResourceList({
  resources,
  nowMs,
}: {
  resources: IncidentMapResourceDto[]
  nowMs: number
}) {
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
          {resources.map((resource) => {
            const arrived = ARRIVED_STATUSES.has(resource.status)
            const eta = liveEtaMinutes(resource, nowMs)
            const remaining = remainingKm(resource, nowMs)
            return (
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
                <Flex justify="space-between" mt="1" gap="2">
                  <Text fontSize="xs" color="gray.500" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {resource.agency}
                    {resource.originStation ? ` · ${resource.originStation}` : ''}
                  </Text>
                  {!arrived && (eta != null || remaining != null) && (
                    <Text fontSize="xs" color="gray.500" flexShrink="0">
                      {eta != null ? `ETA ${eta} min` : ''}
                      {eta != null && remaining != null ? ' · ' : ''}
                      {remaining != null ? `${remaining.toFixed(1)} km` : ''}
                    </Text>
                  )}
                </Flex>
              </Box>
            )
          })}
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
