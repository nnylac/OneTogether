import { Box, Text } from '../../../../components/chakra-ui'

type OrganisationSummaryCardProps = {
  label: string
  value: string | number
  detail: string
}

export function OrganisationSummaryCard({
  label,
  value,
  detail,
}: OrganisationSummaryCardProps) {
  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="5">
      <Text color="gray.500" fontSize="sm">
        {label}
      </Text>

      <Text color="gray.900" fontSize="3xl" fontWeight="900" mt="3">
        {value}
      </Text>

      <Text color="gray.500" fontSize="sm" mt="1">
        {detail}
      </Text>
    </Box>
  )
}