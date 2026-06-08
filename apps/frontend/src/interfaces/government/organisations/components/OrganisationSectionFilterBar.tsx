import { Button, HStack } from '../../../../components/chakra-ui'
import type { OrganisationSection } from '../types/organisation'

type OrganisationSectionFilterBarProps = {
  selectedSection: OrganisationSection
  onSelectSection: (section: OrganisationSection) => void
}

const sections: OrganisationSection[] = [
  'Community Organisations',
  'Hospitals',
  'Volunteer Tasks',
]

export function OrganisationSectionFilterBar({
  selectedSection,
  onSelectSection,
}: OrganisationSectionFilterBarProps) {
  return (
    <HStack bg="white" borderColor="gray.200" borderWidth="1px" gap="0">
      {sections.map((section) => {
        const isActive = selectedSection === section

        return (
          <Button
            key={section}
            flex="1"
            borderRadius="0"
            bg={isActive ? 'blue.900' : 'white'}
            color={isActive ? 'white' : 'gray.600'}
            minH="12"
            onClick={() => onSelectSection(section)}
            _hover={{
              bg: isActive ? 'blue.900' : 'gray.50',
            }}
          >
            {section}
          </Button>
        )
      })}
    </HStack>
  )
}