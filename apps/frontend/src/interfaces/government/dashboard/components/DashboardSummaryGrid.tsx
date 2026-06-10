import {
  BarChart3,
  CircleAlert,
  CircleCheck,
  Megaphone,
  Shield,
  TriangleAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Box } from '../../../../components/chakra-ui'
import type { DashboardSummaryMetric } from '../utils/dashboardMetrics'
import { DashboardSummaryCard } from './DashboardSummaryCard'

type DashboardSummaryGridProps = {
  metrics: DashboardSummaryMetric[]
}

const metricIcons = {
  'agencies-active': Shield,
  'available-volunteers': Users,
  'avg-response-time': TrendingUp,
  'critical-cases': CircleAlert,
  'hospital-capacity': BarChart3,
  'recent-broadcasts': Megaphone,
  'resolved-today': CircleCheck,
  'total-incidents': TriangleAlert,
}

export function DashboardSummaryGrid({ metrics }: DashboardSummaryGridProps) {
  return (
    <Box
      display="grid"
      gap="4"
      gridTemplateColumns={{
        base: '1fr',
        md: 'repeat(2, minmax(0, 1fr))',
        xl: 'repeat(4, minmax(0, 1fr))',
      }}
    >
      {metrics.map((metric) => (
        <DashboardSummaryCard
          key={metric.id}
          icon={metricIcons[metric.id as keyof typeof metricIcons]}
          metric={metric}
        />
      ))}
    </Box>
  )
}
