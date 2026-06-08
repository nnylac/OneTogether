"""
BaseAgencySimulator
-------------------
Shared logic for all 5 agency simulators.
Each agency subclasses this, provides:
  - AGENCY_ID
  - SYSTEM_ID  (their internal system name)
  - build_ticket_payload(trigger, ticket_id) → dict   (agency-specific schema)
  - build_update_payload(ticket, status, note) → dict
"""
from __future__ import annotations

import asyncio
import logging
import os
import random
import socket
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from fastapi import FastAPI

import sys
sys.path.insert(0, "/app/shared")
from models import (
    AgencyID, EventType, HealthResponse, IncidentTrigger, IncidentType,
    QualityFlags, TicketStatus, NoiseType, utcnow,
)

log = logging.getLogger(__name__)


# ─── Ticket status progression ───────────────────────────────────────────────
# Determines realistic next status given current status
STATUS_PROGRESSIONS: dict[TicketStatus, list[TicketStatus]] = {
    TicketStatus.OPEN:         [TicketStatus.IN_PROGRESS],
    TicketStatus.IN_PROGRESS:  [TicketStatus.PENDING_INFO, TicketStatus.RESOLVED],
    TicketStatus.PENDING_INFO: [TicketStatus.IN_PROGRESS],
    TicketStatus.RESOLVED:     [TicketStatus.CLOSED, TicketStatus.REOPENED],
    TicketStatus.REOPENED:     [TicketStatus.IN_PROGRESS],
    TicketStatus.CLOSED:       [],
}

# Weighted: more likely to move forward than sideways
STATUS_WEIGHTS: dict[TicketStatus, list[float]] = {
    TicketStatus.OPEN:         [1.0],
    TicketStatus.IN_PROGRESS:  [0.25, 0.75],   # 25% pending, 75% resolved
    TicketStatus.PENDING_INFO: [1.0],
    TicketStatus.RESOLVED:     [0.85, 0.15],    # 15% reopen
    TicketStatus.REOPENED:     [1.0],
    TicketStatus.CLOSED:       [],
}

# Update notes by status (vary per agency in subclasses)
GENERIC_NOTES: dict[TicketStatus, list[str]] = {
    TicketStatus.IN_PROGRESS:  [
        "Units dispatched to scene",
        "On-scene assessment in progress",
        "Situation assessed, response underway",
        "Additional resources requested",
    ],
    TicketStatus.PENDING_INFO: [
        "Awaiting confirmation from scene commander",
        "Pending update from attending unit",
        "Waiting for inter-agency coordination",
    ],
    TicketStatus.RESOLVED: [
        "Situation contained, units standing down",
        "Scene cleared, handover complete",
        "Incident resolved, report pending",
    ],
    TicketStatus.REOPENED: [
        "Situation re-escalated, units returning",
        "New development reported, re-activating",
    ],
    TicketStatus.CLOSED: [
        "Post-incident report filed. Ticket closed.",
        "All units returned to base. Closed.",
        "All response activity completed. Ticket closed.",
    ],
}


