import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from './geocoding.service';
import { OverpassService } from './overpass.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private overpass: OverpassService,
    private ai: AiService,
  ) {}

  async findAll() {
    const incidents = await this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { participants: true, messages: true } },
        resources: { include: { unit: true } },
      },
    });
    return incidents.map((inc) => ({
      ...inc,
      assignedOrgIds: this.parseOrgIds(inc.assignedOrgIds),
      participantCount: inc._count.participants,
      messageCount: inc._count.messages,
    }));
  }

  async findOne(id: string) {
    const inc = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        timeline: { orderBy: { timestamp: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
        resources: { include: { unit: { include: { organisation: true } } } },
        uploads: { orderBy: { createdAt: 'asc' } },
        participants: true,
        pois: { orderBy: { createdAt: 'asc' } },
        _count: { select: { participants: true } },
      },
    });
    if (!inc) throw new NotFoundException(`Incident ${id} not found`);
    return { ...inc, assignedOrgIds: this.parseOrgIds(inc.assignedOrgIds) };
  }

  async create(data: {
    title: string;
    type: string;
    severity: string;
    description: string;
    location: string;
    zone?: string;
    createdBy: string;
    publicVisibility?: string;
  }) {
    const incident = await this.prisma.incident.create({
      data: { ...data, assignedOrgIds: JSON.stringify([]) },
    });
    // Fire-and-forget geocoding
    void this.geocoding.geocodeAddress(data.location).then((coords) => {
      if (coords) {
        void this.prisma.incident.update({
          where: { id: incident.id },
          data: { latitude: coords.lat, longitude: coords.lng },
        });
      }
    });
    return incident;
  }

  async setLocation(id: string, latitude: number, longitude: number, boundaryGeoJson?: string) {
    return this.prisma.incident.update({
      where: { id },
      data: { latitude, longitude, ...(boundaryGeoJson !== undefined ? { boundaryGeoJson } : {}) },
    });
  }

  async geocodeIncident(id: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException(`Incident ${id} not found`);
    const coords = await this.geocoding.geocodeAddress(inc.location);
    if (!coords) return { ...inc, queriedAs: null };
    const updated = await this.prisma.incident.update({
      where: { id },
      data: { latitude: coords.lat, longitude: coords.lng },
    });
    return { ...updated, queriedAs: coords.queriedAs };
  }

  async getNearbyInfrastructure(id: string, radius = 2000) {
    let inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException(`Incident ${id} not found`);
    if (inc.latitude == null) {
      const geocoded = await this.geocodeIncident(id);
      if (geocoded.latitude == null) return [];
      inc = await this.prisma.incident.findUnique({ where: { id } }) ?? inc;
    }
    return this.overpass.getNearby(inc.latitude!, inc.longitude!, inc.type, radius);
  }

  async getAiResourceSuggestions(id: string): Promise<{ name: string; type: string; reason: string; priority: string }[]> {
    const inc = await this.prisma.incident.findUnique({
      where: { id },
      include: { timeline: { take: 10, orderBy: { timestamp: 'desc' } }, resources: { include: { unit: true } } },
    });
    if (!inc) return [];

    const assignedUnits = inc.resources.map(r => `${r.unit?.callSign} (${r.unit?.type})`).join(', ') || 'none';
    const recentTimeline = inc.timeline.map(e => e.text).join('; ') || 'none';

    const prompt = `You are a Singapore national emergency operations advisor.

For the following incident, list up to 5 specific nearby resources or facilities that responders should know about.
Only include resources that are operationally necessary for THIS specific incident type and severity.

Incident: ${inc.title}
Type: ${inc.type} | Severity: ${inc.severity} | Status: ${inc.status}
Location: ${inc.location}
Description: ${String(inc.description).slice(0, 200)}
Assigned units: ${assignedUnits}
Recent events: ${recentTimeline}

Return ONLY a JSON array with this exact structure, no markdown fences:
[
  { "name": "facility name", "type": "hospital|fire_station|police|clinic|shelter|other", "reason": "brief operational reason", "priority": "critical|recommended" }
]

Rules:
- Only include facilities relevant to ${inc.type} incidents
- "critical" = immediately needed for this response
- "recommended" = useful supporting resource
- Be specific (e.g. "KK Women's and Children's Hospital" not just "hospital")
- Max 5 items`;

    try {
      const text = await this.ai.ask(prompt);
      return this.ai.parseJson<{ name: string; type: string; reason: string; priority: string }[]>(text, []);
    } catch {
      return [];
    }
  }

  async update(id: string, data: Partial<{
    title: string;
    status: string;
    severity: string;
    description: string;
    incidentCommander: string;
    publicVisibility: string;
  }>) {
    const exists = await this.prisma.incident.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Incident ${id} not found`);
    return this.prisma.incident.update({ where: { id }, data });
  }

  async assignOrg(id: string, orgId: string) {
    const inc = await this.prisma.incident.findUnique({ where: { id } });
    if (!inc) throw new NotFoundException(`Incident ${id} not found`);
    const current = this.parseOrgIds(inc.assignedOrgIds);
    if (!current.includes(orgId)) {
      await this.prisma.incident.update({
        where: { id },
        data: { assignedOrgIds: JSON.stringify([...current, orgId]) },
      });
    }
  }

  async getResources(incidentId: string) {
    return this.prisma.resourceAssignment.findMany({
      where: { incidentId },
      include: { unit: { include: { organisation: true } } },
    });
  }

  async assignUnit(incidentId: string, unitId: string) {
    const existing = await this.prisma.resourceAssignment.findUnique({
      where: { incidentId_unitId: { incidentId, unitId } },
    });
    if (existing) return existing;
    await this.prisma.resourceUnit.update({ where: { id: unitId }, data: { status: 'Assigned' } });
    return this.prisma.resourceAssignment.create({ data: { incidentId, unitId } });
  }

  async updateUnitStatus(incidentId: string, unitId: string, status: string) {
    const assignment = await this.prisma.resourceAssignment.findUnique({
      where: { incidentId_unitId: { incidentId, unitId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.resourceUnit.update({ where: { id: unitId }, data: { status } });
    return this.prisma.resourceAssignment.update({
      where: { incidentId_unitId: { incidentId, unitId } },
      data: { status },
    });
  }

  async unassignUnit(incidentId: string, unitId: string) {
    await this.prisma.resourceAssignment.delete({
      where: { incidentId_unitId: { incidentId, unitId } },
    });
    await this.prisma.resourceUnit.update({ where: { id: unitId }, data: { status: 'Available' } });
  }

  async getAvailableUnits(orgId?: string) {
    return this.prisma.resourceUnit.findMany({
      where: {
        status: 'Available',
        ...(orgId ? { organisationId: orgId } : {}),
      },
      include: { organisation: true },
    });
  }

  async addTimelineEvent(incidentId: string, data: {
    actor?: string;
    organisation?: string;
    category: string;
    text: string;
  }) {
    return this.prisma.timelineEvent.create({ data: { incidentId, ...data } });
  }

  private parseOrgIds(raw: string): string[] {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }
}
