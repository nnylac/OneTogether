import { Button, Text } from '../../../../components/chakra-ui'

type BroadcastAudienceBoxProps = {
  title: string
  description: string
  isActive: boolean
  onClick: () => void
}

export function BroadcastAudienceBox({
  title,
  description,
  isActive,
  onClick,
}: BroadcastAudienceBoxProps) {
  return (
    <Button
      bg={isActive ? 'blue.50' : 'white'}
      borderColor={isActive ? 'blue.700' : 'gray.200'}
      borderWidth="1px"
      cursor="pointer"
      display="block"
      h="auto"
      minH="20"
      p="4"
      textAlign="left"
      transition="all 0.15s ease"
      variant="ghost"
      whiteSpace="normal"
      w="100%"
      onClick={onClick}
      _hover={{
        bg: isActive ? 'blue.50' : 'gray.50',
        borderColor: isActive ? 'blue.700' : 'gray.300',
      }}
    >
      <Text color="gray.900" fontSize="sm" fontWeight="800">
        {title}
      </Text>

      <Text color="gray.500" fontSize="xs" mt="1">
        {description}
      </Text>
    </Button>
  )
}
