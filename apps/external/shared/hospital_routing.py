from __future__ import annotations

import math
import random
from typing import Any

from models import AgencyID, IncidentTrigger, IncidentType, Location


HOSPITALS: list[dict[str, Any]] = [
    {
        "code": "SGH",
        "name": "Singapore General Hospital",
        "cluster": AgencyID.SINGHEALTH,
        "lat": 1.2797,
        "lng": 103.8344,
        "region": "Central",
        "specialties": ["trauma", "burns", "general", "surge"],
        "base_beds": 76,
        "base_icu": 14,
    },
    {
        "code": "CGH",
        "name": "Changi General Hospital",
        "cluster": AgencyID.SINGHEALTH,
        "lat": 1.3404,
        "lng": 103.9499,
        "region": "East",
        "specialties": ["trauma", "general", "surge"],
        "base_beds": 58,
        "base_icu": 8,
    },
    {
        "code": "SKH",
        "name": "Sengkang General Hospital",
        "cluster": AgencyID.SINGHEALTH,
        "lat": 1.3950,
        "lng": 103.8938,
        "region": "North-East",
        "specialties": ["general", "surge"],
        "base_beds": 52,
        "base_icu": 7,
    },
    {
        "code": "KKH",
        "name": "KK Women's and Children's Hospital",
        "cluster": AgencyID.SINGHEALTH,
        "lat": 1.3106,
        "lng": 103.8465,
        "region": "Central",
        "specialties": ["paediatric", "maternity", "women"],
        "base_beds": 42,
        "base_icu": 6,
    },
    {
        "code": "NUH",
        "name": "National University Hospital",
        "cluster": AgencyID.NUHS,
        "lat": 1.2937,
        "lng": 103.7831,
        "region": "West",
        "specialties": ["trauma", "paediatric", "general", "surge"],
        "base_beds": 68,
        "base_icu": 13,
    },
    {
        "code": "NTFGH",
        "name": "Ng Teng Fong General Hospital",
        "cluster": AgencyID.NUHS,
        "lat": 1.3333,
        "lng": 103.7458,
        "region": "West",
        "specialties": ["trauma", "general", "surge"],
        "base_beds": 55,
        "base_icu": 8,
    },
]


def infer_patient_profile(trigger: IncidentTrigger) -> str:
    text = f"{trigger.description} {trigger.location.name}".lower()

    if any(term in text for term in ("pregnant", "labour", "maternity")):
        return "maternity"
    if any(
        term in text
        for term in (
            "child",
            "childcare",
            "preschool",
            "school",
            "student",
            "young",
        )
    ):
        return "child"
    if any(
        term in text
        for term in (
            "elderly",
            "dementia",
            "nursing home",
            "senior",
        )
    ):
        return "elderly"
    return "adult"


def hospitals_for_cluster(cluster: AgencyID) -> list[dict[str, Any]]:
    return [hospital for hospital in HOSPITALS if hospital["cluster"] == cluster]


def get_hospital(code: str) -> dict[str, Any] | None:
    return next((hospital for hospital in HOSPITALS if hospital["code"] == code), None)


def route_hospital(
    location: Location,
    incident_type: IncidentType,
    severity: int,
    patient_profile: str,
) -> dict[str, Any]:
    scored = []
    for hospital in HOSPITALS:
        distance = _distance_km(location.lat, location.lng, hospital["lat"], hospital["lng"])
        score = distance

        if severity >= 4 and "trauma" in hospital["specialties"]:
            score -= 4.0
        if patient_profile == "child" and "paediatric" in hospital["specialties"]:
            score -= 8.0
        if patient_profile == "maternity" and "maternity" in hospital["specialties"]:
            score -= 10.0
        if patient_profile in ("adult", "elderly") and hospital["code"] == "KKH":
            score += 12.0
        if incident_type == IncidentType.BUILDING_FIRE and "burns" in hospital["specialties"]:
            score -= 2.0

        capacity_pressure = random.uniform(0, 5)
        if severity >= 4 and hospital["base_icu"] < 8:
            capacity_pressure += 3

        scored.append((score + capacity_pressure, hospital))

    scored.sort(key=lambda item: item[0])
    return scored[0][1]


def choose_transfer_target(current_hospital_code: str, severity: int, patient_profile: str) -> dict[str, Any] | None:
    current = get_hospital(current_hospital_code)
    if not current:
        return None

    candidates = [hospital for hospital in HOSPITALS if hospital["code"] != current_hospital_code]
    if severity >= 4:
        candidates = [hospital for hospital in candidates if "trauma" in hospital["specialties"]] or candidates
    if patient_profile == "child":
        candidates = [hospital for hospital in candidates if "paediatric" in hospital["specialties"]] or candidates
    if patient_profile == "maternity":
        candidates = [hospital for hospital in candidates if "maternity" in hospital["specialties"]] or candidates

    current_cluster = current["cluster"]
    same_cluster = [hospital for hospital in candidates if hospital["cluster"] == current_cluster]
    cross_cluster = [hospital for hospital in candidates if hospital["cluster"] != current_cluster]

    pool = same_cluster if random.random() < 0.65 and same_cluster else cross_cluster
    return random.choice(pool) if pool else None


def capacity_snapshot(hospital_code: str, severity: int) -> dict[str, int]:
    hospital = get_hospital(hospital_code) or HOSPITALS[0]
    load = random.randint(severity * 2, severity * 8)
    return {
        "beds_available": max(0, hospital["base_beds"] - load),
        "icu_available": max(0, hospital["base_icu"] - random.randint(0, severity * 2)),
        "operating_theatres_free": max(0, random.randint(0, 5) - (1 if severity >= 4 else 0)),
    }


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
