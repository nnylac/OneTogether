import { Portal as ChakraPortal } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type PortalProps = ComponentProps<typeof ChakraPortal>

export const Portal = ({ ...props }: PortalProps) => {
  return <ChakraPortal {...props} />
}
