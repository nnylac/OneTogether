import { Avatar as ChakraAvatar } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type AvatarRootProps = ComponentProps<typeof ChakraAvatar.Root>
type AvatarFallbackProps = ComponentProps<typeof ChakraAvatar.Fallback>
type AvatarImageProps = ComponentProps<typeof ChakraAvatar.Image>

const AvatarRoot = ({
  bg = 'purple.100',
  color = 'purple.700',
  ...props
}: AvatarRootProps) => {
  return <ChakraAvatar.Root bg={bg} color={color} {...props} />
}

const AvatarFallback = ({ ...props }: AvatarFallbackProps) => {
  return <ChakraAvatar.Fallback {...props} />
}

const AvatarImage = ({ ...props }: AvatarImageProps) => {
  return <ChakraAvatar.Image {...props} />
}

export const Avatar = {
  Root: AvatarRoot,
  Fallback: AvatarFallback,
  Image: AvatarImage,
}
