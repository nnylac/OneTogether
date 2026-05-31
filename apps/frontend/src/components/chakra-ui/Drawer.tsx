import { Drawer as ChakraDrawer } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type DrawerRootProps = ComponentProps<typeof ChakraDrawer.Root>
type DrawerBackdropProps = ComponentProps<typeof ChakraDrawer.Backdrop>
type DrawerPositionerProps = ComponentProps<typeof ChakraDrawer.Positioner>
type DrawerContentProps = ComponentProps<typeof ChakraDrawer.Content>
type DrawerBodyProps = ComponentProps<typeof ChakraDrawer.Body>
type DrawerCloseTriggerProps = ComponentProps<typeof ChakraDrawer.CloseTrigger>

const DrawerRoot = ({ placement = 'start', ...props }: DrawerRootProps) => {
  return <ChakraDrawer.Root placement={placement} {...props} />
}

const DrawerBackdrop = ({ ...props }: DrawerBackdropProps) => {
  return <ChakraDrawer.Backdrop {...props} />
}

const DrawerPositioner = ({ ...props }: DrawerPositionerProps) => {
  return <ChakraDrawer.Positioner {...props} />
}

const DrawerContent = ({ maxW = '280px', ...props }: DrawerContentProps) => {
  return <ChakraDrawer.Content maxW={maxW} {...props} />
}

const DrawerBody = ({ p = '0', ...props }: DrawerBodyProps) => {
  return <ChakraDrawer.Body p={p} {...props} />
}

const DrawerCloseTrigger = ({ ...props }: DrawerCloseTriggerProps) => {
  return <ChakraDrawer.CloseTrigger {...props} />
}

export const Drawer = {
  Root: DrawerRoot,
  Backdrop: DrawerBackdrop,
  Positioner: DrawerPositioner,
  Content: DrawerContent,
  Body: DrawerBody,
  CloseTrigger: DrawerCloseTrigger,
}
