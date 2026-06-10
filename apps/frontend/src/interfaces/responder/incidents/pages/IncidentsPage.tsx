import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
} from "../../../../components/chakra-ui";
import { BackToDashboardLink } from "../../components/BackToDashboardLink";
import { useAuth } from "../../../auth/useAuth";
import { fetchIncidents, fetchOrganisations } from "../api/incidentsApi";
import { IncidentKanbanBoard } from "../components/IncidentKanbanBoard";
import { IncidentStatusBadge } from "../components/IncidentStatusBadge";
import type { AuthUser } from "../../../auth/types";
import type { Incident } from "../types";

type IncidentFilter = "active" | "resolved";

const incidentPollingIntervalMs = 5000;
const pageSize = 6;

const filterLabels: Record<IncidentFilter, string> = {
  active: "Active",
  resolved: "Resolved",
};

function getFilteredIncidents(filter: IncidentFilter, incidents: Incident[]) {
  if (filter === "active") {
    return incidents.filter((incident) => !isResolvedIncident(incident));
  }

  if (filter === "resolved") {
    return incidents.filter(isResolvedIncident);
  }

  return incidents;
}

function isResolvedIncident(incident: Incident) {
  return incident.status === "resolved" || incident.status === "closed";
}

function getFallbackOrganisationName(user: AuthUser | null) {
  const source = `${user?.username ?? ""} ${user?.email ?? ""}`.toLowerCase();

  if (source.includes("scdf") || user?.username === "responder") {
    return "SCDF";
  }
  if (source.includes("spf")) {
    return "SPF";
  }
  if (source.includes("moh")) {
    return "MOH";
  }
  if (source.includes("pub")) {
    return "PUB";
  }
  if (source.includes("lta")) {
    return "LTA";
  }

  return null;
}

export function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IncidentFilter>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const assignedOrganisationName =
    user?.organisations[0]?.orgName ?? getFallbackOrganisationName(user);
  useEffect(() => {
    let isMounted = true;

    async function loadIncidents({
      showLoading = false,
    }: { showLoading?: boolean } = {}) {
      try {
        setError(null);

        if (showLoading) {
          setIsLoading(true);
        }

        const organisations = assignedOrganisationName
          ? await fetchOrganisations()
          : [];
        const organisationId = organisations.find(
          (organisation) =>
            organisation.orgName.toLowerCase() ===
            assignedOrganisationName?.toLowerCase(),
        )?.id;
        const nextIncidents = await fetchIncidents(
          organisationId ? { organisationId } : {},
        );

        if (isMounted) {
          setIncidents(nextIncidents);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load incidents from the backend.");
        }
      } finally {
        if (isMounted && showLoading) {
          setIsLoading(false);
        }
      }
    }

    void loadIncidents({ showLoading: true });
    const pollingId = window.setInterval(() => {
      void loadIncidents();
    }, incidentPollingIntervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(pollingId);
    };
  }, [assignedOrganisationName]);

  const statusFilteredIncidents = useMemo(
    () => getFilteredIncidents(filter, incidents),
    [filter, incidents],
  );
  const sortedFilteredIncidents = useMemo(
    () => [...statusFilteredIncidents].sort(compareNewestFirst),
    [statusFilteredIncidents],
  );
  const pageCount = Math.max(Math.ceil(sortedFilteredIncidents.length / pageSize), 1);
  const pageStart = (page - 1) * pageSize;
  const visibleResolvedIncidents = sortedFilteredIncidents.slice(
    pageStart,
    pageStart + pageSize,
  );

  const counts = {
    active: incidents.filter((incident) => !isResolvedIncident(incident)).length,
    resolved: incidents.filter(isResolvedIncident).length,
  };

  function selectFilter(nextFilter: IncidentFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  return (
    <Stack gap="6">
      <Flex
        justify="space-between"
        align={{ base: "stretch", lg: "end" }}
        gap="4"
        direction={{ base: "column", lg: "row" }}
      >
        <Box>
          <BackToDashboardLink />
          <Heading size="3xl" color="gray.900">
            Incidents
          </Heading>
          <Text color="gray.600" mt="1">
            Select an incident to view more details
          </Text>
        </Box>

        <HStack gap="2" wrap="wrap">
          {(Object.keys(filterLabels) as IncidentFilter[]).map((filterKey) => {
            const isSelected = filter === filterKey;

            return (
              <Button
                key={filterKey}
                variant={isSelected ? "solid" : "outline"}
                bg={isSelected ? "gray.900" : "white"}
                color={isSelected ? "white" : "gray.700"}
                borderColor="gray.300"
                _hover={{ bg: isSelected ? "gray.800" : "gray.50" }}
                onClick={() => selectFilter(filterKey)}
              >
                {filterLabels[filterKey]} ({counts[filterKey]})
              </Button>
            );
          })}
        </HStack>
      </Flex>

      {error && (
        <Box
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          color="red.700"
          p="4"
        >
          <Text fontWeight="700">{error}</Text>
        </Box>
      )}

      {filter === "resolved" ? (
        <ResolvedIncidentArchive
          incidents={visibleResolvedIncidents}
          isLoading={isLoading}
        />
      ) : (
        <IncidentKanbanBoard
          incidents={sortedFilteredIncidents}
          isLoading={isLoading}
        />
      )}

      <Flex justify="space-between" align="center" gap="4" wrap="wrap">
        <Text color="gray.500" fontSize="sm">
          Showing {sortedFilteredIncidents.length} of {incidents.length} incidents
        </Text>
        {filter === "resolved" ? (
          <HStack gap="2">
            <Button
              variant="outline"
              borderColor="gray.300"
              disabled={page === 1}
              onClick={() =>
                setPage((currentPage) => Math.max(currentPage - 1, 1))
              }
            >
              <Icon as={ChevronLeft} />
              Previous
            </Button>

            <Text color="gray.700" fontWeight="700" minW="16" textAlign="center">
              {page} / {pageCount}
            </Text>

            <Button
              variant="outline"
              borderColor="gray.300"
              disabled={page === pageCount}
              onClick={() =>
                setPage((currentPage) => Math.min(currentPage + 1, pageCount))
              }
            >
              Next
              <Icon as={ChevronRight} />
            </Button>
          </HStack>
        ) : (
          <Text color="gray.400" fontSize="xs">
            Active tickets are grouped into Reported and In Progress.
          </Text>
        )}
      </Flex>
    </Stack>
  );
}

