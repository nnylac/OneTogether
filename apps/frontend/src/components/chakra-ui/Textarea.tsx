import { Textarea as ChakraTextarea } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type TextareaProps = ComponentProps<typeof ChakraTextarea>

export const Textarea = ({ ...props }: TextareaProps) => {
  return <ChakraTextarea {...props} />
}
