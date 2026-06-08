import { Box, Stack, Text } from '../../../../components/chakra-ui'
import { OrganisationTypeLabel } from './OrganisationTypeLabel'
import type { CommunityOrganisation } from '../types/organisation'

type GovernmentOrganisationCardProps = {
  organisation: CommunityOrganisation
}

export function GovernmentOrganisationCard({
  organisation,
}: GovernmentOrganisationCardProps) {
  return (
    <Box
      borderTopColor="gray.100"
      borderTopWidth="1px"
      px="4"
      py="4"
    >
      <Box
        display="grid"
        gap="4"
        gridTemplateColumns={{
          base: '1fr',
          xl: '2fr 1fr 1fr 1fr 1fr',
        }}
        alignItems="center"
      >
        <Stack gap="1">
          <Text color="gray.900" fontWeight="900">
            {organisation.name}
          </Text>

          <Text color="gray.500" fontSize="sm">
            {organisation.address}
          </Text>
        </Stack>

        <Box>
          <OrganisationTypeLabel type={organisation.type} />
        </Box>

        <Text color="gray.900" fontSize="sm" fontWeight="800">
          {organisation.capacityUsed}/{organisation.capacityTotal}
        </Text>

        <Text color="gray.700" fontSize="sm">
          {organisation.activeTasks} task
          {organisation.activeTasks === 1 ? '' : 's'}
        </Text>

        <Text color="gray.700" fontSize="sm">
          {organisation.isDeployed ? 'Deployed' : 'Active'}
        </Text>
      </Box>
    </Box>
  )
}