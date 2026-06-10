import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "../../../../components/chakra-ui";
import { fetchResourceSummary } from "../../resources/api/resourcesApi";
import type { ResourceSummary as ApiResourceSummary } from "../../resources/api/resourcesApi";
import { AssignedIncidentTickets } from "../components/AssignedIncidentTickets";
import { DashboardMetricCard } from "../components/DashboardMetricCard";
import { DashboardNotifications } from "../components/DashboardNotifications";
import { ResourceSnapshot } from "../components/ResourceSnapshot";
import type {
  DashboardMetric,
  DashboardNotification,
  ResourceSnapshot as DashboardResourceSnapshot,
} from "../types";
import { fetchIncidents, fetchOrganisations } from "../../incidents/api/incidentsApi";
import type { Incident } from "../../incidents/types";
import { useAuth } from "../../../auth/useAuth";
import type { AuthUser } from "../../../auth/types";
import { fetchResponderNotifications } from "../../notifications/api/responderNotificationsApi";

export function DashboardPage() {
  const { user } = useAuth();
  const [liveResourceSnapshot, setLiveResourceSnapshot] =
    useState<DashboardResourceSnapshot | null>(null);
  const [resourceError, setResourceError] = useState<string | undefined>();
  const [isResourceLoading, setIsResourceLoading] = useState(true);
  const [assignedIncidents, setAssignedIncidents] = useState<Incident[]>([]);
  const [dashboardNotifications, setDashboardNotifications] = useState<
    DashboardNotification[]
  >([]);
  const [organisationId, setOrganisationId] = useState<string | undefined>(
    () => user?.userOrganisationId ?? user?.organisations[0]?.id ?? undefined,
  );
  const assignedOrganisationName =
    user?.organisations[0]?.orgName ?? getFallbackOrganisationName(user);

  useEffect(() => {
    let isMounted = true;

    async function resolveOrganisationId() {
      if (user?.userOrganisationId ?? user?.organisations[0]?.id) {
        setOrganisationId(user.userOrganisationId ?? user.organisations[0]?.id);
        return;
      }

      if (!assignedOrganisationName) {
        setOrganisationId(undefined);
        return;
      }

      const organisations = await fetchOrganisations();
      const resolvedOrganisationId = organisations.find(
        (organisation) =>
          organisation.orgName.toLowerCase() ===
          assignedOrganisationName.toLowerCase(),
      )?.id;

      if (isMounted) {
        setOrganisationId(resolvedOrganisationId);
      }
    }

    void resolveOrganisationId().catch(() => {
      if (isMounted) setOrganisationId(undefined);
    });

    return () => {
      isMounted = false;
    };
  }, [assignedOrganisationName, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadResourceSnapshot() {
      try {
        setResourceError(undefined);
        setIsResourceLoading(true);
        const summary = await fetchResourceSummary();

        if (isMounted) {
          setLiveResourceSnapshot(
            summary.totals.total > 0
              ? mapResourceSummaryToSnapshot(summary)
              : null,
          );
          setResourceError(
            summary.totals.total > 0
              ? undefined
              : "No resource data was pulled from the database.",
          );
        }
      } catch {
        if (isMounted) {
          setLiveResourceSnapshot(null);
          setResourceError("Unable to load resource data from the backend.");
        }
      } finally {
        if (isMounted) {
          setIsResourceLoading(false);
        }
      }
    }

    void loadResourceSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadIncidents() {
      if (!organisationId) {
        if (isMounted) {
          setAssignedIncidents([]);
        }
        return;
      }

      try {
        const nextIncidents = await fetchIncidents({ organisationId });
        if (isMounted) {
          setAssignedIncidents(
            nextIncidents.filter((incident) => !isResolvedIncident(incident)),
          );
        }
      } catch {
        if (isMounted) {
          setAssignedIncidents([]);
        }
      }
    }

    void loadIncidents();
    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!organisationId) {
        if (isMounted) {
          setDashboardNotifications([]);
        }
        return;
      }

      try {
        const notifications = await fetchResponderNotifications(organisationId);
        if (isMounted) {
          setDashboardNotifications(
            notifications.map((notification) => ({
              id: notification.id,
              title: notification.title,
              time: formatRelativeTime(notification.createdAt),
            })),
          );
        }
      } catch {
        if (isMounted) {
          setDashboardNotifications([]);
        }
      }
    }

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  const dashboardMetrics = getDashboardMetrics(
    assignedIncidents,
    liveResourceSnapshot,
    assignedOrganisationName,
  );

  return (
    <Stack gap="6" maxW="1600px">
      <Flex
        justify="space-between"
        align={{ base: "stretch", lg: "end" }}
        gap="4"
        direction={{ base: "column", lg: "row" }}
      >
        <Stack gap="1">
          <Heading size="3xl" color="gray.900">
            SCDF Operations Dashboard
          </Heading>
          <Text color="gray.600">
            Shared incident tickets from source systems and partner
            organisations.
          </Text>
        </Stack>
      </Flex>

      <HStack gap="4" align="stretch" wrap="wrap">
        {dashboardMetrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </HStack>

      <Box
        display="grid"
        gap="6"
        gridTemplateColumns={{ base: "1fr", xl: "3fr 2fr" }}
      >
        <AssignedIncidentTickets incidents={assignedIncidents.slice(0, 3)} />
        <DashboardNotifications notifications={dashboardNotifications} />
      </Box>

      <ResourceSnapshot
        errorMessage={resourceError}
        isLoading={isResourceLoading}
        snapshot={liveResourceSnapshot}
      />
    </Stack>
  );
}

function getDashboardMetrics(
  assignedIncidents: Incident[],
  resourceSnapshot: DashboardResourceSnapshot | null,
  organisationName: string | null,
): DashboardMetric[] {
  const activeIncidents = assignedIncidents.filter(
    (incident) => !isResolvedIncident(incident),
  );
  const reportedIncidents = activeIncidents.filter(
    (incident) => incident.status === "reported",
  );
  const criticalIncidents = activeIncidents.filter(
    (incident) => incident.isCritical,
  );
  const availableResources =
    resourceSnapshot?.progress.find(
      (progress) => progress.label === "Resources available",
    )?.value ?? 0;

  return [
    {
      label: "Active assigned",
      value: activeIncidents.length,
      detail: organisationName ? `visible to ${organisationName}` : "visible to organisation",
    },
    {
      label: "New source tickets",
      value: reportedIncidents.length,
      detail: "reported and awaiting action",
    },
    {
      label: "Critical assigned",
      value: criticalIncidents.length,
      detail: "high priority active tickets",
    },
    {
      label: "Resources available",
      value: availableResources,
      detail: "from resource inventory",
    },
  ];
}

function mapResourceSummaryToSnapshot(
  summary: ApiResourceSummary,
): DashboardResourceSnapshot {
  const availabilityRatio =
    summary.totals.total > 0
      ? summary.totals.available / summary.totals.total
      : 0;

  return {
    progress: [
      {
        label: "Resources available",
        value: summary.totals.available,
        total: summary.totals.total,
        tone: availabilityRatio >= 0.4 ? "green" : "orange",
      },
      {
        label: "Resources deployed",
        value: summary.totals.deployed,
        total: summary.totals.total,
        tone: "orange",
      },
    ],
    counts: [
      {
        label: "Reserved",
        value: summary.totals.reserved,
      },
      {
        label: "Maintenance",
        value: summary.totals.maintenance,
      },
      {
        label: "Critical outlets",
        value: summary.criticalOutlets.length,
      },
    ],
  };
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

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const deltaMs = Date.now() - timestamp;

  if (!Number.isFinite(timestamp) || deltaMs < 0) {
    return "Just now";
  }

  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
