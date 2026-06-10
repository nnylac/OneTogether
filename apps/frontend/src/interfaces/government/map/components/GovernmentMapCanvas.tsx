import { Box, Text } from '../../../../components/chakra-ui'
import { OverviewMap } from '../../../shared/map/components/OverviewMap'
import type { Incident } from '../../../responder/incidents/types'

type GovernmentMapCanvasProps = {
  incidents: Incident[]
  isLoading: boolean
  onSelectIncident: (id: string | null) => void
  selectedId: string | null
  totalIncidentCount: number
}

export function GovernmentMapCanvas({
  incidents,
  isLoading,
  onSelectIncident,
  selectedId,
  totalIncidentCount,
}: GovernmentMapCanvasProps) {
  return (
    <Box
      flex={{ base: 'none', xl: '3' }}
      minW="0"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
      borderRadius="md"
    >
      {isLoading && totalIncidentCount === 0 ? (
        <Box
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <Text color="gray.500">Loading national map...</Text>
        </Box>
      ) : (
        <OverviewMap
          incidents={incidents}
          selectedId={selectedId}
          onSelect={onSelectIncident}
        />
      )}
    </Box>
  )
}

