import { Stack as ChakraStack } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type StackProps = ComponentProps<typeof ChakraStack>

export const Stack = ({ gap = '4', ...props }: StackProps) => {
  return <ChakraStack gap={gap} {...props} />
}
