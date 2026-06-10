import { Button, HStack, Text } from "../../../../components/chakra-ui";

export type IncidentOwnershipFilter =
  | "all"
  | "my_organisation"
  | "assigned_to_me";

type IncidentOwnershipFilterOption = {
  count: number;
  disabled?: boolean;
  label: string;
  title?: string;
  value: IncidentOwnershipFilter;
};

type IncidentOwnershipFiltersProps = {
  filters: IncidentOwnershipFilterOption[];
  selectedFilter: IncidentOwnershipFilter;
  onSelectFilter: (filter: IncidentOwnershipFilter) => void;
};

export function IncidentOwnershipFilters({
  filters,
  selectedFilter,
  onSelectFilter,
}: IncidentOwnershipFiltersProps) {
  return (
    <HStack gap="2" wrap="wrap">
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.value;

        return (
          <Button
            key={filter.value}
            bg={isSelected ? "purple.600" : "white"}
            borderColor={isSelected ? "purple.600" : "gray.300"}
            color={isSelected ? "white" : "gray.700"}
            disabled={filter.disabled}
            size="sm"
            title={filter.title}
            variant="outline"
            onClick={() => onSelectFilter(filter.value)}
            _hover={{
              bg: isSelected ? "purple.700" : "purple.50",
              borderColor: isSelected ? "purple.700" : "purple.200",
              color: isSelected ? "white" : "purple.700",
            }}
          >
            {filter.label}
            <Text as="span" color={isSelected ? "purple.100" : "gray.400"}>
              {filter.count}
            </Text>
          </Button>
        );
      })}
    </HStack>
  );
}
