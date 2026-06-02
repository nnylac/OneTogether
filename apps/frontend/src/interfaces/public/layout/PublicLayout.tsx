import { Link, NavLink, Outlet } from 'react-router-dom'
import { Box, Button, Flex, HStack, Icon } from '../../../components/chakra-ui'
import { Bell, HandHeart, Home, MessageSquareWarning, User } from 'lucide-react'
import type { ElementType } from 'react'

type NavItem = {
  label: string
  href: string
  icon: ElementType
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Alerts', href: '/public/alerts', icon: Bell },
  { label: 'Report', href: '/public/report', icon: MessageSquareWarning },
  { label: 'Volunteer', href: '/public/volunteer', icon: HandHeart },
  { label: 'Community', href: '/public/community', icon: Home },
  { label: 'Profile', href: '/public/profile', icon: User },
]

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? '#111827' : '#4b5563',
  fontWeight: isActive ? 800 : 600,
})

export function PublicLayout() {
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

        <HStack as="nav" gap="1" overflowX="auto">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" color="gray.600">
              <NavLink to={item.href} end={item.end} style={navLinkStyle}>
                <Icon as={item.icon} />
                {item.label}
              </NavLink>
            </Button>
          ))}
        </HStack>
      </Flex>

      <Box as="main" flex="1" p={{ base: '4', md: '8' }}>
        <Outlet />
      </Box>
    </Flex>
  )
}
