import { Box, Flex, Stack, Text } from "../../../../components/chakra-ui";
import { IncidentKanbanCard } from "./IncidentKanbanCard";
import type { Incident } from "../types";
import type { IncidentKanbanColumnId } from "./IncidentKanbanBoard";

type IncidentKanbanColumnProps = {
  columnId: IncidentKanbanColumnId;
  incidents: Incident[];
  isFromMyOrganisation: (incident: Incident) => boolean;
  isMyOrganisation: (incident: Incident) => boolean;
};

const statusStyles: Record<
  IncidentKanbanColumnId,
  { dotColor: string; label: string }
> = {
  in_progress: {
    dotColor: "purple.500",
    label: "In Progress",
  },
  reported: {
    dotColor: "yellow.500",
    label: "Reported",
  },
};

export function IncidentKanbanColumn({
  columnId,
  incidents,
  isFromMyOrganisation,
  isMyOrganisation,
}: IncidentKanbanColumnProps) {
  const styles = statusStyles[columnId];

  return (
    <Box
      bg="gray.50"
      flex="0 0 22rem"
      minH="24rem"
      p="3"
    >
      <Flex align="center" justify="space-between" gap="3" mb="3">
        <Flex align="center" gap="2">
          <Box bg={styles.dotColor} h="2.5" w="2.5" />
          <Text color="gray.900" fontSize="sm" fontWeight="900">
            {styles.label}
          </Text>
        </Flex>
        <Text color="gray.500" fontSize="sm" fontWeight="800">
          {incidents.length}
        </Text>
      </Flex>

      {incidents.length === 0 ? (
        <Box
          alignItems="center"
          bg="white"
          borderColor="gray.200"
          borderStyle="dashed"
          borderWidth="1px"
          display="flex"
          justifyContent="center"
          minH="32"
          px="4"
          py="8"
        >
          <Text color="gray.500" fontSize="sm">
            No incidents
          </Text>
        </Box>
      ) : (
        <Stack gap="3">
          {incidents.map((incident) => (
            <IncidentKanbanCard
              key={incident.id}
              incident={incident}
              isFromMyOrganisation={isFromMyOrganisation(incident)}
              isMyOrganisation={isMyOrganisation(incident)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
