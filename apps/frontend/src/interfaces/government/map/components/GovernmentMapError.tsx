import { Box, Text } from '../../../../components/chakra-ui'

type GovernmentMapErrorProps = {
  message: string
}

export function GovernmentMapError({ message }: GovernmentMapErrorProps) {
  return (
    <Box
      bg="red.50"
      borderWidth="1px"
      borderColor="red.200"
      color="red.700"
      p="3"
      flexShrink="0"
    >
      <Text fontWeight="700">{message}</Text>
    </Box>
  )
}

