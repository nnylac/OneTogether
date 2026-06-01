import { ChakraProvider as ChakraProviderBase, defaultSystem } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type ChakraProviderProps = ComponentProps<typeof ChakraProviderBase>

const ChakraProvider = ({ ...props }: ChakraProviderProps) => {
  return <ChakraProviderBase {...props} />
}

export { ChakraProvider, defaultSystem }
