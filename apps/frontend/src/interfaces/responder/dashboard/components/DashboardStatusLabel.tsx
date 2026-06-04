import { Box } from '../../../../components/chakra-ui'

export type DashboardStatusTone = 'gray' | 'blue' | 'orange' | 'green'

type DashboardStatusLabelProps = {
  children: string
  tone?: DashboardStatusTone
}

const toneStyles: Record<DashboardStatusTone, { bg: string; borderColor: string; color: string }> = {
  gray: {
    bg: 'gray.50',
    borderColor: 'gray.200',
    color: 'gray.700',
  },
  blue: {
    bg: 'blue.50',
    borderColor: 'blue.200',
    color: 'blue.700',
  },
  orange: {
    bg: 'orange.50',
    borderColor: 'orange.200',
    color: 'orange.700',
  },
  green: {
    bg: 'green.50',
    borderColor: 'green.200',
    color: 'green.700',
  },
}

export function DashboardStatusLabel({ children, tone = 'gray' }: DashboardStatusLabelProps) {
  const styles = toneStyles[tone]

  return (
    <Box
      bg={styles.bg}
      borderColor={styles.borderColor}
      borderWidth="1px"
      color={styles.color}
      fontSize="xs"
      fontWeight="800"
      px="3"
      py="1"
      textTransform="uppercase"
      whiteSpace="nowrap"
    >
      {children}
    </Box>
  )
}
