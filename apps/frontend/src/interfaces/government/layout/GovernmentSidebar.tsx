import {
  BarChart3,
  Building2,
  Grid2X2,
  Map,
  RadioTower,
  Settings,
  Shield,
  Siren,
} from 'lucide-react'
import type { ElementType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Separator,
  Text,
  VStack,
} from '../../../components/chakra-ui'

type NavItem = {
  label: string
  href: string
  icon: ElementType
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/government', icon: Grid2X2, end: true },
  { label: 'Incidents', href: '/government/incidents', icon: Siren },
  { label: 'Map', href: '/government/map', icon: Map },
  { label: 'Broadcasts', href: '/government/broadcasts', icon: RadioTower },
  { label: 'Organisations', href: '/government/organisations', icon: Building2 },
  { label: 'Analytics', href: '/government/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/government/settings', icon: Settings },
]

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  width: '100%',
  background: isActive ? '#e0f2fe' : undefined,
  color: isActive ? '#075985' : undefined,
  borderLeft: isActive ? '4px solid #0284c7' : '4px solid transparent',
})

function SidebarNavLink({ item }: { item: NavItem }) {
  return (
    <Button
      asChild
      variant="ghost"
      justifyContent="flex-start"
      h="11"
      borderRadius="0"
      color="gray.600"
      _hover={{ bg: 'blue.50', color: 'blue.700' }}
    >
      <NavLink to={item.href} end={item.end} style={navLinkStyle}>
        <HStack w="100%" px="3">
          <Icon as={item.icon} />
          <Text fontSize="sm" fontWeight="600">
            {item.label}
          </Text>
        </HStack>
      </NavLink>
    </Button>
  )
}

export function GovernmentSidebar() {
  return (
    <Box position="fixed" insetY="0" left="0" w="260px" zIndex="20">
      <Flex h="100%" direction="column" bg="white" borderRightWidth="1px" borderColor="gray.200">
        <Box px="5" py="4">
          <HStack>
            <Flex boxSize="10" align="center" justify="center" bg="blue.950" color="white">
              <Icon as={Shield} boxSize="5" />
            </Flex>

            <Box>
              <Text fontWeight="700" color="gray.900" lineHeight="1.1">
                OneTogether
              </Text>
              <Text fontSize="xs" color="gray.500">
                Government
              </Text>
            </Box>
          </HStack>
        </Box>

        <Separator />

        <VStack gap="1" px="2" py="4">
          {navItems.map((item) => (
            <SidebarNavLink key={item.href} item={item} />
          ))}
        </VStack>
      </Flex>
    </Box>
  )
}
