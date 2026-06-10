import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
} from "../../../../components/chakra-ui";
import type { Incident, IncidentSeverity, IncidentStatus } from "../types";

type IncidentKanbanCardProps = {
  incident: Incident;
};

const severityStyles: Record<
  IncidentSeverity,
  { bg: string; borderColor: string; color: string }
> = {
  Critical: { bg: "red.500", borderColor: "red.500", color: "white" },
  High: { bg: "orange.50", borderColor: "orange.200", color: "orange.700" },
  Low: { bg: "green.50", borderColor: "green.200", color: "green.700" },
  Medium: { bg: "yellow.50", borderColor: "yellow.200", color: "yellow.800" },
};

const statusStyles: Record<
  IncidentStatus,
  { bg: string; borderColor: string; color: string; label: string }
> = {
  closed: {
    bg: "gray.100",
    borderColor: "gray.200",
    color: "gray.700",
    label: "Closed",
  },
  monitoring: {
    bg: "yellow.50",
    borderColor: "yellow.200",
    color: "yellow.800",
    label: "Monitoring",
  },
  on_scene: {
    bg: "purple.50",
    borderColor: "purple.200",
    color: "purple.700",
    label: "On Scene",
  },
  reported: {
    bg: "yellow.50",
    borderColor: "yellow.200",
    color: "yellow.800",
    label: "Reported",
  },
  responding: {
    bg: "blue.50",
    borderColor: "blue.200",
    color: "blue.700",
    label: "Responding",
  },
  resolved: {
    bg: "green.50",
    borderColor: "green.200",
    color: "green.700",
    label: "Resolved",
  },
  stabilising: {
    bg: "red.50",
    borderColor: "red.200",
    color: "red.700",
    label: "Stabilising",
  },
  triage: {
    bg: "orange.50",
    borderColor: "orange.200",
    color: "orange.700",
    label: "Triage",
  },
};

export function IncidentKanbanCard({
  incident,
}: IncidentKanbanCardProps) {
  return (
    <Box
      bg="white"
      borderColor="gray.200"
      borderWidth="1px"
      p="4"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      _hover={{ borderColor: "purple.300", boxShadow: "xs" }}
    >
      <Stack gap="4">
        <Flex align="flex-start" justify="space-between" gap="4">
          <Text color="gray.500" fontSize="xs" fontWeight="600">
            {incident.incidentCode ?? incident.id.slice(0, 8)}
          </Text>
          <HStack gap="2" flexShrink="0">
            {incident.severity && (
              <CompactPill
                label={incident.severity}
                styles={severityStyles[incident.severity]}
              />
            )}
            <CompactPill
              label={statusStyles[incident.status].label}
              styles={statusStyles[incident.status]}
            />
          </HStack>
        </Flex>

        <Text
          color="gray.900"
          fontSize="sm"
          fontWeight="900"
          lineClamp="3"
          lineHeight="1.15"
        >
          {incident.title}
        </Text>

        <Flex align="stretch" justify="space-between" gap="4" w="full">
          <Text
            color="gray.500"
            fontSize="xs"
            fontWeight="700"
            flexShrink="0"
            alignSelf="flex-end"
          >
            {incident.updatedAt ?? incident.date}
          </Text>

          <HStack
            gap="2"
            justify="flex-end"
            minW="0"
            flex="1"
            alignSelf="flex-end"
            align="center"
          >
            <Button
              asChild
              bg="blue.900"
              color="white"
              flexShrink="0"
              px="3"
              size="xs"
              _hover={{ bg: "blue.800" }}
            >
              <Link to={`/responder/incidents/${incident.id}/room`}>
                <Icon as={ExternalLink} boxSize="2.5" />
                Open Room
              </Link>
            </Button>
          </HStack>
        </Flex>
      </Stack>
    </Box>
  );
}

function CompactPill({
  label,
  styles,
}: {
  label: string;
  styles: { bg: string; borderColor: string; color: string };
}) {
  return (
    <Badge
      bg={styles.bg}
      borderColor={styles.borderColor}
      borderWidth="1px"
      color={styles.color}
      fontSize="2xs"
      lineHeight="1"
      px="2"
      py="1"
    >
      {label}
    </Badge>
  );
}
