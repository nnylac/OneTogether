import { Badge as ChakraBadge } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type BadgeProps = ComponentProps<typeof ChakraBadge>

export const Badge = ({
  borderRadius = 'sm',
  fontWeight = '700',
  textTransform = 'none',
  ...props
}: BadgeProps) => {
  return (
    <ChakraBadge
      borderRadius={borderRadius}
      fontWeight={fontWeight}
      textTransform={textTransform}
      {...props}
    />
  )
}
