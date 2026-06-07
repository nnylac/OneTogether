import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '../../../components/chakra-ui'

export function UnauthorizedPage() {
  return (
    <Flex
      align="center"
      bg="#f5f9ff"
      justify="center"
      minH="100vh"
      px="6"
      py="10"
    >
      <Box
        bg="white"
        borderColor="#dce4ee"
        borderWidth="1px"
        maxW="460px"
        p="8"
        textAlign="center"
        w="full"
      >
        <Stack align="center" gap="5">
          <Flex
            align="center"
            bg="#fff2f2"
            color="#b91c1c"
            h="52px"
            justify="center"
            w="52px"
          >
            <Icon as={ShieldAlert} boxSize="28px" />
          </Flex>
          <Box>
            <Heading as="h1" color="#111827" fontSize="2xl" fontWeight="900">
              Unauthorised access
            </Heading>
            <Text color="#52657b" mt="2">
              Your account does not have permission to view this interface.
            </Text>
          </Box>
          <Button asChild bg="#07365d" borderRadius="0" color="white">
            <Link to="/">Back to login</Link>
          </Button>
        </Stack>
      </Box>
    </Flex>
  )
}
