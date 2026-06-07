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
}
SHIFT_ICS = ["IC/OFF/3421", "IC/OFF/7782", "IC/OFF/1130", "IC/OFF/9905", "IC/OFF/4467"]
ADDRESS_VARIANTS = [
    "Blk {n}",
    "Block {n}",
    "Blk {n} (opp MRT)",
    "{n} (nr junction)",
]


class SPFSimulator(BaseAgencySimulator):
    AGENCY_ID    = AgencyID.SPF
    SYSTEM_ID    = "POLARIS"
    SERVICE_NAME = "spf-simulator"

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        cat, penal = INCIDENT_CLASSIFICATIONS.get(trigger.incident_type.value, ("SUPPORT", None))
        blk = random.randint(1, 999)
        addr_template = random.choice(ADDRESS_VARIANTS)
        beat = random.choice(BEAT_SECTORS).format(random.randint(1, 20))

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
                "lat": trigger.location.lat + random.uniform(-0.0002, 0.0002),
                "lng": trigger.location.lng + random.uniform(-0.0002, 0.0002),
            },
            "deployment": {
                "officers_deployed": random.randint(2, 8),
                "patrol_cars": random.randint(1, 4),
                "shift_ic": random.choice(SHIFT_ICS),
            },
            # narrative grows over time; starts minimal
            "narrative": trigger.description,
            "priority_flag": "P1" if trigger.severity >= 4 else "P2" if trigger.severity >= 2 else "P3",
            "inter_agency_refs": [],
        }

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        p["narrative"] = p.get("narrative", "") + f"\n[UPDATE] {note}"
        p["deployment"]["officers_deployed"] = random.randint(2, 12)
        return p


simulator = SPFSimulator()
app = simulator.create_app()
