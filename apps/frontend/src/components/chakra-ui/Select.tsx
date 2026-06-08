import { NativeSelect } from '@chakra-ui/react'
import type { ComponentProps, ReactNode } from 'react'

type SelectProps = ComponentProps<typeof NativeSelect.Field> & {
  children: ReactNode
  rootProps?: ComponentProps<typeof NativeSelect.Root>
}

export const Select = ({ children, rootProps, ...props }: SelectProps) => {
  return (
    <NativeSelect.Root size="sm" {...rootProps}>
      <NativeSelect.Field fontWeight="700" {...props}>
        {children}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}