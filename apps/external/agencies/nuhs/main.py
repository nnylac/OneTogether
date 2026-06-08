"""NUHS simulator (NUCLEUS schema)."""
import asyncio
import logging
import os
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from hospital_routing import capacity_snapshot, choose_transfer_target, get_hospital, hospitals_for_cluster
from models import AgencyID, IncidentTrigger, TicketStatus, new_id, utcnow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [NUHS] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("nuhs")

OP_STATUSES = ["NORMAL", "SURGE", "CRITICAL_SURGE", "DIVERTED"]
AUTHOR_ROLES = ["DUTY_DOCTOR", "CHARGE_NURSE", "OPERATIONS_COORDINATOR", "ED_CONSULTANT"]
CLUSTER_URLS = {
    AgencyID.SINGHEALTH: os.getenv("SINGHEALTH_URL", "http://singhealth:8000"),
    AgencyID.NUHS: os.getenv("NUHS_URL", "http://nuhs:8000"),
}
FIELD_OMIT_CHANCE = 0.25


class NUHSSimulator(BaseAgencySimulator):
    AGENCY_ID = AgencyID.NUHS
    SYSTEM_ID = "NUCLEUS"
    SERVICE_NAME = "nuhs-simulator"

    def resource_outlets(self) -> list[dict]:
        if hasattr(self, "_resource_outlets"):
            return self._resource_outlets

        self._resource_outlets = [
            self._hospital_outlet("NUH", "National University Hospital", "West", "5 Lower Kent Ridge Road", 1.2937, 103.7831, 68, 41, 19, 4, 4, 13, 7, 4, 1, 1, 156, 108, 34, 9, 5),
            self._hospital_outlet("NTFGH", "Ng Teng Fong General Hospital", "West", "1 Jurong East Street 21", 1.3333, 103.7458, 55, 34, 15, 3, 3, 8, 5, 2, 0, 1, 128, 91, 27, 6, 4),
        ]
        return self._resource_outlets

    def _hospital_outlet(
        self,
        code: str,
        name: str,
        region: str,
        address: str,
        lat: float,
        lng: float,
        beds_total: int,
        beds_available: int,
        beds_deployed: int,
        beds_reserved: int,
        beds_maintenance: int,
        icu_total: int,
        icu_available: int,
        icu_deployed: int,
        icu_reserved: int,
        icu_maintenance: int,
        nurses_total: int,
        nurses_available: int,
        nurses_deployed: int,
        nurses_reserved: int,
        nurses_maintenance: int,
    ) -> dict:
        payload = {
            "externalOutletId": f"NUHS-{code}",
            "name": name,
            "type": "hospital",
            "region": region,
            "address": address,
            "location": {"lat": lat, "lng": lng},
            "resources": [
                self._resource("ed_bed", "Emergency Beds", "bed", beds_total, beds_available, beds_deployed, beds_reserved, beds_maintenance),
                self._resource("icu_bed", "ICU Beds", "bed", icu_total, icu_available, icu_deployed, icu_reserved, icu_maintenance),
                self._resource("nurse_on_duty", "Nurses On Duty", "personnel", nurses_total, nurses_available, nurses_deployed, nurses_reserved, nurses_maintenance),
            ],
        }

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
        outlet_id = f"NUHS-{payload.get('primary_site', 'NUH')}"
        handoff = payload.get("patient_handoff", {})
        triage = handoff.get("triage", {})
        staffing = payload.get("staffing", {})
        patient_count = int(handoff.get("patient_count", 1))
        icu_count = int(triage.get("P1", 0))
        nurse_count = max(2, min(int(staffing.get("on_duty_nurses", 8)), patient_count * 3))

        self.allocate_resource(ticket["ticket_id"], outlet_id, "ed_bed", patient_count)
        self.allocate_resource(ticket["ticket_id"], outlet_id, "icu_bed", icu_count)
        self.allocate_resource(ticket["ticket_id"], outlet_id, "nurse_on_duty", nurse_count)

    def create_app(self):
        app = super().create_app()

        @app.post("/handoff", status_code=202)
        async def receive_handoff(trigger: IncidentTrigger):
            asyncio.create_task(self._handle_incident(trigger))
            return {
                "accepted": True,
                "cluster": self.AGENCY_ID.value,
                "incident_id": trigger.incident_id,
                "handoff_id": trigger.metadata.get("handoff", {}).get("handoff_id"),
            }

        return app

    async def _handle_incident(self, trigger: IncidentTrigger):
        await super()._handle_incident(trigger)
        if self._should_transfer(trigger):
            asyncio.create_task(self._create_transfer(trigger))

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        handoff = trigger.metadata.get("handoff", {})
        patient_profile = handoff.get("patient_profile", "adult")
        hospital_code = self._receiving_hospital(handoff)
        hospital = get_hospital(hospital_code) or hospitals_for_cluster(self.AGENCY_ID)[0]
        patient_count = int(handoff.get("patient_count", max(1, trigger.severity * random.randint(1, 3))))
        op_status = OP_STATUSES[min(trigger.severity - 1, 3)]

        return {
            "log_reference": f"NUH-EL-{utcnow().strftime('%Y')}{random.randint(100,999)}",
            "nucleus_ref": ticket_id,
            "source": "SCDF_HANDOFF" if handoff else "DIRECT_CLUSTER_ACTIVATION",
            "parent_handoff_id": handoff.get("handoff_id"),
            "parent_agency_ticket": handoff.get("from_ticket_id"),
            "cluster_alert": trigger.severity >= 4,
            "primary_site": hospital["code"],
            "primary_site_name": hospital["name"],
            "operational_status": "UNKNOWN" if random.random() < 0.1 else op_status,
            "patient_handoff": {
                "ambulance_refs": handoff.get("ambulance_refs", []),
                "patient_profile": patient_profile,
                "patient_count": patient_count,
                "triage": handoff.get("triage", self._triage(trigger.severity, patient_count)),
                "handover_status": "RECEIVED_AT_ED" if handoff else "CLUSTER_MONITORING",
            },
            "resource_state": {
                **capacity_snapshot(hospital["code"], trigger.severity),
                "ed_wait_time_mins": random.randint(15, 180),
                "ambulance_holding": random.randint(0, 5),
                "diversion_active": op_status == "DIVERTED",
            },
            "staffing": {
                "on_duty_doctors": random.randint(3, 15),
                "on_duty_nurses": random.randint(8, 30),
                "roster_called_in": random.randint(0, trigger.severity * 2),
            },
            "interop_flags": {
                "scdf_liaison": bool(handoff) or trigger.severity >= 3,
                "moh_notified": trigger.severity >= 4,
                "transfer_possible": trigger.severity >= 4 or patient_profile in ("child", "maternity"),
            },
            "transfer_plan": {
                "transfer_required": False,
                "target_cluster": None,
                "target_hospital": None,
                "reason": None,
            },
            "free_text_updates": [
                {
                    "ts": utcnow().isoformat(),
                    "author_role": random.choice(AUTHOR_ROLES),
                    "note": f"Intake created for {trigger.incident_type.value}. {trigger.description}",
                }
            ],
        }
        if random.random() < 0.2:
            payload.pop("resource_state")
        if random.random() < 0.15:
            payload.pop("staffing")
        return payload

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        if "resource_state" in p:
            rs = p["resource_state"]
            rs["ed_wait_time_mins"] = max(5, rs.get("ed_wait_time_mins", 30) + random.randint(-10, 20))
            rs["beds_available"] = max(0, rs.get("beds_available", 10) - random.randint(0, 3))
        p.setdefault("free_text_updates", []).append({
            "ts": utcnow().isoformat(),
            "author_role": random.choice(AUTHOR_ROLES),
            "note": note,
        })
        return p

    def _receiving_hospital(self, handoff: dict) -> str:
        requested = handoff.get("receiving_hospital")
        requested_hospital = get_hospital(requested) if requested else None
        if requested_hospital and requested_hospital["cluster"] == self.AGENCY_ID:
            return requested
        return random.choice(hospitals_for_cluster(self.AGENCY_ID))["code"]

    def _should_transfer(self, trigger: IncidentTrigger) -> bool:
        handoff = trigger.metadata.get("handoff", {})
        transfer_count = int(trigger.metadata.get("transfer_count", 0))
        if not handoff or transfer_count >= 1:
            return False
        if handoff.get("patient_profile") == "maternity":
            return random.random() < 0.7
        return trigger.severity >= 4 and random.random() < 0.3

    async def _create_transfer(self, trigger: IncidentTrigger):
        await asyncio.sleep(random.uniform(6, 14))
        handoff = trigger.metadata.get("handoff", {})
        current_code = handoff.get("receiving_hospital")
        target = choose_transfer_target(
            current_hospital_code=current_code,
            severity=trigger.severity,
            patient_profile=handoff.get("patient_profile", "adult"),
        )
        if not target:
            return

        transfer_handoff = {
            **handoff,
            "handoff_id": f"NUXFER-{new_id()[:8].upper()}",
            "handoff_type": "INTER_HOSPITAL_TRANSFER",
            "from_agency": self.AGENCY_ID.value,
            "from_hospital": current_code,
            "receiving_cluster": target["cluster"].value,
            "receiving_hospital": target["code"],
            "receiving_hospital_name": target["name"],
            "transfer_reason": self._transfer_reason(trigger, handoff),
            "handoff_created_at": utcnow().isoformat(),
        }
        self._record_transfer_plan(trigger, handoff, target, transfer_handoff)
        transfer_trigger = trigger.model_copy(
            update={
                "participating_agencies": [target["cluster"]],
                "span_id": new_id(),
                "metadata": {
                    **trigger.metadata,
                    "handoff": transfer_handoff,
                    "transfer_count": int(trigger.metadata.get("transfer_count", 0)) + 1,
                },
            }
        )

        if target["cluster"] == self.AGENCY_ID:
            await self._handle_incident(transfer_trigger)
            return

        try:
            await self.http.post(
                f"{CLUSTER_URLS[target['cluster']]}/handoff",
                json=transfer_trigger.model_dump(mode="json"),
                timeout=5,
            )
            log.info("transfer -> %s/%s", target["cluster"].value, target["code"])
        except Exception as exc:
            log.warning("transfer failed: %s", exc)

    def _triage(self, severity: int, patient_count: int) -> dict:
        p1 = random.randint(0, max(0, severity - 3))
        p2 = random.randint(0, min(patient_count, severity))
        return {"P1": p1, "P2": p2, "P3": max(0, patient_count - p1 - p2)}

    def _transfer_reason(self, trigger: IncidentTrigger, handoff: dict) -> str:
        if handoff.get("patient_profile") == "maternity":
            return "maternity_specialist_care"
        if trigger.severity >= 4:
            return "trauma_or_icu_capacity"
        return "capacity_balancing"

    def _record_transfer_plan(self, trigger: IncidentTrigger, handoff: dict, target: dict, transfer_handoff: dict):
        ticket_id = f"{self.AGENCY_ID.value}-{trigger.incident_id[:8].upper()}-{handoff.get('handoff_id', '')[-4:]}"
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return
        ticket["payload"]["transfer_plan"] = {
            "transfer_required": True,
            "target_cluster": target["cluster"].value,
            "target_hospital": target["code"],
            "reason": transfer_handoff["transfer_reason"],
            "handoff_id": transfer_handoff["handoff_id"],
        }
        ticket["audit_log"].append({
            "ts": utcnow().isoformat(),
            "from": ticket["status"],
            "to": ticket["status"],
            "note": f"Transfer requested to {target['code']} for {transfer_handoff['transfer_reason']}",
        })


simulator = NUHSSimulator()
app = simulator.create_app()
