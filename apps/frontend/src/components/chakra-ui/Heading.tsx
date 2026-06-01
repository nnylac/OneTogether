import { Heading as ChakraHeading } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type HeadingProps = ComponentProps<typeof ChakraHeading>

export const Heading = ({
  fontWeight = '700',
  letterSpacing = '0',
  color = 'gray.900',
  ...props
}: HeadingProps) => {
  return (
    <ChakraHeading
      color={color}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      {...props}
    />
  )
}
