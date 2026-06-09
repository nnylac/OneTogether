import { Button, HStack, Stack, Text } from '../../../../components/chakra-ui'
import type { AlertCondition } from '../types/alert'

type AlertConditionSelectorProps = {
  selectedCondition: AlertCondition
  onSelectCondition: (condition: AlertCondition) => void
}

const conditionOptions: Array<{
  value: AlertCondition
  label: string
  helper: string
}> = [
  {
    value: 'above',
    label: 'Above threshold',
    helper: 'Notify when value is exceeded',
  },
  {
    value: 'below',
    label: 'Below threshold',
    helper: 'Notify when value drops too low',
  },
]

export function AlertConditionSelector({
  selectedCondition,
  onSelectCondition,
}: AlertConditionSelectorProps) {
  return (
    <Stack gap="2">
      <Text color="gray.700" fontSize="sm" fontWeight="800">
        Alert condition
      </Text>

      <HStack gap="3" wrap="wrap">
        {conditionOptions.map((condition) => {
          const isActive = selectedCondition === condition.value

          return (
            <Button
              key={condition.value}
              alignItems="flex-start"
              borderColor={isActive ? 'blue.700' : 'gray.200'}
              bg={isActive ? 'blue.50' : 'white'}
              color={isActive ? 'blue.800' : 'gray.700'}
              flexDirection="column"
              gap="1"
              h="auto"
              minW="180px"
              px="4"
              py="3"
              variant="outline"
              onClick={() => onSelectCondition(condition.value)}
              _hover={{
                bg: isActive ? 'blue.50' : 'gray.50',
                borderColor: isActive ? 'blue.700' : 'gray.300',
              }}
            >
              <Text fontSize="sm" fontWeight="800">
                {condition.label}
              </Text>
              <Text color="gray.500" fontSize="xs" fontWeight="600">
                {condition.helper}
              </Text>
            </Button>
          )
        })}
      </HStack>
    </Stack>
  )
}
