import { Box, Flex, Text } from '../../../../components/chakra-ui'
import type { SeverityDistributionItem } from '../utils/dashboardMetrics'

type SeverityDistributionChartProps = {
  severityDistribution: SeverityDistributionItem[]
}

export function SeverityDistributionChart({
  severityDistribution,
}: SeverityDistributionChartProps) {
  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" minH="72" p="5">
      <Text color="gray.900" fontSize="md" fontWeight="900" mb="6">
        Severity Distribution
      </Text>

      {severityDistribution.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          No severity distribution available for this period.
        </Text>
      ) : (
        <Flex align="end" gap="4" minH="44">
          {severityDistribution.map((item) => (
            <Flex
              key={item.label}
              align="stretch"
              direction="column"
              flex="1"
              gap="2"
              justify="end"
              minW="0"
            >
              <Text
                color="gray.900"
                fontSize="lg"
                fontWeight="900"
                textAlign="center"
              >
                {item.count}
              </Text>
              <Box
                bg={item.color}
                h={`${Math.max(item.widthPercent, 8)}px`}
                minH="2"
              />
              <Text color="gray.500" fontSize="xs" textAlign="center">
                {item.label}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  )
}
