import { HStack as ChakraHStack } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type HStackProps = ComponentProps<typeof ChakraHStack>

export const HStack = ({ gap = '3', ...props }: HStackProps) => {
  return <ChakraHStack gap={gap} {...props} />
}
