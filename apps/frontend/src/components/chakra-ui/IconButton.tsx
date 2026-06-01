import { IconButton as ChakraIconButton } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type IconButtonProps = ComponentProps<typeof ChakraIconButton>

export const IconButton = ({
  borderRadius = 'sm',
  transition = 'all 0.15s ease',
  ...props
}: IconButtonProps) => {
  return <ChakraIconButton borderRadius={borderRadius} transition={transition} {...props} />
}
