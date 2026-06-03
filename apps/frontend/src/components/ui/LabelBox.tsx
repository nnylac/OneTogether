import type { ReactNode } from 'react'
import { Box } from '../chakra-ui'
// used to replace labels since the chakra-ui default labels look kinda ugly
export type LabelBoxTone =
  | 'gray'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'green'
  | 'teal'
  | 'orange'
  | 'red'

const toneStyles: Record<LabelBoxTone, { bg: string; borderColor: string; color: string }> = {
  gray: {
    bg: 'gray.50',
    borderColor: 'gray.200',
    color: 'gray.700',
  },
  yellow: {
    bg: 'yellow.50',
    borderColor: 'yellow.200',
    color: 'yellow.800',
  },
  blue: {
    bg: 'blue.50',
    borderColor: 'blue.200',
    color: 'blue.700',
  },
  purple: {
    bg: 'purple.50',
    borderColor: 'purple.200',
    color: 'purple.700',
  },
  green: {
    bg: 'green.50',
    borderColor: 'green.200',
    color: 'green.700',
  },
  teal: {
    bg: 'teal.50',
    borderColor: 'teal.200',
    color: 'teal.700',
  },
  orange: {
    bg: 'orange.50',
    borderColor: 'orange.200',
    color: 'orange.700',
  },
  red: {
    bg: 'red.50',
    borderColor: 'red.200',
    color: 'red.700',
  },
}

type LabelBoxProps = {
  children: ReactNode
  minW?: string
  tone?: LabelBoxTone
}

export function LabelBox({ children, minW, tone = 'gray' }: LabelBoxProps) {
  const styles = toneStyles[tone]

  return (
    <Box
      bg={styles.bg}
      borderColor={styles.borderColor}
      borderWidth="1px"
      color={styles.color}
      display="inline-flex"
      fontSize="sm"
      fontWeight="800"
      justifyContent="center"
      minH="9"
      minW={minW}
      px="4"
      py="1"
      textTransform="capitalize"
    >
      {children}
    </Box>
  )
}
