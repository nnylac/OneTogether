import type { ElementType } from 'react'
import { LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Separator,
  Text,
  VStack,
} from '../chakra-ui'
import { useAuth } from '../../interfaces/auth/useAuth'

export type ConsoleNavItem = {
  label: string
  href: string
  icon: ElementType
  end?: boolean
  badgeCount?: number
  onClick?: () => void
}

export type ConsoleSidebarTheme = {
  activeBg: string
  activeBorder: string
  activeColor: string
  hoverBg: string
  hoverColor: string
}

type ConsoleSidebarProps = {
  brandIcon: ElementType
  brandSubtitle: string
  navItems: ConsoleNavItem[]
  theme: ConsoleSidebarTheme
}

function getNavLinkStyle(theme: ConsoleSidebarTheme) {
  return ({ isActive }: { isActive: boolean }) => ({
    width: '100%',
    background: isActive ? theme.activeBg : undefined,
    color: isActive ? theme.activeColor : undefined,
    borderLeft: isActive ? `4px solid ${theme.activeBorder}` : '4px solid transparent',
  })
}

function ConsoleSidebarNavLink({
  item,
  theme,
}: {
  item: ConsoleNavItem
  theme: ConsoleSidebarTheme
}) {
  return (
    <Button
      asChild
      variant="ghost"
      justifyContent="flex-start"
      h="11"
      borderRadius="0"
      color="gray.600"
      _hover={{ bg: theme.hoverBg, color: theme.hoverColor }}
    >
      <NavLink to={item.href} end={item.end} style={getNavLinkStyle(theme)}>
        <HStack w="100%" px="3" onClick={item.onClick}>
          <Icon as={item.icon} />
          <Text fontSize="sm" fontWeight="600" flex="1">
            {item.label}
          </Text>
          {item.badgeCount !== undefined && item.badgeCount > 0 && (
            <Badge
              bg="red.600"
              borderRadius="full"
              color="white"
              minW="5"
              px="2"
              py="0.5"
              textAlign="center"
            >
              {item.badgeCount}
            </Badge>
          )}
        </HStack>
      </NavLink>
    </Button>
  )
}

export function ConsoleSidebar({
  brandIcon,
  brandSubtitle,
  navItems,
  theme,
}: ConsoleSidebarProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const organisationLabel =
    user?.organisations.map((organisation) => organisation.orgName).join(', ') ||
    (user?.role === 'admin' ? 'Government' : 'No organisation')
  const username = user?.username ?? 'User'
  const initial = username.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <Box position="fixed" insetY="0" left="0" w="260px" zIndex="20">
      <Flex h="100%" direction="column" bg="white" borderRightWidth="1px" borderColor="gray.200">
        <Box px="5" py="4">
          <HStack>
            <Flex boxSize="10" align="center" justify="center" bg="blue.950" color="white">
              <Icon as={brandIcon} boxSize="5" />
            </Flex>

            <Box>
              <Text fontWeight="700" color="gray.900" lineHeight="1.1">
                OneTogether
              </Text>
              <Text fontSize="xs" color="gray.500">
                {brandSubtitle}
              </Text>
            </Box>
          </HStack>
        </Box>

        <Separator />

        <VStack gap="1" px="2" py="4">
          {navItems.map((item) => (
            <ConsoleSidebarNavLink key={item.href} item={item} theme={theme} />
          ))}
        </VStack>

        <Box mt="auto" px="5" py="5" borderTopWidth="1px" borderColor="gray.200">
          <HStack align="flex-start" gap="3">
            <Avatar.Root size="md" bg="blue.50" color="blue.950" flexShrink="0">
              <Avatar.Fallback name={username}>{initial}</Avatar.Fallback>
            </Avatar.Root>

            <Box minW="0">
              <Text fontSize="sm" fontWeight="600" color="gray.800" truncate>
                {username}
              </Text>
              <Badge
                mt="1"
                bg="green.500"
                color="white"
                px="2"
                py="0.5"
                maxW="140px"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {organisationLabel}
              </Badge>
            </Box>
          </HStack>

          <Button
            mt="4"
            w="100%"
            variant="ghost"
            justifyContent="flex-start"
            color="gray.500"
            _hover={{ bg: theme.hoverBg, color: theme.hoverColor }}
            onClick={handleLogout}
          >
            <Icon as={LogOut} />
            Logout
          </Button>
        </Box>
      </Flex>
    </Box>
  )
}
