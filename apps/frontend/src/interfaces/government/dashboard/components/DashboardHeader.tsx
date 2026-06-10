import { Bell, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Text,
} from '../../../../components/chakra-ui'

type DashboardHeaderProps = {
  isRefreshing: boolean
  onRefresh: () => void
}

export function DashboardHeader({
  isRefreshing,
  onRefresh,
}: DashboardHeaderProps) {
  const navigate = useNavigate()

  return (
    <Flex
      align={{ base: 'stretch', lg: 'center' }}
      direction={{ base: 'column', lg: 'row' }}
      gap="4"
      justify="space-between"
    >
      <Box>
        <Heading size="3xl" color="gray.900">
          Command Dashboard
        </Heading>
        <Text color="gray.500" mt="1">
          Real-time national emergency overview
        </Text>
      </Box>

      <Flex gap="3" wrap="wrap">
        <Button
          bg="white"
          borderColor="gray.200"
          color="gray.700"
          size="sm"
          variant="outline"
          onClick={() => navigate('/government/alerts')}
          _hover={{ bg: 'gray.50' }}
        >
          <Icon as={Bell} />
          Thresholds
        </Button>
        <Button
          bg="blue.900"
          color="white"
          loading={isRefreshing}
          size="sm"
          onClick={onRefresh}
          _hover={{ bg: 'blue.800' }}
        >
          <Icon as={RefreshCw} />
          Refresh
        </Button>
      </Flex>
    </Flex>
  )
}
