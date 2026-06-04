import { Heading, Stack, Text } from '../../../../components/chakra-ui'
import { BackToDashboardLink } from '../../components/BackToDashboardLink'

export function SettingsPage() {
  return (
    <Stack gap="3">
      <BackToDashboardLink />
      <Heading size="3xl" color="gray.900">
        Settings
      </Heading>
      <Text color="gray.500">This page is ready for your settings module.</Text>
    </Stack>
  )
}
