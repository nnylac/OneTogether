import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Shield } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
} from '../../../components/chakra-ui'
import { useAuth } from '../useAuth'
import type { AuthRole } from '../types'

const featureLabels = [
  'Citizen alerts',
  'Responder coordination',
  'National command',
]

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <HStack gap="3" align="center">
      <Flex
        align="center"
        justify="center"
        w={compact ? '34px' : '38px'}
        h={compact ? '34px' : '38px'}
        bg="#07365d"
        color="white"
      >
        <Icon as={Shield} boxSize={compact ? '18px' : '20px'} />
      </Flex>
      <Box>
        <Text color="#07365d" fontSize={compact ? 'sm' : 'md'} fontWeight="900">
          OneTogether
        </Text>
        <Text color="#6b7b91" fontSize={compact ? 'xs' : 'sm'}>
          Singapore Emergency Platform
        </Text>
      </Box>
    </HStack>
  )
}

function LoginInput({
  disabled,
  icon,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  value,
}: {
  disabled?: boolean
  icon: typeof Mail
  label: string
  name: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  autoComplete: string
  value: string
}) {
  return (
    <Box>
      <Text color="#24344d" fontSize="sm" fontWeight="800" mb="2">
        {label}
      </Text>
      <Box position="relative">
        <Icon
          as={icon}
          boxSize="17px"
          color="#a7b2c3"
          left="4"
          position="absolute"
          top="50%"
          transform="translateY(-50%)"
          zIndex="1"
        />
        <Input
          aria-label={label}
          bg="white"
          borderColor="#d9e0ea"
          borderRadius="0"
          color="#26364f"
          disabled={disabled}
          fontWeight="700"
          h="50px"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          pl="11"
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          value={value}
        />
      </Box>
    </Box>
  )
}

function getHomePath(role: AuthRole) {
  if (role === 'admin') {
    return '/government'
  }

  if (role === 'responder') {
    return '/responder'
  }

  return '/citizen'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!identifier.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await login({
        identifier: identifier.trim(),
        password,
      })
      navigate(getHomePath(user.role), { replace: true })
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to login. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Flex
      align="center"
      bg="linear-gradient(115deg, #f5f9ff 0%, #eaf5ff 46%, #ecfff6 100%)"
      justify="center"
      minH="100vh"
      px={{ base: '5', lg: '10' }}
      py={{ base: '8', lg: '12' }}
    >
      <Flex
        align="center"
        gap={{ base: '8', xl: '10' }}
        justify="center"
        maxW="1240px"
        w="full"
        direction={{ base: 'column', lg: 'row' }}
      >
        <Stack
          flex="1"
          gap="8"
          maxW={{ base: 'full', lg: '730px' }}
          pr={{ base: '0', xl: '4' }}
        >
          <BrandMark />

          <Stack gap="5">
            <Heading
              as="h1"
              color="#07365d"
              fontSize={{ base: '4xl', md: '5xl', xl: '6xl' }}
              fontWeight="900"
              lineHeight="1.2"
              maxW="760px"
            >
              Centralized emergency coordination for Singapore.
            </Heading>
            <Text
              color="#52657b"
              fontSize={{ base: 'md', md: 'lg' }}
              lineHeight="1.65"
              maxW="710px"
            >
              OneTogether aggregates incident data from hospitals, SCDF, SPF,
              and approved community organisations into shared tickets, public
              advisories, responder workflows, and government command dashboards.
            </Text>
          </Stack>

          <Flex gap="4" wrap="wrap">
            {featureLabels.map((label) => (
              <Flex
                key={label}
                align="center"
                bg="white"
                borderWidth="1px"
                borderColor="#dbe4ef"
                color="#133456"
                fontSize="sm"
                fontWeight="800"
                h="58px"
                minW={{ base: 'full', sm: '210px' }}
                px="5"
              >
                {label}
              </Flex>
            ))}
          </Flex>
        </Stack>

        <Box
          bg="white"
          borderWidth="1px"
          borderColor="#dce4ee"
          boxShadow="0 28px 70px rgba(22, 51, 84, 0.14)"
          maxW="456px"
          p={{ base: '6', md: '7' }}
          w="full"
        >
          <Stack gap="6">
            <BrandMark compact />

            <Box>
              <Heading as="h2" color="#101a2e" fontSize="2xl" fontWeight="900">
                Login
              </Heading>
              <Text color="#67809b" fontSize="sm" mt="1">
                Use demo access to open a role-based interface.
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack gap="4">
                <LoginInput
                  autoComplete="email"
                  disabled={isSubmitting}
                  icon={Mail}
                  label="Email"
                  name="email"
                  onChange={setIdentifier}
                  placeholder="raj.kumar@gov.sg"
                  value={identifier}
                />
                <LoginInput
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  icon={Lock}
                  label="Password"
                  name="password"
                  onChange={setPassword}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
                {error ? (
                  <Text color="#b91c1c" fontSize="sm" fontWeight="700">
                    {error}
                  </Text>
                ) : null}
                <Button
                  bg="#07365d"
                  borderRadius="0"
                  color="white"
                  disabled={isSubmitting}
                  h="50px"
                  type="submit"
                  _hover={{ bg: '#052b4b' }}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  bg="#fff7f7"
                  borderColor="#ffc7c7"
                  borderRadius="0"
                  borderWidth="1px"
                  color="#c61818"
                  h="50px"
                  _hover={{ bg: '#fff0f0' }}
                >
                  Singpass Login
                </Button>
              </Stack>
            </form>
            <Box>
              <Text fontSize="md" fontWeight="900">
                Demo Accounts
              </Text>
              <br />
                <Text fontSize="sm" fontWeight="900">
                  Citizen Login
                </Text>
                <Text color="#67809b" fontSize="sm" mt="1">
                  Username: citizen
                  <br />
                  Password: citizen
                </Text>
                <br /><hr />
                <Text fontSize="sm" fontWeight="900">
                  Responder Login
                </Text>
                <Text color="#67809b" fontSize="sm" mt="1">
                  Username: responder
                  <br />
                  Password: responder
                </Text>
                <br /><hr />
                <Text fontSize="sm" fontWeight="900">
                  Government Login
                </Text>
                <Text color="#67809b" fontSize="sm" mt="1">
                  Username: gov
                  <br />
                  Password: gov
                </Text>
                <br /><hr />
            </Box>
          </Stack>
        </Box>
      </Flex>
    </Flex>
  )
}
