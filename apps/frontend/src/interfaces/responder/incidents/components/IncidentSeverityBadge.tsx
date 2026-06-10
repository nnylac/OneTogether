import { LabelBox } from "../../../../components/ui/LabelBox";
import type { LabelBoxTone } from "../../../../components/ui/LabelBox";
import type { IncidentSeverity } from "../types";

const severityTones: Record<IncidentSeverity, LabelBoxTone> = {
  Critical: "red",
  High: "orange",
  Medium: "yellow",
  Low: "green",
};

export function IncidentSeverityBadge({
  severity,
}: {
  severity: IncidentSeverity;
}) {
  return (
    <LabelBox tone={severityTones[severity]} minW="24">
      {severity}
    </LabelBox>
  );
}
