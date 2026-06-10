import { Box, Flex, Text } from "../../../../components/chakra-ui";
import { IncidentKanbanColumn } from "./IncidentKanbanColumn";
import type { Incident, IncidentStatus } from "../types";

export type IncidentKanbanColumnId = "reported" | "in_progress";

type IncidentKanbanBoardProps = {
  incidents: Incident[];
  isLoading: boolean;
};

const columnOrder: IncidentKanbanColumnId[] = ["reported", "in_progress"];

export function IncidentKanbanBoard({
  incidents,
  isLoading,
}: IncidentKanbanBoardProps) {
  const groupedIncidents = groupIncidentsByColumn(incidents);

  return (
    <Box bg="white" borderColor="gray.200" borderWidth="1px" p="4">
      {isLoading ? (
        <Text color="gray.500">Loading incidents...</Text>
      ) : (
        <Flex overflowX="auto" pb="2" w="full">
          {columnOrder.map((columnId, index) => (
            <Box
              key={columnId}
              flex="1"
              minW="0"
              borderLeftWidth={index === 0 ? "0" : "1px"}
              borderColor="gray.200"
            >
              <IncidentKanbanColumn
                columnId={columnId}
                incidents={groupedIncidents[columnId]}
              />
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}

function groupIncidentsByColumn(incidents: Incident[]) {
  const grouped = columnOrder.reduce(
    (accumulator, columnId) => ({
      ...accumulator,
      [columnId]: [] as Incident[],
    }),
    {} as Record<IncidentKanbanColumnId, Incident[]>,
  );

  for (const incident of incidents) {
    if (isResolvedIncidentStatus(incident.status)) {
      continue;
    }

    grouped[getIncidentKanbanColumnId(incident.status)].push(incident);
  }

  for (const columnId of columnOrder) {
    grouped[columnId].sort(compareNewestFirst);
  }

  return grouped;
}

function getIncidentKanbanColumnId(
  status: IncidentStatus,
): IncidentKanbanColumnId {
  if (status === "reported") {
    return "reported";
  }

  return "in_progress";
}

function isResolvedIncidentStatus(status: IncidentStatus) {
  return status === "resolved" || status === "closed";
}

function compareNewestFirst(left: Incident, right: Incident) {
  return getIncidentTime(right) - getIncidentTime(left);
}

function getIncidentTime(incident: Incident) {
  const timestamp = Date.parse(
    incident.updatedAtRaw ?? incident.createdAtRaw ?? incident.updatedAt ?? "",
  );

  return Number.isFinite(timestamp) ? timestamp : 0;
}
