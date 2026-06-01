import { Button as ChakraButton } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof ChakraButton>

export const Button = ({
  borderRadius = 'sm',
  fontWeight = '700',
  transition = 'all 0.15s ease',
  ...props
}: ButtonProps) => {
  return (
    <ChakraButton
      borderRadius={borderRadius}
      fontWeight={fontWeight}
      transition={transition}
      {...props}
    />
  )
}
