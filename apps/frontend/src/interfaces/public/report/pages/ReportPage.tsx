import { useEffect, useMemo, useState } from 'react'
import { Building2, RefreshCcw, Search } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { fetchOrganisationGuides } from '../api/organisationGuidesApi'
import { OrganisationGuideCard } from '../components/OrganisationGuideCard'
import type { OrganisationGuide } from '../types/organisationGuide'

export function ReportPage() {
  const [guides, setGuides] = useState<OrganisationGuide[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadGuides({ showLoading = false } = {}) {
    if (showLoading) {
      setIsLoading(true)
    }

    const nextGuides = await fetchOrganisationGuides()
    setGuides(nextGuides)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadGuides({ showLoading: true })
  }, [])

  const filteredGuides = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return guides
    }

    return guides.filter((guide) => {
      const searchableText = [
        guide.orgName,
        guide.contactNumber,
        guide.contactChannel,
        guide.serviceSummary,
        guide.contactGuidance,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [guides, searchTerm])

  return (
    <Stack gap="6" maxW="1440px" mx="auto">
      <Flex
        align={{ base: 'stretch', lg: 'end' }}
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <HStack color="green.700" gap="2" mb="2">
            <Icon as={Building2} boxSize="5" />
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.12em">
              OFFICIAL CONTACT GUIDANCE
            </Text>
          </HStack>
          <Heading color="gray.900" size="3xl">
            Report
          </Heading>
          <Text color="gray.600" mt="2">
            Find the right organisation to contact for emergency and public
            service issues.
          </Text>
        </Box>

        <Button
          alignSelf={{ base: 'stretch', lg: 'auto' }}
          bg="green.600"
          color="white"
          onClick={() => void loadGuides({ showLoading: true })}
          _hover={{ bg: 'green.700' }}
        >
          <Icon as={RefreshCcw} />
          Refresh
        </Button>
      </Flex>

      <Flex
        align={{ base: 'stretch', lg: 'center' }}
        bg="white"
        borderColor="gray.200"
        borderWidth="1px"
        direction={{ base: 'column', lg: 'row' }}
        gap="4"
        justify="space-between"
        p="4"
      >
        <Box>
          <Text color="gray.900" fontSize="lg" fontWeight="800">
            Organisation directory
          </Text>
          <Text color="gray.500" fontSize="sm">
            {filteredGuides.length} contact guide
            {filteredGuides.length === 1 ? '' : 's'} available
          </Text>
        </Box>

        <Box maxW={{ lg: '420px' }} position="relative" w="100%">
          <Icon
            as={Search}
            boxSize="4"
            color="gray.400"
            left="3"
            position="absolute"
            top="50%"
            transform="translateY(-50%)"
          />
          <Input
            bg="white"
            borderColor="gray.300"
            pl="10"
            placeholder="Search by organisation or issue"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Box>
      </Flex>

      <Box
        display="grid"
        gap="3"
        gridTemplateColumns={{
          base: '1fr',
          lg: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(3, minmax(0, 1fr))',
        }}
      >
        {isLoading ? (
          <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
            <Text color="gray.500">Loading organisation guides...</Text>
          </Box>
        ) : filteredGuides.length === 0 ? (
          <Box bg="white" borderColor="gray.200" borderWidth="1px" p="6">
            <Text color="gray.500">No organisation guides match this search.</Text>
          </Box>
        ) : (
          filteredGuides.map((guide) => (
            <OrganisationGuideCard key={guide.id} guide={guide} />
          ))
        )}
      </Box>
    </Stack>
  )
}
