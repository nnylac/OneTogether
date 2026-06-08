import { Box, Text } from '../../../../components/chakra-ui'

type ResourceMetricBoxProps = {
  value: string | number
  label: string
}

export function ResourceMetricBox({ value, label }: ResourceMetricBoxProps) {
  return (
    <Box bg="gray.50" px="4" py="4" textAlign="center">
      <Text color="gray.900" fontSize="2xl" fontWeight="700">
        {value}
      </Text>

      <Text color="gray.500" fontSize="xs">
        {label}
      </Text>
    </Box>
  )
}