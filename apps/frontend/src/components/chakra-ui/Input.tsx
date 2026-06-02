import { Input as ChakraInput } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type InputProps = ComponentProps<typeof ChakraInput>

export const Input = ({ ...props }: InputProps) => {
  return <ChakraInput {...props} />
}
