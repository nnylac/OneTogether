import { Flex as ChakraFlex } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type FlexProps = ComponentProps<typeof ChakraFlex>

export const Flex = ({ ...props }: FlexProps) => {
  return <ChakraFlex {...props} />
}
