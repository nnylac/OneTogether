"""Town Council simulator (TCOMS schema)"""
import logging
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from models import AgencyID, IncidentTrigger, TicketStatus, utcnow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [TOWNCOUNCIL] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

TOWN_COUNCILS = [
    ("TPE", "Tampines"), ("AMK", "Ang Mo Kio"), ("BDK", "Bedok"),
    ("JRG", "Jurong"), ("WDL", "Woodlands"), ("YSN", "Yishun"),
    ("SRG", "Serangoon"), ("CLM", "Clementi"), ("BKT", "Bukit Timah"),
]
CATEGORIES = {
    "FLOODING":          "FLOOD",
    "BUILDING_COLLAPSE": "STRUCTURAL",
    "BUILDING_FIRE":     "STRUCTURAL",
    "GAS_LEAK":          "ELECTRICAL",
    "TRAFFIC_ACCIDENT":  "GENERAL",
    "MEDICAL_EMERGENCY": "GENERAL",
    "MISSING_PERSON":    "GENERAL",
    "DISEASE_OUTBREAK":  "GENERAL",
}
# Street name abbreviations (alt-name noise)
STREET_ABBREVS = ["Ave", "Rd", "St", "Dr", "Cres", "Pl", "Walk", "Ctrl"]
CHECKLIST_ITEMS = [
    "Site cordoned off",
    "Affected residents notified",
    "Drainage inspection done",
    "Temporary barriers placed",
    "Contractor on-site",
    "Structural assessment commissioned",
    "Post-incident report filed",
]


class TownCouncilSimulator(BaseAgencySimulator):
    AGENCY_ID    = AgencyID.TOWN_COUNCIL
    SYSTEM_ID    = "TCOMS"
    SERVICE_NAME = "towncouncil-simulator"

    def resource_outlets(self) -> list[dict]:
        if hasattr(self, "_resource_outlets"):
            return self._resource_outlets

        self._resource_outlets = [
            {
                "externalOutletId": "TC-AMK-OPS",
                "name": "Ang Mo Kio Town Council Operations Centre",
                "type": "municipal_operations_centre",
                "region": "North-East",
                "address": "Ang Mo Kio Avenue 3",
                "location": {"lat": 1.3691, "lng": 103.8454},
                "resources": [
                    self._resource("maintenance_crew", "Maintenance Crews", "crew", 18, 12, 4, 1, 1),
                    self._resource("portable_pump", "Portable Pumps", "equipment", 10, 7, 2, 0, 1),
                    self._resource("temporary_barrier", "Temporary Barriers", "equipment", 260, 190, 45, 15, 10),
                ],
            },
            {
                "externalOutletId": "TC-TPE-OPS",
                "name": "Tampines Town Council Operations Centre",
                "type": "municipal_operations_centre",
                "region": "East",
                "address": "Tampines Street 11",
                "location": {"lat": 1.3450, "lng": 103.9440},
                "resources": [
                    self._resource("maintenance_crew", "Maintenance Crews", "crew", 16, 10, 4, 1, 1),
                    self._resource("contractor_team", "Contractor Teams", "crew", 12, 8, 3, 1, 0),
                    self._resource("temporary_barrier", "Temporary Barriers", "equipment", 240, 172, 48, 12, 8),
                ],
            },
            {
                "externalOutletId": "TC-JRG-OPS",
                "name": "Jurong Town Council Operations Centre",
                "type": "municipal_operations_centre",
                "region": "West",
                "address": "Jurong East Street 21",
                "location": {"lat": 1.3331, "lng": 103.7421},
                "resources": [
                    self._resource("maintenance_crew", "Maintenance Crews", "crew", 17, 11, 4, 1, 1),
                    self._resource("portable_pump", "Portable Pumps", "equipment", 9, 6, 2, 0, 1),
                    self._resource("contractor_team", "Contractor Teams", "crew", 13, 9, 3, 1, 0),
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
        deployed = payload.get("resources_deployed", {})
        outlet_id = self._outlet_for_town(site.get("town", "Ang Mo Kio"))

        self.allocate_resource(
            ticket["ticket_id"],
            outlet_id,
            "maintenance_crew",
            int(deployed.get("maintenance_crews", 1)),
        )
        self.allocate_resource(
            ticket["ticket_id"],
            outlet_id,
            "portable_pump",
            int(deployed.get("water_pumps", 0)),
        )
        self.allocate_resource(
            ticket["ticket_id"],
            outlet_id,
            "temporary_barrier",
            int(deployed.get("barriers_placed", 0)),
        )

        if payload.get("contractor_assigned"):
            self.allocate_resource(ticket["ticket_id"], outlet_id, "contractor_team", 1)

    def _outlet_for_town(self, town: str) -> str:
        normalized = town.lower()
        if "tampines" in normalized or "bedok" in normalized:
            return "TC-TPE-OPS"
        if "jurong" in normalized or "clementi" in normalized or "bukit" in normalized:
            return "TC-JRG-OPS"
        return "TC-AMK-OPS"

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        tc_code, tc_name = random.choice(TOWN_COUNCILS)
        category         = CATEGORIES.get(trigger.incident_type.value, "GENERAL")
        street_abbrev    = random.choice(STREET_ABBREVS)
        block_no         = random.randint(1, 999)

        # Checklist: some items randomly incomplete (noise)
        n_items = random.randint(3, len(CHECKLIST_ITEMS))
        checklist = [
            {"item": item, "completed": random.random() > 0.6}
            for item in random.sample(CHECKLIST_ITEMS, n_items)
        ]

        include_advisory = random.random() > 0.4
        payload = {
            # TC uses work_order_id with town code
            "work_order_id": f"TC-{tc_code}-{utcnow().strftime('%Y%m%d')}-{random.randint(1,99):02d}",
            "tcoms_ref": ticket_id,
            "town_council_name": f"{tc_name} Town Council",
            "category": category,
            "site": {
                "block_number": str(block_no),
                # alt-name noise: different abbrev styles per TC
                "street_name": f"{trigger.location.area} {street_abbrev} {random.randint(1,20)}",
                "town": trigger.location.area,
                "lat": trigger.location.lat,
                "lng": trigger.location.lng,
            },
            "contractor_assigned": f"SG-BUILD-{random.randint(100,999)}" if random.random() > 0.5 else None,
            "resources_deployed": {
                "maintenance_crews": random.randint(1, 5),
                "water_pumps": random.randint(0, 3) if category == "FLOOD" else 0,
                "barriers_placed": random.randint(0, 10),
            },
            "public_advisory_issued": include_advisory,
            # advisory_text often missing in early stages
            "advisory_text": (
                f"Residents are advised to avoid the area near {trigger.location.name} due to ongoing {category.lower()} works."
                if include_advisory else None
            ),
            "completion_checklist": checklist,
            "resident_complaints": random.randint(0, 5),
        }
        return payload

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        # Complaints grow over time
        p["resident_complaints"] = p.get("resident_complaints", 0) + random.randint(0, 4)
        # Mark more checklist items complete
        for item in p.get("completion_checklist", []):
            if not item["completed"] and random.random() > 0.5:
                item["completed"] = True
        return p


simulator = TownCouncilSimulator()
app = simulator.create_app()
