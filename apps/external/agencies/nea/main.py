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
}


class NEASimulator(BaseAgencySimulator):
    AGENCY_ID = AgencyID.NEA
    SYSTEM_ID = "ENVHEALTH"
    SERVICE_NAME = "nea-simulator"

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
                "mosquito_breeding_risk": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "food_or_sanitation_risk": random.choice(["LOW", "MEDIUM", "HIGH", None]),
            },
            "field_action": {
                "team": random.choice(VECTOR_TEAMS),
                "inspection_eta_mins": random.randint(20, 90),
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
