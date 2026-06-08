import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ResourceInventoryFilters,
  ResourceOutletFilters,
  ResourcesRepository,
} from './resources.repository';

type ExternalResourceFeed = {
  agencyId: string;
  systemId: string;
  generatedAt: string;
  outlets: ExternalResourceOutlet[];
};

type ExternalResourceOutlet = {
  externalOutletId: string;
  name: string;
  type: string;
  region?: string | null;
  address?: string | null;
  location?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  resources: ExternalResourceItem[];
};

type ExternalResourceItem = {
  externalResourceId: string;
  name: string;
  category: string;
  unit?: string | null;
  total: number;
  available: number;
  deployed: number;
  reserved: number;
  maintenance: number;
};

type ResourceTotals = {
  total: number;
  available: number;
  deployed: number;
  reserved: number;
  maintenance: number;
};

type ResourceStatus = 'healthy' | 'strained' | 'critical';

const emptyTotals: ResourceTotals = {
  total: 0,
  available: 0,
  deployed: 0,
  reserved: 0,
  maintenance: 0,
};

@Injectable()
export class ResourcesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResourcesService.name);
  private pollTimer?: NodeJS.Timeout;
  private isPolling = false;

  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  onModuleInit() {
    if (!this.isPollingEnabled()) {
      this.logger.log('Resource polling is disabled');
      return;
    }

    const intervalMs = this.getPollingIntervalMs();

    this.pollTimer = setInterval(() => {
      void this.pollResources();
    }, intervalMs);

    void this.pollResources();
    this.logger.log(`Resource polling started; interval=${intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  async syncResources() {
    const sources = this.getResourceSources();

    if (sources.length === 0) {
      throw new BadRequestException('No resource sync sources are configured');
    }

    const results: Array<{
      agencyId: string;
      status: string;
      outletCount?: number;
      resourceCount?: number;
      generatedAt?: Date;
      error?: string;
    }> = [];

    for (const source of sources) {
      try {
        const feed = await this.fetchResourceFeed(source.url);
        const syncResult = await this.syncFeed(feed);
        results.push({
          agencyId: feed.agencyId,
          status: 'synced',
          ...syncResult,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown sync error';
        this.logger.warn(
          `Resource sync failed for ${source.agencyId} (${source.url}): ${message}`,
        );
        results.push({
          agencyId: source.agencyId,
          status: 'failed',
          error: message,
        });
      }
    }

    return {
      syncedAt: new Date(),
      results,
    };
  }

  private async pollResources() {
    if (this.isPolling) {
      this.logger.warn('Skipping resource poll because a previous poll is still running');
      return;
    }

    this.isPolling = true;

    try {
      const result = await this.syncResources();
      const syncedCount = result.results.filter(
        (syncResult) => syncResult.status === 'synced',
      ).length;
      const failedCount = result.results.length - syncedCount;
      this.logger.log(
        `Resource poll finished; synced=${syncedCount}, failed=${failedCount}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown polling error';
      this.logger.warn(`Resource poll failed: ${message}`);
    } finally {
      this.isPolling = false;
    }
  }

  async findSummary(filters: ResourceInventoryFilters = {}) {
    const inventory = await this.resourcesRepository.findInventory(filters);
    const totals = inventory.reduce(
      (current, resource) => this.addTotals(current, resource),
      { ...emptyTotals },
    );

    return {
      lastSyncedAt: this.latestDate([
        ...inventory.map((resource) => resource.last_synced_at),
        ...inventory.map((resource) => resource.resource_outlets.last_synced_at),
      ]),
      totals,
      byAgency: this.groupTotals(
        inventory,
        (resource) => resource.resource_outlets.agency_id,
      ),
      byCategory: this.groupTotals(
        inventory,
        (resource) => resource.resource_category,
      ),
      criticalOutlets: this.groupInventoryByOutlet(inventory)
        .filter((outlet) => outlet.status === 'critical'),
    };
  }

  async findOutlets(filters: ResourceOutletFilters = {}) {
    const outlets = await this.resourcesRepository.findOutlets(filters);
    return outlets.map((outlet) => this.toOutletDto(outlet));
  }

  async findOutlet(id: string) {
    const outlet = await this.resourcesRepository.findOutletById(id);

    if (!outlet) {
      throw new NotFoundException('Resource outlet not found');
    }

    return this.toOutletDto(outlet);
  }

  async findInventory(filters: ResourceInventoryFilters = {}) {
    const inventory = await this.resourcesRepository.findInventory(filters);
    return inventory.map((resource) => this.toInventoryDto(resource));
  }

  private async syncFeed(feed: ExternalResourceFeed) {
    const normalizedFeed = this.validateFeed(feed);
    let outletCount = 0;
    let resourceCount = 0;

    for (const outlet of normalizedFeed.outlets) {
      const syncedOutlet = await this.resourcesRepository.upsertOutlet({
        agencyId: normalizedFeed.agencyId,
        externalOutletId: outlet.externalOutletId,
        name: outlet.name,
        outletType: outlet.type,
        region: outlet.region,
        address: outlet.address,
        latitude: outlet.location?.lat,
        longitude: outlet.location?.lng,
        sourceSystemId: normalizedFeed.systemId,
        lastSyncedAt: normalizedFeed.generatedAt,
      });
      outletCount += 1;

      for (const resource of outlet.resources) {
        await this.resourcesRepository.upsertInventory({
          outletId: syncedOutlet.id,
          externalResourceId: resource.externalResourceId,
          resourceName: resource.name,
          resourceCategory: resource.category,
          unit: resource.unit,
          total: resource.total,
          available: resource.available,
          deployed: resource.deployed,
          reserved: resource.reserved,
          maintenance: resource.maintenance,
          lastSyncedAt: normalizedFeed.generatedAt,
        });
        resourceCount += 1;
      }
    }

    return {
      outletCount,
      resourceCount,
      generatedAt: normalizedFeed.generatedAt,
    };
  }

  private async fetchResourceFeed(url: string): Promise<ExternalResourceFeed> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Resource endpoint returned ${response.status}`);
    }

    return (await response.json()) as ExternalResourceFeed;
  }

  private validateFeed(feed: ExternalResourceFeed) {
    this.validateRequiredString(feed.agencyId, 'agencyId');
    this.validateRequiredString(feed.systemId, 'systemId');
    const generatedAt = this.parseDate(feed.generatedAt, 'generatedAt');

    if (!Array.isArray(feed.outlets)) {
      throw new Error('outlets must be an array');
    }

    return {
      agencyId: feed.agencyId.trim(),
      systemId: feed.systemId.trim(),
      generatedAt,
      outlets: feed.outlets.map((outlet, index) =>
        this.validateOutlet(outlet, index),
      ),
    };
  }

  private validateOutlet(outlet: ExternalResourceOutlet, index: number) {
    const label = `outlets[${index}]`;
    this.validateRequiredString(outlet.externalOutletId, `${label}.externalOutletId`);
    this.validateRequiredString(outlet.name, `${label}.name`);
    this.validateRequiredString(outlet.type, `${label}.type`);

    if (!Array.isArray(outlet.resources)) {
      throw new Error(`${label}.resources must be an array`);
    }

    return {
      externalOutletId: outlet.externalOutletId.trim(),
      name: outlet.name.trim(),
      type: outlet.type.trim(),
      region: this.normalizeOptionalString(outlet.region),
      address: this.normalizeOptionalString(outlet.address),
      location: {
        lat: this.parseOptionalNumber(outlet.location?.lat, `${label}.location.lat`),
        lng: this.parseOptionalNumber(outlet.location?.lng, `${label}.location.lng`),
      },
      resources: outlet.resources.map((resource, resourceIndex) =>
        this.validateResource(resource, `${label}.resources[${resourceIndex}]`),
      ),
    };
  }

  private validateResource(resource: ExternalResourceItem, label: string) {
    this.validateRequiredString(
      resource.externalResourceId,
      `${label}.externalResourceId`,
    );
    this.validateRequiredString(resource.name, `${label}.name`);
    this.validateRequiredString(resource.category, `${label}.category`);

    return {
      externalResourceId: resource.externalResourceId.trim(),
      name: resource.name.trim(),
      category: resource.category.trim(),
      unit: this.normalizeOptionalString(resource.unit) ?? 'count',
      total: this.parseCount(resource.total, `${label}.total`),
      available: this.parseCount(resource.available, `${label}.available`),
      deployed: this.parseCount(resource.deployed, `${label}.deployed`),
      reserved: this.parseCount(resource.reserved, `${label}.reserved`),
      maintenance: this.parseCount(resource.maintenance, `${label}.maintenance`),
    };
  }

  private toOutletDto(outlet: any) {
    const resources = (outlet.resource_inventory ?? []).map((resource) =>
      this.toResourceDto(resource),
    );
    const totals = resources.reduce(
      (current, resource) => this.addTotals(current, resource),
      { ...emptyTotals },
    );

    return {
      id: outlet.id,
      agencyId: outlet.agency_id,
      externalOutletId: outlet.external_outlet_id,
      name: outlet.name,
      type: outlet.outlet_type,
      region: outlet.region,
      address: outlet.address,
      location: {
        lat: this.decimalToNumber(outlet.latitude),
        lng: this.decimalToNumber(outlet.longitude),
      },
      sourceSystemId: outlet.source_system_id,
      lastSyncedAt: outlet.last_synced_at,
      totals,
      status: this.getStatus(totals),
      resources,
    };
  }

  private toInventoryDto(resource: any) {
    return {
      ...this.toResourceDto(resource),
      outlet: {
        id: resource.resource_outlets.id,
        agencyId: resource.resource_outlets.agency_id,
        externalOutletId: resource.resource_outlets.external_outlet_id,
        name: resource.resource_outlets.name,
        type: resource.resource_outlets.outlet_type,
        region: resource.resource_outlets.region,
      },
    };
  }

  private toResourceDto(resource: any) {
    const totals = {
      total: resource.total,
      available: resource.available,
      deployed: resource.deployed,
      reserved: resource.reserved,
      maintenance: resource.maintenance,
    };

    return {
      id: resource.id,
      externalResourceId: resource.external_resource_id,
      name: resource.resource_name,
      category: resource.resource_category,
      unit: resource.unit,
      ...totals,
      status: this.getStatus(totals),
      lastSyncedAt: resource.last_synced_at,
    };
  }

  private groupTotals(
    inventory: any[],
    getKey: (resource: any) => string | null,
  ) {
    const groups = new Map<string, ResourceTotals>();

    for (const resource of inventory) {
      const key = getKey(resource) ?? 'Unknown';
      const current = groups.get(key) ?? { ...emptyTotals };
      groups.set(key, this.addTotals(current, resource));
    }

    return [...groups.entries()]
      .map(([key, totals]) => ({
        key,
        totals,
        status: this.getStatus(totals),
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  private groupInventoryByOutlet(inventory: any[]) {
    const outlets = new Map<string, any>();

    for (const resource of inventory) {
      const outlet = resource.resource_outlets;
      const current = outlets.get(outlet.id) ?? {
        ...outlet,
        resource_inventory: [],
      };

      current.resource_inventory.push(resource);
      outlets.set(outlet.id, current);
    }

    return [...outlets.values()].map((outlet) => this.toOutletDto(outlet));
  }

  private addTotals(current: ResourceTotals, resource: ResourceTotals) {
    return {
      total: current.total + resource.total,
      available: current.available + resource.available,
      deployed: current.deployed + resource.deployed,
      reserved: current.reserved + resource.reserved,
      maintenance: current.maintenance + resource.maintenance,
    };
  }

  private getStatus(totals: ResourceTotals): ResourceStatus {
    if (totals.total <= 0) {
      return 'critical';
    }

    const availableRatio = totals.available / totals.total;

    if (availableRatio < 0.15) {
      return 'critical';
    }

    if (availableRatio < 0.4) {
      return 'strained';
    }

    return 'healthy';
  }

  private latestDate(values: Array<Date | string | null | undefined>) {
    const timestamps = values
      .map((value) => (value ? new Date(value).getTime() : Number.NaN))
      .filter((value) => !Number.isNaN(value));

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps));
  }

  private decimalToNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private getResourceSources() {
    return [
      ['SCDF', 'SCDF_RESOURCES_URL', 'http://localhost:8102/resources'],
      ['SPF', 'SPF_RESOURCES_URL', 'http://localhost:8101/resources'],
      [
        'SINGHEALTH',
        'SINGHEALTH_RESOURCES_URL',
        'http://localhost:8103/resources',
      ],
      ['NUHS', 'NUHS_RESOURCES_URL', 'http://localhost:8104/resources'],
      ['PUB', 'PUB_RESOURCES_URL', 'http://localhost:8106/resources'],
      ['NEA', 'NEA_RESOURCES_URL', 'http://localhost:8107/resources'],
      [
        'TOWN_COUNCIL',
        'TOWNCOUNCIL_RESOURCES_URL',
        'http://localhost:8105/resources',
      ],
    ]
      .map(([agencyId, envKey, defaultUrl]) => ({
        agencyId,
        url: process.env[envKey] ?? defaultUrl,
      }))
      .filter((source) => source.url.trim().length > 0);
  }

  private isPollingEnabled() {
    return process.env.RESOURCE_SYNC_ENABLED !== 'false';
  }

  private getPollingIntervalMs() {
    const configuredInterval = Number(process.env.RESOURCE_SYNC_INTERVAL_MS);

    if (
      Number.isInteger(configuredInterval) &&
      configuredInterval >= 10_000
    ) {
      return configuredInterval;
    }

    return 60_000;
  }

  private validateRequiredString(value: string | undefined, field: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${field} is required`);
    }
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private parseDate(value: string, field: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`${field} must be a valid date`);
    }

    return parsed;
  }

  private parseOptionalNumber(
    value: number | null | undefined,
    field: string,
  ) {
    if (value === null || value === undefined) {
      return null;
    }

    if (!Number.isFinite(value)) {
      throw new Error(`${field} must be a finite number`);
    }

    return value;
  }

  private parseCount(value: number, field: string) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${field} must be a non-negative integer`);
    }

    return value;
  }
}
