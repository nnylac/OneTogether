import { Button } from '../../../../components/chakra-ui'

type CommunityOrganisationFilterBadgeProps = {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

export function CommunityOrganisationFilterBadge({
  label,
  count,
  isActive,
  onClick,
}: CommunityOrganisationFilterBadgeProps) {
  return (
    <Button
      size="sm"
      borderRadius="full"
      variant="outline"
      bg={isActive ? 'blue.900' : 'white'}
      color={isActive ? 'white' : 'gray.600'}
      borderColor={isActive ? 'blue.900' : 'gray.200'}
      px="5"
      minH="10"
      onClick={onClick}
      _hover={{
        bg: isActive ? 'blue.900' : 'gray.50',
        borderColor: isActive ? 'blue.900' : 'gray.300',
      }}
    >
      {label} ({count})
    </Button>
  )
}