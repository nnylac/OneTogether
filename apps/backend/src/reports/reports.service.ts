import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(incidentId: string, createdBy: string, createdByName: string) {
    const existing = await this.prisma.report.findFirst({ where: { incidentId } });
    if (existing) return existing;
    return this.prisma.report.create({
      data: { incidentId, createdBy, createdByName, title: 'Incident Report' },
    });
  }

  async get(id: string) {
    const r = await this.prisma.report.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Report not found');
    return r;
  }

  async update(id: string, content: string) {
    return this.prisma.report.update({ where: { id }, data: { content, version: { increment: 1 } } });
  }

  async updateTitle(id: string, title: string) {
    return this.prisma.report.update({ where: { id }, data: { title } });
  }

  async finalize(id: string, userId: string, userName: string, incidentId: string) {
    const report = await this.prisma.report.update({
      where: { id },
      data: { status: 'finalized', finalizedBy: userName, finalizedAt: new Date() },
    });
    await this.prisma.timelineEvent.create({
      data: { incidentId, actor: userName, organisation: 'System', category: 'NOTE',
        text: `Incident report finalized by ${userName}. Report locked as official record.` },
    });
    return report;
  }

  async listByIncident(incidentId: string) {
    return this.prisma.report.findMany({ where: { incidentId }, orderBy: { createdAt: 'desc' } });
  }
}
