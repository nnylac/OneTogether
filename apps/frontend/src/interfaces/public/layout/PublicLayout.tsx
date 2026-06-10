import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
} from '../../../components/chakra-ui'
import { Bell, Home, LogOut, MessageSquareWarning } from 'lucide-react'
import type { ElementType } from 'react'
import { useAuth } from '../../auth/useAuth'

type NavItem = {
  label: string
  href: string
  icon: ElementType
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Alerts', href: '/public/alerts', icon: Bell },
  { label: 'Report', href: '/public/report', icon: MessageSquareWarning },
  { label: 'Community', href: '/public/community', icon: Home },
]

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? '#111827' : '#4b5563',
  fontWeight: isActive ? 800 : 600,
})

export function PublicLayout() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const username = user?.username ?? 'Citizen'
  const initial = username.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <Flex minH="100vh" direction="column" bg="gray.50">
      <Flex
        as="header"
        align="center"
        justify="space-between"
        gap="4"
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        px={{ base: '4', md: '8' }}
        py="4"
      >
        <Button asChild variant="ghost" color="gray.900" fontWeight="800" px="0">
          <Link to="/public/alerts">OneTogether</Link>
        </Button>

        <HStack gap="3" overflowX="auto">
          <HStack as="nav" gap="1">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" color="gray.600">
                <NavLink to={item.href} end={item.end} style={navLinkStyle}>
                  <Icon as={item.icon} />
                  {item.label}
                </NavLink>
              </Button>
            ))}
          </HStack>

          <HStack
            borderLeftWidth="1px"
            borderColor="gray.200"
            gap="3"
            pl="3"
            flexShrink="0"
          >
            <Avatar.Root size="sm" bg="blue.50" color="blue.950">
              <Avatar.Fallback name={username}>{initial}</Avatar.Fallback>
            </Avatar.Root>

            <Box display={{ base: 'none', md: 'block' }} minW="0">
              <Text color="gray.800" fontSize="sm" fontWeight="600" lineHeight="1.1">
                {username}
              </Text>
              <Badge bg="green.500" color="white" fontSize="2xs" mt="1" px="2">
                Citizen
              </Badge>
            </Box>

            <Button color="gray.500" variant="ghost" onClick={handleLogout}>
              <Icon as={LogOut} />
              Logout
            </Button>
          </HStack>
        </HStack>
      </Flex>

      <Box as="main" flex="1" p={{ base: '4', md: '8' }}>
        <Outlet />
      </Box>
    </Flex>
  )
}
