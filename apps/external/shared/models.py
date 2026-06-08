"""
Shared event envelope and base models.
All agency-specific schemas live in their own service folders.
"""
from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class AgencyID(str, Enum):
    SPF          = "SPF"
    SCDF         = "SCDF"
    SINGHEALTH   = "SINGHEALTH"
    NUHS         = "NUHS"
    TOWN_COUNCIL = "TOWN_COUNCIL"
    PUB          = "PUB"
    NEA          = "NEA"
    SCENARIO_ENGINE = "SCENARIO_ENGINE"


class IncidentType(str, Enum):
    TRAFFIC_ACCIDENT  = "TRAFFIC_ACCIDENT"
    BUILDING_FIRE     = "BUILDING_FIRE"
    FLOODING          = "FLOODING"
    MEDICAL_EMERGENCY = "MEDICAL_EMERGENCY"
    GAS_LEAK          = "GAS_LEAK"
    BUILDING_COLLAPSE = "BUILDING_COLLAPSE"
    MISSING_PERSON    = "MISSING_PERSON"
    DISEASE_OUTBREAK  = "DISEASE_OUTBREAK"
    HAZE              = "HAZE"
    CIVIL_DISTURBANCE = "CIVIL_DISTURBANCE"


class EventType(str, Enum):
    INCIDENT_CREATED  = "INCIDENT.CREATED"
    INCIDENT_UPDATED  = "INCIDENT.UPDATED"
    INCIDENT_RESOLVED = "INCIDENT.RESOLVED"
    TICKET_CREATED    = "TICKET.CREATED"
    TICKET_UPDATED    = "TICKET.UPDATED"
    TICKET_STATUS_CHANGED = "TICKET.STATUS_CHANGED"
    TICKET_CLOSED     = "TICKET.CLOSED"
    TICKET_REOPENED   = "TICKET.REOPENED"
    OPS_UPDATE        = "OPS.UPDATE"
    PATIENT_HANDOFF_CREATED = "PATIENT.HANDOFF.CREATED"
    PATIENT_TRANSFER_REQUESTED = "PATIENT.TRANSFER.REQUESTED"
    HOSPITAL_INTAKE_CREATED = "HOSPITAL.INTAKE.CREATED"
    HOSPITAL_INTAKE_UPDATED = "HOSPITAL.INTAKE.UPDATED"
    HOSPITAL_INTAKE_CLOSED = "HOSPITAL.INTAKE.CLOSED"


class TicketStatus(str, Enum):
    OPEN         = "OPEN"
    IN_PROGRESS  = "IN_PROGRESS"
    PENDING_INFO = "PENDING_INFO"
    RESOLVED     = "RESOLVED"
    CLOSED       = "CLOSED"
    REOPENED     = "REOPENED"


class NoiseType(str, Enum):
    DELAYED      = "DELAYED"
    DUPLICATE    = "DUPLICATE"
    INCOMPLETE   = "INCOMPLETE"
    ALT_LOCATION = "ALT_LOCATION"
    ALT_NAME     = "ALT_NAME"


# ─── Incident trigger (Scenario Engine → Agencies) ─────────────────────────

class Location(BaseModel):
    name: str
    area: str
    lat: float
    lng: float
    postal_code: Optional[str] = None
    reported_accuracy: Optional[str] = None


class IncidentTrigger(BaseModel):
    incident_id: str = Field(default_factory=new_id)
    incident_type: IncidentType
    severity: int = Field(ge=1, le=5, description="1=minor, 5=catastrophic")
    location: Location
    description: str
    triggered_at: datetime = Field(default_factory=utcnow)
    participating_agencies: list[AgencyID]
    trace_id: str = Field(default_factory=new_id)
    span_id: str = Field(default_factory=new_id)
    metadata: dict[str, Any] = Field(default_factory=dict)


# ─── Common event envelope (Agencies → Middleware) ─────────────────────────

class EventSource(BaseModel):
    agency_id: AgencyID
    system_id: str          # e.g. "POLARIS", "FIREWATCH" — agency's internal name
    service_instance: str   # container hostname


class EventCorrelation(BaseModel):
    incident_id: str
    trace_id: str
    span_id: str = Field(default_factory=new_id)
    parent_span_id: Optional[str] = None
    causation_id: Optional[str] = None   # event_id that caused this


class QualityFlags(BaseModel):
    is_duplicate: bool = False
    is_incomplete: bool = False
    simulated_delay_ms: int = 0
    noise_type: Optional[NoiseType] = None


class EventEnvelope(BaseModel):
    event_id: str = Field(default_factory=new_id)
    event_type: EventType
    event_version: str = "1.0"
    emitted_at: datetime = Field(default_factory=utcnow)
    source: EventSource
    correlation: EventCorrelation
    payload: dict[str, Any]          # agency-specific — middleware normalises
    quality_flags: QualityFlags = Field(default_factory=QualityFlags)


# ─── Health response ────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    service: str
    status: str = "ok"
    active_incidents: int = 0
    open_tickets: int = 0
    timestamp: datetime = Field(default_factory=utcnow)