class BaseAgencySimulator(ABC):
    AGENCY_ID: AgencyID
    SYSTEM_ID: str
    SERVICE_NAME: str

    def __init__(self):
        self.middleware_url: str = os.getenv("MIDDLEWARE_URL", "")
        self.tickets: dict[str, dict] = {}          # ticket_id → full ticket record
        self.active_incidents: dict[str, str] = {}  # incident_id → ticket_id
        self.http: Optional[httpx.AsyncClient] = None

    def create_app(self) -> FastAPI:
        app = FastAPI(title=self.SERVICE_NAME)

        @app.on_event("startup")
        async def startup():
            self.http = httpx.AsyncClient()
            log.info(f"[{self.SERVICE_NAME}] started | middleware={self.middleware_url or 'NOT SET'}")

        @app.on_event("shutdown")
        async def shutdown():
            if self.http:
                await self.http.aclose()

        @app.get("/health", response_model=HealthResponse)
        async def health():
            open_tickets = sum(
                1 for t in self.tickets.values()
                if t["status"] not in (TicketStatus.CLOSED.value,)
            )
            return HealthResponse(
                service=self.SERVICE_NAME,
                active_incidents=len(self.active_incidents),
                open_tickets=open_tickets,
            )

        @app.get("/tickets")
        async def get_tickets():
            return {"tickets": list(self.tickets.values()), "total": len(self.tickets)}

        @app.get("/active-incidents")
        async def get_active_incidents():
            return {
                "active": [
                    {
                        "incident_id": inc_id,
                        "ticket_id": tid,
                        "status": self.tickets[tid]["status"],
                    }
                    for inc_id, tid in self.active_incidents.items()
                    if tid in self.tickets
                ]
            }

        @app.get("/resources")
        async def get_resources():
            return {
                "agencyId": self.AGENCY_ID.value,
                "systemId": self.SYSTEM_ID,
                "generatedAt": utcnow().isoformat(),
                "outlets": self.resource_outlets(),
            }

        @app.post("/incident", status_code=202)
        async def receive_incident(trigger: IncidentTrigger):
            asyncio.create_task(self._handle_incident(trigger))
            return {"accepted": True, "incident_id": trigger.incident_id}

        return app

    def resource_outlets(self) -> list[dict[str, Any]]:
        return []

    # ─── Core incident handling ──────────────────────────────────────────────

    async def _handle_incident(self, trigger: IncidentTrigger):
        handoff = trigger.metadata.get("handoff", {})
        handoff_suffix = f"-{handoff.get('handoff_id', '')[-4:]}" if handoff.get("handoff_id") else ""
        ticket_id = f"{self.AGENCY_ID.value}-{trigger.incident_id[:8].upper()}{handoff_suffix}"
        log.info(f"[{self.SERVICE_NAME}] Creating ticket {ticket_id} for {trigger.incident_type.value}")

        # Build the ticket in this agency's own schema
        payload = self.build_ticket_payload(trigger, ticket_id)

        ticket = {
            "ticket_id": ticket_id,
            "incident_id": trigger.incident_id,
            "incident": trigger.model_dump(mode="json"),
            "status": TicketStatus.OPEN.value,
            "created_at": utcnow().isoformat(),
            "updated_at": utcnow().isoformat(),
            "trace_id": trigger.trace_id,
            "parent_span_id": trigger.span_id,
            "payload": payload,
            "audit_log": [],
        }
        self.tickets[ticket_id] = ticket
        self.active_incidents[trigger.incident_id] = ticket_id

        # Emit TICKET.CREATED
        await self._emit(
            event_type=EventType.TICKET_CREATED,
            ticket=ticket,
            extra_payload={"ticket": payload},
        )

        # Schedule lifecycle updates
        asyncio.create_task(self._run_lifecycle(ticket, trigger))

    async def _run_lifecycle(self, ticket: dict, trigger: IncidentTrigger):
        """Generate realistic status updates, then always finish closed."""
        n_updates = random.randint(3, 6)
        current_status = TicketStatus.OPEN

        for i in range(n_updates):
            # Wait a realistic interval between updates
            wait = random.uniform(8, 30)
            await asyncio.sleep(wait)

            nexts = STATUS_PROGRESSIONS.get(current_status, [])
            if not nexts:
                break
            weights = STATUS_WEIGHTS.get(current_status, [1.0] * len(nexts))
            next_status = random.choices(nexts, weights=weights, k=1)[0]

            note = random.choice(GENERIC_NOTES.get(next_status, ["Status updated"]))
            update_payload = self.build_update_payload(ticket, next_status, note)

            # Noise injection
            quality = QualityFlags()
            if random.random() < 0.08:    # 8% duplicate
                quality.is_duplicate = True
                quality.noise_type = NoiseType.DUPLICATE
            if random.random() < 0.06:    # 6% incomplete
                quality.is_incomplete = True
                quality.noise_type = NoiseType.INCOMPLETE

            delay_ms = 0
            if random.random() < 0.12:    # 12% delayed
                delay_ms = random.randint(500, 4000)
                await asyncio.sleep(delay_ms / 1000)
                quality.simulated_delay_ms = delay_ms
                if not quality.noise_type:
                    quality.noise_type = NoiseType.DELAYED

            old_status = ticket["status"]
            ticket["status"]     = next_status.value
            ticket["updated_at"] = utcnow().isoformat()
            ticket["payload"]    = update_payload
            ticket["audit_log"].append({
                "ts": utcnow().isoformat(),
                "from": old_status,
                "to": next_status.value,
                "note": note,
            })

            log.info(
                f"[{self.SERVICE_NAME}] {ticket['ticket_id']} "
                f"{old_status} → {next_status.value}"
                + (f" [+{delay_ms}ms delay]" if delay_ms else "")
                + (" [DUPE]" if quality.is_duplicate else "")
            )

            event_type = (
                EventType.TICKET_CLOSED   if next_status == TicketStatus.CLOSED
                else EventType.TICKET_REOPENED if next_status == TicketStatus.REOPENED
                else EventType.TICKET_STATUS_CHANGED
            )

            await self._emit(
                event_type=event_type,
                ticket=ticket,
                extra_payload={
                    "ticket": update_payload,
                    "status_change": {"from": old_status, "to": next_status.value, "note": note},
                },
                quality=quality,
            )

            # Emit duplicate if flagged
            if quality.is_duplicate:
                await asyncio.sleep(random.uniform(0.1, 1.5))
                await self._emit(
                    event_type=event_type,
                    ticket=ticket,
                    extra_payload={
                        "ticket": update_payload,
                        "status_change": {"from": old_status, "to": next_status.value, "note": note},
                        "_duplicate_note": "Re-transmitted due to network retry",
                    },
                    quality=quality,
                )

            current_status = next_status
            if current_status == TicketStatus.CLOSED:
                break

        if current_status != TicketStatus.CLOSED:
            await asyncio.sleep(random.uniform(4, 10))
            await self._apply_status_update(
                ticket=ticket,
                next_status=TicketStatus.CLOSED,
                note=random.choice(GENERIC_NOTES[TicketStatus.CLOSED]),
            )

        # Clean up active tracking once closed
        inc_id = ticket.get("incident_id")
        if (
            inc_id
            and inc_id in self.active_incidents
            and ticket["status"] in (TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value)
        ):
            del self.active_incidents[inc_id]

    async def _apply_status_update(
        self,
        ticket: dict,
        next_status: TicketStatus,
        note: str,
        quality: Optional[QualityFlags] = None,
    ):
        update_payload = self.build_update_payload(ticket, next_status, note)
        quality = quality or QualityFlags()

        old_status = ticket["status"]
        ticket["status"]     = next_status.value
        ticket["updated_at"] = utcnow().isoformat()
        ticket["payload"]    = update_payload
        ticket["audit_log"].append({
            "ts": utcnow().isoformat(),
            "from": old_status,
            "to": next_status.value,
            "note": note,
        })

        log.info(
            f"[{self.SERVICE_NAME}] {ticket['ticket_id']} "
            f"{old_status} → {next_status.value}"
            + (" [DUPE]" if quality.is_duplicate else "")
        )

        event_type = (
            EventType.TICKET_CLOSED   if next_status == TicketStatus.CLOSED
            else EventType.TICKET_REOPENED if next_status == TicketStatus.REOPENED
            else EventType.TICKET_STATUS_CHANGED
        )

        await self._emit(
            event_type=event_type,
            ticket=ticket,
            extra_payload={
                "ticket": update_payload,
                "status_change": {"from": old_status, "to": next_status.value, "note": note},
            },
            quality=quality,
        )

    # ─── Event emission ──────────────────────────────────────────────────────

    async def _emit(
        self,
        event_type: EventType,
        ticket: dict,
        extra_payload: dict,
        quality: Optional[QualityFlags] = None,
    ):
        if not self.middleware_url:
            return

        raw_message = {
            "message_kind": "agency_ticket",
            "sender": {
                "agency_id": self.AGENCY_ID.value,
                "org_id": self.AGENCY_ID.value,
                "system_id": self.SYSTEM_ID,
                "service_instance": socket.gethostname(),
            },
            "external_incident_id": ticket["incident_id"],
            "trace_id": ticket["trace_id"],
            "parent_span_id": ticket.get("parent_span_id"),
            "incident": ticket.get("incident"),
            "ticket": {
                "ticket_id": ticket["ticket_id"],
                "status": ticket["status"],
                "data": extra_payload.get("ticket", ticket.get("payload")),
            },
            "logs": ticket.get("audit_log", []),
            "status_change": extra_payload.get("status_change"),
            "quality": (quality or QualityFlags()).model_dump(mode="json"),
        }

        try:
            await self.http.post(
                f"{self.middleware_url}/events",
                json=raw_message,
                timeout=5,
            )
        except Exception as e:
            log.warning(f"[{self.SERVICE_NAME}] emit failed: {e}")

    # ─── Abstract methods ─────────────────────────────────────────────────────

    @abstractmethod
    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        """Return the agency-specific ticket schema as a dict."""
        ...

    @abstractmethod
    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        """Return the agency-specific update payload."""
        ...
