import { VStack as ChakraVStack } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type VStackProps = ComponentProps<typeof ChakraVStack>

export const VStack = ({ gap = '3', align = 'stretch', ...props }: VStackProps) => {
  return <ChakraVStack align={align} gap={gap} {...props} />
}
