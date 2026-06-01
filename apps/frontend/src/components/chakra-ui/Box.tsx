import { Box as ChakraBox } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type BoxProps = ComponentProps<typeof ChakraBox>

export const Box = ({ ...props }: BoxProps) => {
  return <ChakraBox {...props} />
}
