import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  Flex,
  HStack,
  Icon,
  IconButton,
  Portal,
  Separator,
  Text,
  VStack,
} from '../chakra-ui'
import {
  Bell,
  Grid2X2,
  LogOut,
  Map,
  Menu,
  RadioTower,
  Settings,
  Shield,
  Siren,
  X,
} from 'lucide-react'
import type { ElementType } from 'react'
import { NavLink } from 'react-router-dom'

type SidebarProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type NavItem = {
  label: string
  href: string
  icon: ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Grid2X2 },
  { label: 'Incidents', href: '/incidents', icon: Siren },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Resources', href: '/resources', icon: RadioTower },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  width: '100%',
  background: isActive ? '#f0e7ff' : undefined,
  color: isActive ? '#6d28d9' : undefined,
  borderLeft: isActive ? '4px solid #7c3aed' : '4px solid transparent',
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
      _hover={{ bg: 'purple.50', color: 'purple.700' }}
    >
      <NavLink to={item.href} style={navLinkStyle}>
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

function SidebarContent() {
  return (
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
              Singapore Emergency Platform
            </Text>
          </Box>
        </HStack>
      </Box>

      <Separator />

      <HStack px="5" py="4" gap="2">
        <Box boxSize="2" borderRadius="full" bg="green.400" />
        <Text fontSize="xs" fontWeight="700" color="gray.500">
          LIVE
        </Text>
      </HStack>

      <VStack gap="1" px="2">
        {navItems.map((item) => (
          <SidebarNavLink key={item.href} item={item} />
        ))}
      </VStack>

      <Box flex="1" />

      <Box p="5">
        <HStack>
          <Avatar.Root size="sm">
            <Avatar.Fallback name="Chen Xiao Ling" />
          </Avatar.Root>

          <Box flex="1">
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              Chen Xiao Ling
            </Text>
            <Badge size="sm" colorPalette="purple">
              SCDF
            </Badge>
          </Box>
        </HStack>

        <Button
          mt="4"
          variant="ghost"
          size="sm"
          color="gray.500"
          justifyContent="flex-start"
          w="100%"
        >
          <Icon as={LogOut} boxSize="4" />
          Logout
        </Button>
      </Box>
    </Flex>
  )
}

export function Sidebar() {
  return (
    <Box
      display={{ base: 'none', lg: 'block' }}
      position="fixed"
      insetY="0"
      left="0"
      w="260px"
      zIndex="20"
    >
      <SidebarContent />
    </Box>
  )
}

export function MobileSidebar({ open, onOpenChange }: SidebarProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger asChild>
              <IconButton
                aria-label="Close navigation"
                position="absolute"
                top="3"
                right="3"
                variant="ghost"
                size="sm"
              >
                <X />
              </IconButton>
            </Drawer.CloseTrigger>

            <Drawer.Body>
              <SidebarContent />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

export function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      display={{ base: 'inline-flex', lg: 'none' }}
      aria-label="Open navigation"
      variant="ghost"
      color="white"
      onClick={onClick}
    >
      <Menu />
    </IconButton>
  )
}
