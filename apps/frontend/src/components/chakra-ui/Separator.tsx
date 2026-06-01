import { Separator as ChakraSeparator } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type SeparatorProps = ComponentProps<typeof ChakraSeparator>

export const Separator = ({ borderColor = 'gray.200', ...props }: SeparatorProps) => {
  return <ChakraSeparator borderColor={borderColor} {...props} />
}
