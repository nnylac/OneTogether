import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Icon } from '../../../components/chakra-ui'

export function BackToDashboardLink() {
  return (
    <Button
      asChild
      variant="ghost"
      alignSelf="flex-start"
      color="gray.600"
      px="0"
      _hover={{ bg: 'transparent', color: 'gray.900' }}
    >
      <Link to="/responder">
        <Icon as={ArrowLeft} />
        Back to Dashboard
      </Link>
    </Button>
  )
}
