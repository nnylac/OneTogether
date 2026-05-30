import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from './mock.data';

type Collection = 'incidents' | 'broadcasts' | 'volunteerTasks' | 'hospitals' | 'thresholds' | 'units' | 'communityProgrammes';

@Injectable()
export class MockService {
  get(key: keyof typeof db) {
    return db[key];
  }

  create(key: Collection, body: Record<string, unknown>) {
    const item = { id: `${key}-${Date.now()}`, ...body };
    (db[key] as Array<Record<string, unknown>>).unshift(item);
    return item;
  }

  patch(key: Collection, id: string, body: Record<string, unknown>) {
    const collection = db[key] as Array<Record<string, unknown>>;
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`${key} ${id} not found`);
    collection[index] = { ...collection[index], ...body };
    return collection[index];
  }

  delete(key: Collection, id: string) {
    const collection = db[key] as Array<Record<string, unknown>>;
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`${key} ${id} not found`);
    collection.splice(index, 1);
  }

  assignIncident(id: string, organisationId: string) {
    const incident = this.patch('incidents', id, {}) as { assignedOrganisations?: string[] };
    incident.assignedOrganisations = Array.from(new Set([...(incident.assignedOrganisations ?? []), organisationId]));
    return incident;
  }

  makeIncidentPublic(id: string) {
    return this.patch('incidents', id, { publicVisibility: 'Public' });
  }

  advanceIncidentStatus(id: string, logEntry: Record<string, unknown>) {
    const statusOrder = ['Reported', 'Unverified', 'Verified', 'Dispatched', 'On Scene', 'Contained', 'Recovery', 'Closed'];
    const incident = this.patch('incidents', id, {}) as { status: string; timeline?: unknown[] };
    const idx = statusOrder.indexOf(incident.status);
    const next = idx < statusOrder.length - 1 ? statusOrder[idx + 1] : incident.status;
    incident.status = next;
    incident.timeline = [...(incident.timeline ?? []), { id: `tl-${Date.now()}`, timestamp: new Date().toLocaleString('en-SG'), ...logEntry }];
    return incident;
  }

  addTimelineEntry(id: string, entry: Record<string, unknown>) {
    const incident = this.patch('incidents', id, {}) as { timeline?: unknown[] };
    incident.timeline = [...(incident.timeline ?? []), { id: `tl-${Date.now()}`, timestamp: new Date().toLocaleString('en-SG'), ...entry }];
    return incident;
  }

  signupTask(id: string) {
    const task = this.patch('volunteerTasks', id, {}) as { slotsFilled: number; slotsTotal: number; status: string };
    task.slotsFilled = Math.min(task.slotsTotal, (task.slotsFilled ?? 0) + 1);
    task.status = task.slotsFilled >= task.slotsTotal ? 'Full' : 'Filling';
    return task;
  }

  registerProgramme(id: string) {
    const prog = this.patch('communityProgrammes', id, {}) as { registered: number; capacity: number };
    prog.registered = Math.min(prog.capacity, (prog.registered ?? 0) + 1);
    return prog;
  }
}
