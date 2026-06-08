"""NEA simulator (ENVHEALTH schema)."""
import logging
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from models import AgencyID, IncidentTrigger, TicketStatus, utcnow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [NEA] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

VECTOR_TEAMS = ["VCO-N", "VCO-S", "VCO-E", "VCO-W", "VCO-C"]
INSPECTION_TYPES = {
    "DISEASE_OUTBREAK": "VECTOR_OR_ENV_HEALTH_INVESTIGATION",
    "FLOODING": "POST_FLOOD_SANITATION_RISK",
    "GAS_LEAK": "ENVIRONMENTAL_SAFETY_SUPPORT",
    "BUILDING_COLLAPSE": "DEBRIS_AND_SANITATION_RISK",
    "HAZE": "AIR_QUALITY_RESPONSE",
    "CIVIL_DISTURBANCE": "ENVIRONMENTAL_HEALTH_SUPPORT",
}
FIELD_OMIT_CHANCE = 0.25


class NEASimulator(BaseAgencySimulator):
    AGENCY_ID = AgencyID.NEA
    SYSTEM_ID = "ENVHEALTH"
    SERVICE_NAME = "nea-simulator"

    def resource_outlets(self) -> list[dict]:
        if hasattr(self, "_resource_outlets"):
            return self._resource_outlets

        self._resource_outlets = [
            {
                "externalOutletId": "NEA-CENTRAL-FIELD",
                "name": "Central Environmental Health Field Office",
                "type": "environmental_health_office",
                "region": "Central",
                "address": "40 Scotts Road",
                "location": {"lat": 1.3108, "lng": 103.8346},
                "resources": [
                    self._resource("inspection_team", "Inspection Teams", "crew", 14, 9, 4, 1, 0),
                    self._resource("vector_control_team", "Vector Control Teams", "crew", 10, 6, 3, 1, 0),
                    self._resource("fogging_unit", "Fogging Units", "equipment", 16, 11, 4, 0, 1),
                ],
            },
            {
                "externalOutletId": "NEA-EAST-FIELD",
                "name": "East Environmental Health Field Office",
                "type": "environmental_health_office",
                "region": "East",
                "address": "Changi Environmental Operations Centre",
                "location": {"lat": 1.3470, "lng": 103.9566},
                "resources": [
                    self._resource("inspection_team", "Inspection Teams", "crew", 12, 8, 3, 1, 0),
                    self._resource("vector_control_team", "Vector Control Teams", "crew", 9, 5, 3, 1, 0),
                    self._resource("sampling_kit", "Environmental Sampling Kits", "equipment", 34, 25, 7, 1, 1),
                ],
            },
            {
                "externalOutletId": "NEA-WEST-FIELD",
                "name": "West Environmental Health Field Office",
                "type": "environmental_health_office",
                "region": "West",
                "address": "Jurong Environmental Operations Centre",
                "location": {"lat": 1.3328, "lng": 103.7435},
                "resources": [
                    self._resource("inspection_team", "Inspection Teams", "crew", 13, 8, 4, 1, 0),
                    self._resource("vector_control_team", "Vector Control Teams", "crew", 11, 7, 3, 1, 0),
                    self._resource("fogging_unit", "Fogging Units", "equipment", 15, 10, 4, 0, 1),
                ],
            },
        ]
        return self._resource_outlets

    def _resource(self, resource_id: str, name: str, category: str, total: int, available: int, deployed: int, reserved: int, maintenance: int) -> dict:
        return {
            "externalResourceId": resource_id,
            "name": name,
            "category": category,
            "unit": "count",
            "total": total,
            "available": available,
            "deployed": deployed,
            "reserved": reserved,
            "maintenance": maintenance,
        }

    def apply_resource_deployment(self, ticket: dict, trigger: IncidentTrigger):
        payload = ticket["payload"]
        site = payload.get("site", {})
        field_action = payload.get("field_action", {})
        outlet_id = self._outlet_for_region(site.get("planning_area", "Central"))

        self.allocate_resource(ticket["ticket_id"], outlet_id, "inspection_team", 1)

        if field_action.get("fogging_or_larviciding_required"):
            self.allocate_resource(ticket["ticket_id"], outlet_id, "vector_control_team", 1)
            self.allocate_resource(ticket["ticket_id"], outlet_id, "fogging_unit", 1)
        elif trigger.severity >= 3:
            self.allocate_resource(ticket["ticket_id"], outlet_id, "sampling_kit", 2)

    def _outlet_for_region(self, region: str) -> str:
        normalized = region.lower()
        if "east" in normalized or "tampines" in normalized or "bedok" in normalized:
            return "NEA-EAST-FIELD"
        if "west" in normalized or "jurong" in normalized or "clementi" in normalized:
            return "NEA-WEST-FIELD"
        return "NEA-CENTRAL-FIELD"

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        inspection_type = INSPECTION_TYPES.get(trigger.incident_type.value, "ENVIRONMENTAL_HEALTH_SUPPORT")
        return {
            "inspection_id": f"NEA-{utcnow().strftime('%Y%m%d')}-{random.randint(1000,9999)}",
            "envhealth_ref": ticket_id,
            "inspection_type": inspection_type,
            "site": {
                "location_name": trigger.location.name,
                "planning_area": trigger.location.area,
                "lat": trigger.location.lat,
                "lng": trigger.location.lng,
            },
            "risk_assessment": {
                "public_health_risk": "HIGH" if trigger.severity >= 4 else "MEDIUM" if trigger.severity >= 2 else "LOW",
                "mosquito_breeding_risk": (
                    random.choice(["LOW", "MEDIUM", "HIGH"])
                    if random.random() >= 0.25 else None
                ),
                "food_or_sanitation_risk": random.choice(["LOW", "MEDIUM", "HIGH", None]),
            },
            "field_action": {
                "team": random.choice(VECTOR_TEAMS),
                "inspection_eta_mins": (
                    random.randint(20, 90) if random.random() >= 0.2 else None
                ),
                "fogging_or_larviciding_required": trigger.incident_type.value == "DISEASE_OUTBREAK" and random.random() > 0.35,
                "town_council_follow_up_required": random.random() > 0.25,
            },
            "case_notes": [
                {
                    "ts": utcnow().isoformat(),
                    "entry": f"NEA environmental health case opened. {trigger.description}",
                }
            ],
        }

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        risk = p.get("risk_assessment", {})
        if status == TicketStatus.RESOLVED:
            risk["public_health_risk"] = random.choice(["LOW", "MEDIUM"])
        p["risk_assessment"] = risk
        p.setdefault("case_notes", []).append({"ts": utcnow().isoformat(), "entry": note})
        return p


simulator = NEASimulator()
app = simulator.create_app()
