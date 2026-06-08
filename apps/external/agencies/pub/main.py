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

    def resource_outlets(self) -> list[dict]:
        if hasattr(self, "_resource_outlets"):
            return self._resource_outlets

        self._resource_outlets = [
            {
                "externalOutletId": "PUB-KALLANG-DEPOT",
                "name": "Kallang Drainage Operations Depot",
                "type": "water_operations_depot",
                "region": "Central",
                "address": "Kallang Basin Operations Yard",
                "location": {"lat": 1.3079, "lng": 103.8733},
                "resources": [
                    self._resource("portable_pump", "Portable Pumps", "equipment", 24, 16, 6, 1, 1),
                    self._resource("drainage_crew", "Drainage Crews", "crew", 12, 8, 3, 1, 0),
                    self._resource("flood_barrier", "Flood Barriers", "equipment", 420, 310, 80, 20, 10),
                ],
            },
            {
                "externalOutletId": "PUB-JURONG-DEPOT",
                "name": "Jurong Water Response Depot",
                "type": "water_operations_depot",
                "region": "West",
                "address": "Jurong West Street 23",
                "location": {"lat": 1.3380, "lng": 103.7047},
                "resources": [
                    self._resource("portable_pump", "Portable Pumps", "equipment", 20, 13, 5, 1, 1),
                    self._resource("drainage_crew", "Drainage Crews", "crew", 10, 6, 3, 1, 0),
                    self._resource("water_level_sensor", "Mobile Water-Level Sensors", "equipment", 32, 24, 6, 1, 1),
                ],
            },
            {
                "externalOutletId": "PUB-BEDOK-DEPOT",
                "name": "Bedok Catchment Response Depot",
                "type": "water_operations_depot",
                "region": "East",
                "address": "Bedok Reservoir Road",
                "location": {"lat": 1.3383, "lng": 103.9307},
                "resources": [
                    self._resource("portable_pump", "Portable Pumps", "equipment", 18, 12, 4, 1, 1),
                    self._resource("drainage_crew", "Drainage Crews", "crew", 9, 6, 2, 1, 0),
                    self._resource("flood_barrier", "Flood Barriers", "equipment", 360, 260, 70, 20, 10),
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
        field_response = payload.get("field_response", {})
        outlet_id = self._outlet_for_catchment(payload.get("catchment", "Kallang"))
        pumps = int(field_response.get("portable_pumps", 0))
        barrier_count = max(10, trigger.severity * 20)

        self.allocate_resource(ticket["ticket_id"], outlet_id, "portable_pump", pumps)
        self.allocate_resource(ticket["ticket_id"], outlet_id, "drainage_crew", 1)
        self.allocate_resource(ticket["ticket_id"], outlet_id, "flood_barrier", barrier_count)

    def _outlet_for_catchment(self, catchment: str) -> str:
        if catchment in ("Pandan", "Jurong", "Bukit Timah"):
            return "PUB-JURONG-DEPOT"
        if catchment in ("Bedok", "Punggol"):
            return "PUB-BEDOK-DEPOT"
        return "PUB-KALLANG-DEPOT"

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
