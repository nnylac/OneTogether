import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ResourceOutletFilters = {
  agencyId?: string;
  outletType?: string;
  region?: string;
};

export type ResourceInventoryFilters = ResourceOutletFilters & {
  resourceCategory?: string;
};

export type UpsertResourceOutletInput = {
  agencyId: string;
  externalOutletId: string;
  name: string;
  outletType: string;
  region?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sourceSystemId: string;
  lastSyncedAt: Date;
};

export type UpsertResourceInventoryInput = {
  outletId: string;
  externalResourceId: string;
  resourceName: string;
  resourceCategory: string;
  unit: string;
  total: number;
  available: number;
  deployed: number;
  reserved: number;
  maintenance: number;
  lastSyncedAt: Date;
};

@Injectable()
export class ResourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOutlets(filters: ResourceOutletFilters = {}) {
    return this.resourceOutlets.findMany({
      where: this.buildOutletWhere(filters),
      include: {
        resource_inventory: {
          orderBy: [{ resource_category: 'asc' }, { resource_name: 'asc' }],
        },
      },
      orderBy: [
        { agency_id: 'asc' },
        { region: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  findOutletById(id: string) {
    return this.resourceOutlets.findUnique({
      where: { id },
      include: {
        resource_inventory: {
          orderBy: [{ resource_category: 'asc' }, { resource_name: 'asc' }],
        },
      },
    });
  }

  findInventory(filters: ResourceInventoryFilters = {}) {
    return this.resourceInventory.findMany({
      where: {
        resource_category: filters.resourceCategory,
        resource_outlets: this.buildOutletWhere(filters),
      },
      include: {
        resource_outlets: true,
      },
      orderBy: [
        { resource_category: 'asc' },
        { resource_name: 'asc' },
      ],
    });
  }

  async upsertOutlet(input: UpsertResourceOutletInput) {
    const organisation = await this.prisma.organisations.findUnique({
      where: { org_name: input.agencyId },
      select: { id: true },
    });

    return this.resourceOutlets.upsert({
      where: {
        agency_id_external_outlet_id: {
          agency_id: input.agencyId,
          external_outlet_id: input.externalOutletId,
        },
      },
      create: {
        agency_id: input.agencyId,
        external_outlet_id: input.externalOutletId,
        organisation_id: organisation?.id ?? null,
        name: input.name,
        outlet_type: input.outletType,
        region: input.region,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        source_system_id: input.sourceSystemId,
        last_synced_at: input.lastSyncedAt,
      },
      update: {
        organisation_id: organisation?.id ?? null,
        name: input.name,
        outlet_type: input.outletType,
        region: input.region,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        source_system_id: input.sourceSystemId,
        last_synced_at: input.lastSyncedAt,
      },
    });
  }

  upsertInventory(input: UpsertResourceInventoryInput) {
    return this.resourceInventory.upsert({
      where: {
        outlet_id_external_resource_id: {
          outlet_id: input.outletId,
          external_resource_id: input.externalResourceId,
        },
      },
      create: {
        outlet_id: input.outletId,
        external_resource_id: input.externalResourceId,
        resource_name: input.resourceName,
        resource_category: input.resourceCategory,
        unit: input.unit,
        total: input.total,
        available: input.available,
        deployed: input.deployed,
        reserved: input.reserved,
        maintenance: input.maintenance,
        last_synced_at: input.lastSyncedAt,
      },
      update: {
        resource_name: input.resourceName,
        resource_category: input.resourceCategory,
        unit: input.unit,
        total: input.total,
        available: input.available,
        deployed: input.deployed,
        reserved: input.reserved,
        maintenance: input.maintenance,
        last_synced_at: input.lastSyncedAt,
      },
    });
  }

  private buildOutletWhere(filters: ResourceOutletFilters = {}) {
    return {
      agency_id: filters.agencyId,
      outlet_type: filters.outletType,
      region: filters.region,
    };
  }

  private get resourceOutlets() {
    return (this.prisma as unknown as { resource_outlets: any })
      .resource_outlets;
  }

  private get resourceInventory() {
    return (this.prisma as unknown as { resource_inventory: any })
      .resource_inventory;
  }
}
