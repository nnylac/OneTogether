"""SPF — Singapore Police Force simulator (POLARIS schema)"""
import logging
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from models import AgencyID, IncidentTrigger, TicketStatus, utcnow

log = logging.getLogger("spf")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SPF] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

# SPF uses alternate location names (noise)
BEAT_SECTORS = ["NP-D1-B{}", "NP-D2-B{}", "NP-D3-B{}", "NP-D4-B{}", "NP-D5-B{}"]
INCIDENT_CLASSIFICATIONS = {
    "TRAFFIC_ACCIDENT":  ("TRAFFIC",      None),
    "BUILDING_FIRE":     ("SUPPORT",      None),
    "FLOODING":          ("PUBLIC_ORDER", None),
    "MEDICAL_EMERGENCY": ("SUPPORT",      None),
    "GAS_LEAK":          ("PUBLIC_ORDER", None),
    "BUILDING_COLLAPSE": ("PUBLIC_ORDER", None),
    "MISSING_PERSON":    ("MISSING_PERSON", "MISC/2024/001"),
    "DISEASE_OUTBREAK":  ("SUPPORT",      None),
    "HAZE":              ("SUPPORT",      None),
    "CIVIL_DISTURBANCE": ("PUBLIC_ORDER", None),
}
SHIFT_ICS = ["IC/OFF/3421", "IC/OFF/7782", "IC/OFF/1130", "IC/OFF/9905", "IC/OFF/4467"]
ADDRESS_VARIANTS = [
    "Blk {n}",
    "Block {n}",
    "Blk {n} (opp MRT)",
    "{n} (nr junction)",
]
FIELD_OMIT_CHANCE = 0.25


class SPFSimulator(BaseAgencySimulator):
    AGENCY_ID    = AgencyID.SPF
    SYSTEM_ID    = "POLARIS"
    SERVICE_NAME = "spf-simulator"

    def resource_outlets(self) -> list[dict]:
        if hasattr(self, "_resource_outlets"):
            return self._resource_outlets

        self._resource_outlets = [
            {
                "externalOutletId": "SPF-CENTRAL-DIV",
                "name": "Central Police Division",
                "type": "police_station",
                "region": "Central",
                "address": "391 New Bridge Road",
                "location": {"lat": 1.2799, "lng": 103.8391},
                "resources": [
                    self._resource("patrol_car", "Patrol Cars", "vehicle", 32, 22, 8, 1, 1),
                    self._resource("police_officer", "Police Officers", "personnel", 220, 156, 48, 10, 6),
                    self._resource("traffic_unit", "Traffic Units", "specialist_unit", 12, 7, 4, 1, 0),
                ],
            },
            {
                "externalOutletId": "SPF-ANG-MO-KIO-DIV",
                "name": "Ang Mo Kio Police Division",
                "type": "police_station",
                "region": "North-East",
                "address": "51 Ang Mo Kio Avenue 9",
                "location": {"lat": 1.3823, "lng": 103.8449},
                "resources": [
                    self._resource("patrol_car", "Patrol Cars", "vehicle", 28, 19, 7, 1, 1),
                    self._resource("police_officer", "Police Officers", "personnel", 190, 132, 43, 9, 6),
                    self._resource("investigation_team", "Investigation Teams", "crew", 16, 10, 4, 2, 0),
                ],
            },
            {
                "externalOutletId": "SPF-BEDOK-DIV",
                "name": "Bedok Police Division",
                "type": "police_station",
                "region": "East",
                "address": "30 Bedok North Road",
                "location": {"lat": 1.3261, "lng": 103.9322},
                "resources": [
                    self._resource("patrol_car", "Patrol Cars", "vehicle", 30, 21, 6, 2, 1),
                    self._resource("police_officer", "Police Officers", "personnel", 205, 149, 41, 9, 6),
                    self._resource("public_order_team", "Public Order Teams", "crew", 10, 6, 3, 1, 0),
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
        deployment = payload.get("deployment", {})
        classification = payload.get("incident_classification", {})
        outlet_id = self._outlet_for_ticket(ticket["ticket_id"])
        patrol_cars = int(deployment.get("patrol_cars", 0))
        officers = int(deployment.get("officers_deployed", 0))

        self.allocate_resource(ticket["ticket_id"], outlet_id, "patrol_car", patrol_cars)
        self.allocate_resource(ticket["ticket_id"], outlet_id, "police_officer", officers)

        specialist_resource = self._specialist_resource(
            classification.get("category", ""),
        )
        if specialist_resource:
            self.allocate_resource(ticket["ticket_id"], outlet_id, specialist_resource, 1)

    def _outlet_for_ticket(self, ticket_id: str) -> str:
        outlets = [
            "SPF-CENTRAL-DIV",
            "SPF-ANG-MO-KIO-DIV",
            "SPF-BEDOK-DIV",
        ]
        return outlets[sum(ord(char) for char in ticket_id) % len(outlets)]

    def _specialist_resource(self, category: str) -> str | None:
        if category == "TRAFFIC":
            return "traffic_unit"
        if category == "MISSING_PERSON":
            return "investigation_team"
        if category == "PUBLIC_ORDER":
            return "public_order_team"
        return None

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        cat, penal = INCIDENT_CLASSIFICATIONS.get(trigger.incident_type.value, ("SUPPORT", None))
        blk = random.randint(1, 999)
        addr_template = random.choice(ADDRESS_VARIANTS)
        beat = random.choice(BEAT_SECTORS).format(random.randint(1, 20))
        narrative = trigger.description
        if random.random() < FIELD_OMIT_CHANCE:
            narrative = trigger.description.split(".", 1)[0]

        return {
            # SPF calls it report_number, not ticket_id
            "report_number": f"RPT-{utcnow().strftime('%Y%m%d')}-{random.randint(1000,9999)}",
            "polaris_ref": ticket_id,
            "incident_classification": {
                "category": cat,
                "penal_code_ref": penal,
            },
            "location": {
                "beat_sector": beat,
                # deliberate abbreviation / alt-name noise
                "address_verbatim": addr_template.format(n=blk) + f" {trigger.location.area}",
                "lat": trigger.location.lat,
                "lng": trigger.location.lng,
            },
            "deployment": {
                "officers_deployed": random.randint(2, 8),
                "patrol_cars": random.randint(1, 4),
                "shift_ic": random.choice(SHIFT_ICS) if random.random() >= 0.3 else None,
            },
            # narrative grows over time; starts minimal
            "narrative": narrative,
            "priority_flag": (
                "P1" if trigger.severity >= 4 else "P2" if trigger.severity >= 2 else "P3"
            ) if random.random() >= 0.2 else None,
            "inter_agency_refs": [],
        }

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        p["narrative"] = p.get("narrative", "") + f"\n[UPDATE] {note}"
        p["deployment"]["officers_deployed"] = random.randint(2, 12)
        return p


simulator = SPFSimulator()
app = simulator.create_app()
