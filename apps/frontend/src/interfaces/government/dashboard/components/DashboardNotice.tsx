import { Box, Text } from '../../../../components/chakra-ui'

type DashboardNoticeProps = {
  message: string
  tone?: 'neutral' | 'red'
}

export function DashboardNotice({
  message,
  tone = 'neutral',
}: DashboardNoticeProps) {
  const styles =
    tone === 'red'
      ? { bg: 'red.50', border: 'red.200', color: 'red.700' }
      : { bg: 'white', border: 'gray.200', color: 'gray.500' }

  return (
    <Box bg={styles.bg} borderColor={styles.border} borderWidth="1px" p="4">
      <Text color={styles.color} fontSize="sm" fontWeight="700">
        {message}
      </Text>
    </Box>
  )
}
