import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Box } from '../chakra-ui'

type ChevronRightLinkProps = {
  label: string
  to: string
}

export function ChevronRightLink({ label, to }: ChevronRightLinkProps) {
  return (
    <Box
      asChild
      alignItems="center"
      color="gray.500"
      display="inline-flex"
      justifyContent="center"
      minH="8"
      minW="8"
      _hover={{ color: 'gray.900' }}
    >
      <Link to={to} aria-label={label}>
        <ChevronRight size={18} strokeWidth={2} />
      </Link>
    </Box>
  )
}
