import { Heading, Stack, Text } from '../components/chakra-ui'

export function DashboardPage() {
  return (
    <Stack gap="3">
      <Heading size="3xl" color="gray.900">
        Dashboard
      </Heading>
      <Text color="gray.500">This page is ready for your dashboard module.</Text>
    </Stack>
  )
}
