"""PUB simulator (WATERGRID schema)."""
import logging
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from models import AgencyID, IncidentTrigger, TicketStatus, utcnow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PUB] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

DRAINAGE_CATCHMENTS = ["Kallang", "Bukit Timah", "Pandan", "Bedok", "Punggol", "Jurong"]
PUMP_TEAMS = ["DTF-A", "DTF-B", "DTF-C", "CANAL-OPS", "FIELD-HYDRO"]


class PUBSimulator(BaseAgencySimulator):
    AGENCY_ID = AgencyID.PUB
    SYSTEM_ID = "WATERGRID"
    SERVICE_NAME = "pub-simulator"

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        water_level = round(random.uniform(0.2, 1.8) + (trigger.severity * 0.18), 2)
        return {
            "case_number": f"PUB-FLD-{utcnow().strftime('%Y%m%d')}-{random.randint(100,999)}",
            "watergrid_ref": ticket_id,
            "incident_category": "FLASH_FLOOD" if trigger.severity >= 3 else "LOCAL_PONDING",
            "catchment": random.choice(DRAINAGE_CATCHMENTS),
            "site": {
                "reported_location": trigger.location.name,
                "nearest_canal_or_drain": f"{trigger.location.area} Drainage Line {random.randint(1, 9)}",
                "lat": trigger.location.lat,
                "lng": trigger.location.lng,
            },
            "hydrology": {
                "water_level_m": water_level,
                "rainfall_mm_last_hour": random.randint(20, 110),
                "tide_risk": random.choice(["LOW", "MEDIUM", "HIGH"]),
            },
            "field_response": {
                "pump_team": random.choice(PUMP_TEAMS),
                "portable_pumps": random.randint(0, 4),
                "drainage_crew_eta_mins": random.randint(8, 35),
            },
            "notifications": {
                "town_council_notified": True,
                "scdf_rescue_support_required": trigger.severity >= 3,
            },
            "operations_log": [
                {
                    "ts": utcnow().isoformat(),
                    "entry": f"PUB drainage case opened. {trigger.description}",
                }
            ],
        }

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        hydrology = p.get("hydrology", {})
        hydrology["water_level_m"] = max(0, round(hydrology.get("water_level_m", 1.0) - random.uniform(0.05, 0.35), 2))
        p["hydrology"] = hydrology
        p.setdefault("operations_log", []).append({"ts": utcnow().isoformat(), "entry": note})
        return p


simulator = PUBSimulator()
app = simulator.create_app()
