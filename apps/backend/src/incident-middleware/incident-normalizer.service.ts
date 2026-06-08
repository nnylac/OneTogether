import { Injectable } from '@nestjs/common';
import {
  NormalizedIncidentTicket,
  RawAgencyMessage,
} from './incident-middleware.types';

@Injectable()
export class IncidentNormalizerService {
  normalize(message: RawAgencyMessage): NormalizedIncidentTicket {
    const data = message.ticket?.data ?? {};
    const agencyId = this.clean(message.sender?.agency_id, 'UNKNOWN');
    const orgId = this.clean(message.sender?.org_id, agencyId);
    const systemId = this.clean(message.sender?.system_id, 'UNKNOWN');
    const externalIncidentId = this.clean(
      message.external_incident_id ?? message.incident?.incident_id,
      message.ticket?.ticket_id ?? 'unknown-incident',
    );
    const externalTicketId = this.clean(
      message.ticket?.ticket_id,
      `${agencyId}-${externalIncidentId}`,
    );

    const description = this.descriptionFor(agencyId, data, message);
    const location = this.locationFor(agencyId, data, message);
    const incidentType = this.incidentTypeFor(agencyId, data, message);
    const severity = this.severityFor(agencyId, data, message);
    const { lat, lng } = this.coordinatesFor(data, message);

    return {
      agencyId,
      orgId,
      systemId,
      externalIncidentId,
      externalTicketId,
      status: this.clean(message.ticket?.status, 'OPEN'),
      title: this.titleFor(agencyId, incidentType, location),
      description,
      incidentType,
      severity,
      priority: this.priorityFor(severity, data),
      location,
      lat,
      lng,
      confidenceScore: this.confidenceFor(message),
      rawMessage: message,
    };
  }

  private coordinatesFor(
    data: Record<string, unknown>,
    message: RawAgencyMessage,
  ): { lat: number | null; lng: number | null } {
    const fromIncident = message.incident?.location;
    if (
      typeof fromIncident?.lat === 'number' &&
      typeof fromIncident?.lng === 'number'
    ) {
      return { lat: fromIncident.lat, lng: fromIncident.lng };
    }

    const ticketLocation = this.objectValue(data.location);
    if (
      typeof ticketLocation?.lat === 'number' &&
      typeof ticketLocation?.lng === 'number'
    ) {
      return { lat: ticketLocation.lat, lng: ticketLocation.lng };
    }

    return { lat: null, lng: null };
  }

  private descriptionFor(
    agencyId: string,
    data: Record<string, unknown>,
    message: RawAgencyMessage,
  ) {
    const fromIncident = message.incident?.description;
    if (fromIncident) {
      return fromIncident;
    }

    const candidates = [
      data.narrative,
      this.lastText(data.station_log, 'entry'),
      this.lastText(data.operations_log, 'entry'),
      this.lastText(data.case_notes, 'entry'),
      this.lastText(data.clinical_notes, 'note'),
      this.lastText(data.free_text_updates, 'note'),
    ];

    return (
      candidates.find((value): value is string => typeof value === 'string') ??
      `${agencyId} external ticket received`
    );
  }

  private locationFor(
    agencyId: string,
    data: Record<string, unknown>,
    message: RawAgencyMessage,
  ) {
    const incidentLocation = message.incident?.location;
    if (incidentLocation?.name) {
      return incidentLocation.area
        ? `${incidentLocation.name}, ${incidentLocation.area}`
        : incidentLocation.name;
    }

    const location = this.objectValue(data.location);
    const site = this.objectValue(data.site);
    const receivingFacility = this.objectValue(data.receiving_facility);

    const candidates = [
      location?.address_verbatim,
      location?.building_name,
      site?.reported_location,
      site?.location_name,
      site?.street_name,
      receivingFacility?.hospital_name,
      data.primary_site_name,
      data.primary_site,
    ];

    return (
      candidates.find((value): value is string => typeof value === 'string') ??
      null
    );
  }

  private incidentTypeFor(
    agencyId: string,
    data: Record<string, unknown>,
    message: RawAgencyMessage,
  ) {
    if (message.incident?.incident_type) {
      return message.incident.incident_type;
    }

    const classifiers: Record<string, unknown> = {
      SPF: this.objectValue(data.incident_classification)?.category,
      SCDF: data.incident_type,
      PUB: data.incident_category,
      NEA: data.inspection_type,
      TOWN_COUNCIL: data.category,
      SINGHEALTH: 'MEDICAL',
      NUHS: 'MEDICAL',
    };

    return this.clean(classifiers[agencyId], 'UNKNOWN');
  }

  private severityFor(
    agencyId: string,
    data: Record<string, unknown>,
    message: RawAgencyMessage,
  ) {
    if (typeof message.incident?.severity === 'number') {
      return message.incident.severity;
    }

    if (typeof data.hazard_level === 'number') {
      return Math.max(1, Math.min(5, data.hazard_level));
    }

    const priorityFlag = data.priority_flag;
    if (priorityFlag === 'P1') {
      return 5;
    }
    if (priorityFlag === 'P2') {
      return 3;
    }

    const alertLevel = data.alert_level;
    if (alertLevel === 'BLACK') {
      return 5;
    }
    if (alertLevel === 'RED') {
      return 4;
    }
    if (alertLevel === 'AMBER') {
      return 3;
    }

    return agencyId === 'SCDF' ? 3 : 2;
  }

  private priorityFor(severity: number, data: Record<string, unknown>) {
    if (typeof data.priority_flag === 'string') {
      return data.priority_flag;
    }
    if (severity >= 4) {
      return 'P1';
    }
    if (severity >= 2) {
      return 'P2';
    }
    return 'P3';
  }

  private titleFor(
    agencyId: string,
    incidentType: string,
    location: string | null,
  ) {
    return [agencyId, incidentType, location].filter(Boolean).join(' - ');
  }

  private confidenceFor(message: RawAgencyMessage) {
    if (message.quality?.is_incomplete) {
      return 55;
    }
    if (message.quality?.is_duplicate) {
      return 70;
    }
    return 85;
  }

  private clean(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private objectValue(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private lastText(value: unknown, key: string) {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const last = value[value.length - 1];
    if (!last || typeof last !== 'object') {
      return undefined;
    }
    const text = (last as Record<string, unknown>)[key];
    return typeof text === 'string' ? text : undefined;
  }
}
