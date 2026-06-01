import { Icon as ChakraIcon } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type IconProps = ComponentProps<typeof ChakraIcon>

export const Icon = ({ boxSize = '4', ...props }: IconProps) => {
  return <ChakraIcon boxSize={boxSize} {...props} />
}