function ResolvedIncidentArchive({
  incidents,
  isLoading,
}: {
  incidents: Incident[];
  isLoading: boolean;
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" overflowX="auto">
      <Box
        as="table"
        width="100%"
        borderCollapse="collapse"
        tableLayout="fixed"
        minW="900px"
      >
        <Box as="colgroup">
          <Box as="col" width="51%" />
          <Box as="col" width="16%" />
          <Box as="col" width="18%" />
          <Box as="col" width="15%" />
        </Box>

        <Box as="thead" bg="gray.50">
          <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
            <HeaderCell>Incident</HeaderCell>
            <HeaderCell textAlign="center">Status</HeaderCell>
            <HeaderCell>Date</HeaderCell>
            <HeaderCell textAlign="right">Open room</HeaderCell>
          </Box>
        </Box>

        <Box as="tbody">
          {isLoading && (
            <Box as="tr">
              <td colSpan={4}>
                <Box px="5" py="6">
                  <Text color="gray.500">Loading incidents...</Text>
                </Box>
              </td>
            </Box>
          )}

          {!isLoading && incidents.length === 0 && (
            <Box as="tr">
              <td colSpan={4}>
                <Box px="5" py="6">
                  <Text color="gray.500">No resolved incidents found.</Text>
                </Box>
              </td>
            </Box>
          )}

          {!isLoading &&
            incidents.map((incident) => (
              <Box
                key={incident.id}
                as="tr"
                borderBottomWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: "gray.50" }}
              >
                <BodyCell>
                  <VStack gap="1" align="stretch">
                    <Text color="gray.900" fontSize="lg" fontWeight="700">
                      {incident.title}
                    </Text>
                    <Text color="gray.500" fontSize="sm" fontWeight="700">
                      {incident.location}
                    </Text>
                    <Text
                      color="gray.500"
                      display="-webkit-box"
                      fontSize="sm"
                      overflow="hidden"
                      style={{
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {incident.description}
                    </Text>
                  </VStack>
                </BodyCell>

                <BodyCell textAlign="center">
                  <IncidentStatusBadge status={incident.status} />
                </BodyCell>

                <BodyCell>
                  <Text color="gray.600">{incident.updatedAt ?? incident.date}</Text>
                </BodyCell>

                <BodyCell textAlign="right">
                  <Button
                    asChild
                    bg="gray.900"
                    color="white"
                    minW="28"
                    _hover={{ bg: "gray.800" }}
                  >
                    <Link to={`/responder/incidents/${incident.id}/room`}>
                      <Icon as={ExternalLink} />
                      Open room
                    </Link>
                  </Button>
                </BodyCell>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
}

function HeaderCell({
  children,
  textAlign = "left",
}: {
  children: ReactNode;
  textAlign?: "left" | "center" | "right";
}) {
  return (
    <Box
      as="th"
      color="gray.500"
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0"
      px={textAlign === "right" ? "3" : "5"}
      py="3"
      textAlign={textAlign}
      textTransform="uppercase"
    >
      {children}
    </Box>
  );
}

function BodyCell({
  children,
  textAlign = "left",
}: {
  children: ReactNode;
  textAlign?: "left" | "center" | "right";
}) {
  return (
    <Box
      as="td"
      px={textAlign === "right" ? "3" : "5"}
      py="4"
      textAlign={textAlign}
      verticalAlign="middle"
    >
      {children}
    </Box>
  );
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
