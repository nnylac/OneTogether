import { Text as ChakraText } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type TextProps = ComponentProps<typeof ChakraText>

export const Text = ({ letterSpacing = '0', ...props }: TextProps) => {
  return <ChakraText letterSpacing={letterSpacing} {...props} />
}
