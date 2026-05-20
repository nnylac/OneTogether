import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from './mock.data';

@Injectable()
export class MockService {
  get(key: keyof typeof db) {
    return db[key];
  }

  create(key: 'incidents' | 'broadcasts' | 'volunteerTasks', body: Record<string, unknown>) {
    const item = { id: `${key}-${Date.now()}`, ...body };
    (db[key] as Array<Record<string, unknown>>).unshift(item);
    return item;
  }

  patch(key: 'incidents' | 'hospitals' | 'thresholds', id: string, body: Record<string, unknown>) {
    const collection = db[key] as Array<Record<string, unknown>>;
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`${key} ${id} not found`);
    }
    collection[index] = { ...collection[index], ...body };
    return collection[index];
  }

  assignIncident(id: string, organisationId: string) {
    const incident = this.patch('incidents', id, {}) as { assignedOrganisations?: string[] };
    incident.assignedOrganisations = Array.from(new Set([...(incident.assignedOrganisations ?? []), organisationId]));
    return incident;
  }

  makeIncidentPublic(id: string) {
    return this.patch('incidents', id, { publicVisibility: 'Public' });
  }
}
