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
} from '../chakra-ui'

export type ConsoleNavItem = {
  label: string
  href: string
  icon: ElementType
  end?: boolean
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

export function ConsoleSidebar({
  brandIcon,
  brandSubtitle,
  navItems,
  theme,
}: ConsoleSidebarProps) {
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
      </Flex>
    </Box>
  )
}
