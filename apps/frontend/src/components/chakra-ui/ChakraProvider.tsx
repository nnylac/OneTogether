import {
  ChakraProvider as ChakraProviderBase,
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type ChakraProviderProps = ComponentProps<typeof ChakraProviderBase>

const customConfig = defineConfig({
  globalCss: {
    html: {
      background: '#f9fafb',
    },
    body: {
      margin: '0',
      minWidth: '320px',
    },
    '*': {
      boxSizing: 'border-box',
    },
  },
})

const system = createSystem(defaultConfig, customConfig)

const ChakraProvider = ({ ...props }: ChakraProviderProps) => {
  return <ChakraProviderBase {...props} />
}

export { ChakraProvider, system }
