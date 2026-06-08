import { Box, Text } from '../../../../components/chakra-ui'

type IncidentDetailBoxProps = {
  label: string
  value: string
}

export function IncidentDetailBox({ label, value }: IncidentDetailBoxProps) {
  return (
    <Box bg="gray.50" px="4" py="3" minH="16">
      <Text
        color="gray.500"
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </Text>

      <Text color="gray.900" fontSize="sm" fontWeight="700" mt="1">
        {value}
      </Text>
    </Box>
  )
}