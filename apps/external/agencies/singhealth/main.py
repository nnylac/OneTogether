"""SingHealth simulator (SHERMS schema)."""
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
    format="%(asctime)s [SINGHEALTH] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("singhealth")

ALERT_LEVELS = {1: "GREEN", 2: "GREEN", 3: "AMBER", 4: "RED", 5: "BLACK"}
DEPARTMENTS = {
    "adult": ["EMERGENCY", "TRAUMA", "GENERAL_MEDICINE"],
    "elderly": ["EMERGENCY", "GENERAL_MEDICINE", "ICU"],
    "child": ["PAEDIATRIC_EMERGENCY", "PAEDIATRICS"],
    "maternity": ["OBSTETRICS", "WOMEN_EMERGENCY"],
}
CLUSTER_URLS = {
    AgencyID.SINGHEALTH: os.getenv("SINGHEALTH_URL", "http://singhealth:8000"),
    AgencyID.NUHS: os.getenv("NUHS_URL", "http://nuhs:8000"),
}


class SingHealthSimulator(BaseAgencySimulator):
    AGENCY_ID = AgencyID.SINGHEALTH
    SYSTEM_ID = "SHERMS"
    SERVICE_NAME = "singhealth-simulator"

    def resource_outlets(self) -> list[dict]:
        return [
            self._hospital_outlet("SGH", "Singapore General Hospital", "Central", "Outram Road", 1.2797, 103.8344, 76, 48, 18, 4, 6, 14, 8, 4, 1, 1, 182, 131, 35, 10, 6),
            self._hospital_outlet("CGH", "Changi General Hospital", "East", "2 Simei Street 3", 1.3404, 103.9499, 58, 37, 15, 3, 3, 8, 5, 2, 0, 1, 136, 94, 30, 8, 4),
            self._hospital_outlet("SKH", "Sengkang General Hospital", "North-East", "110 Sengkang East Way", 1.3950, 103.8938, 52, 32, 14, 3, 3, 7, 4, 2, 0, 1, 124, 87, 27, 6, 4),
            self._hospital_outlet("KKH", "KK Women's and Children's Hospital", "Central", "100 Bukit Timah Road", 1.3106, 103.8465, 42, 24, 12, 3, 3, 6, 3, 2, 0, 1, 118, 82, 25, 7, 4),
        ]

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
        return {
            "externalOutletId": f"SINGHEALTH-{code}",
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
        patient_profile = handoff.get("patient_profile", self._infer_patient_profile(trigger))
        hospital_code = self._receiving_hospital(trigger, handoff)
        hospital = get_hospital(hospital_code) or hospitals_for_cluster(self.AGENCY_ID)[0]
        patient_count = int(handoff.get("patient_count", max(1, trigger.severity * random.randint(1, 3))))
        triage = handoff.get("triage", self._triage(trigger.severity, patient_count))

        payload = {
            "activation_code": f"SHA-{utcnow().strftime('%m%d')}-{random.randint(100,999)}",
            "sherms_ref": ticket_id,
            "source": "SCDF_HANDOFF" if handoff else "DIRECT_CLUSTER_ACTIVATION",
            "parent_handoff_id": handoff.get("handoff_id"),
            "parent_agency_ticket": handoff.get("from_ticket_id"),
            "alert_level": ALERT_LEVELS.get(trigger.severity, "AMBER"),
            "receiving_facility": {
                "hospital_code": hospital["code"],
                "hospital_name": hospital["name"],
                "cluster": self.AGENCY_ID.value,
                "department": random.choice(DEPARTMENTS.get(patient_profile, DEPARTMENTS["adult"])),
            },
            "handoff_summary": {
                "ambulance_refs": handoff.get("ambulance_refs", []),
                "patient_profile": patient_profile,
                "patient_count": patient_count,
                "triage": triage,
                "handover_status": "RECEIVED_AT_ED" if handoff else "CLUSTER_MONITORING",
            },
            "capacity_snapshot": capacity_snapshot(hospital["code"], trigger.severity),
            "patient_intake": {
                "expected_count": patient_count,
                "received_count": random.randint(0, min(patient_count, 2)) if handoff else 0,
                "triage_breakdown": triage,
            },
            "staff_mobilised": {
                "doctors": random.randint(2, 12),
                "nurses": random.randint(5, 25),
                "paramedics": random.randint(0, 5),
            },
            "transfer_plan": {
                "transfer_required": False,
                "target_cluster": None,
                "target_hospital": None,
                "reason": None,
            },
            "clinical_notes": [
                {
                    "ts": utcnow().isoformat(),
                    "note": f"Hospital intake created for {trigger.incident_type.value}. {trigger.description}",
                }
            ],
        }

        if random.random() < 0.2:
            payload.pop("clinical_notes")

        return payload

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        intake = p.get("patient_intake", {})
        expected = intake.get("expected_count", 1)
        intake["received_count"] = min(expected, intake.get("received_count", 0) + random.randint(0, 3))
        p["patient_intake"] = intake

        cap = p.get("capacity_snapshot", {})
        cap["beds_available"] = max(0, cap.get("beds_available", 10) - random.randint(0, 3))
        cap["icu_available"] = max(0, cap.get("icu_available", 2) - random.randint(0, 1))
        p["capacity_snapshot"] = cap

        p.setdefault("clinical_notes", []).append({"ts": utcnow().isoformat(), "note": note})
        return p

    def _receiving_hospital(self, trigger: IncidentTrigger, handoff: dict) -> str:
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
        patient_profile = handoff.get("patient_profile", "adult")
        if patient_profile in ("child", "maternity") and handoff.get("receiving_hospital") != "KKH":
            return random.random() < 0.65
        return trigger.severity >= 4 and random.random() < 0.35

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
            "handoff_id": f"SHXFER-{new_id()[:8].upper()}",
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

    def _infer_patient_profile(self, trigger: IncidentTrigger) -> str:
        text = f"{trigger.description} {trigger.location.name}".lower()
        if "child" in text or "childcare" in text:
            return "child"
        if "pregnant" in text or "labour" in text:
            return "maternity"
        return "adult"

    def _triage(self, severity: int, patient_count: int) -> dict:
        p1 = random.randint(0, max(0, severity - 3))
        p2 = random.randint(0, min(patient_count, severity))
        return {"P1": p1, "P2": p2, "P3": max(0, patient_count - p1 - p2)}

    def _transfer_reason(self, trigger: IncidentTrigger, handoff: dict) -> str:
        profile = handoff.get("patient_profile")
        if profile == "child":
            return "paediatric_specialist_care"
        if profile == "maternity":
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


simulator = SingHealthSimulator()
app = simulator.create_app()
