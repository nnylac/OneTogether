import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('incidents/:incidentId/pois')
export class PoisController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Param('incidentId') incidentId: string) {
    return this.prisma.incidentPOI.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  create(
    @Param('incidentId') incidentId: string,
    @Body() body: { title: string; description?: string; latitude: number; longitude: number; type?: string; createdBy: string },
  ) {
    return this.prisma.incidentPOI.create({
      data: { incidentId, ...body, type: body.type ?? 'OTHER' },
    });
  }

  @Delete(':poiId')
  remove(@Param('poiId') id: string) {
    return this.prisma.incidentPOI.delete({ where: { id } });
  }
}
