import { LabelBox } from "../../../../components/ui/LabelBox";
import type { LabelBoxTone } from "../../../../components/ui/LabelBox";
import type { IncidentStatus } from "../types";

const statusTones: Record<IncidentStatus, LabelBoxTone> = {
  reported: "yellow",
  triage: "orange",
  responding: "blue",
  on_scene: "purple",
  stabilising: "red",
  monitoring: "yellow",
  resolved: "green",
  closed: "gray",
};

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <LabelBox tone={statusTones[status]} minW="36">
      {status.replace(/_/g, " ")}
    </LabelBox>
  );
}
