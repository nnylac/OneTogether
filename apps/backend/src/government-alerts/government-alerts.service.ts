import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGovernmentAlertRuleDto } from './dto/create-government-alert-rule.dto';
import {
  GovernmentAlertMetricDefinitionDto,
  GovernmentAlertRuleResponseDto,
} from './dto/government-alert-rule-response.dto';
import { UpdateGovernmentAlertRuleDto } from './dto/update-government-alert-rule.dto';

type AlertCondition = 'above' | 'below';
type AlertStatus = 'Normal' | 'Warning' | 'Critical';
type AlertUnit = 'count' | 'percent';

type AlertMetric =
  | 'openIncidents'
  | 'criticalIncidents'
  | 'hospitalOccupancy'
  | 'infectiousDiseaseCases'
  | 'heatInjuryCases'
  | 'floodReports';

type AlertMetricDefinition = {
  value: AlertMetric;
  label: string;
  description: string;
  defaultUnit: AlertUnit;
  defaultThresholdValue: number;
};

type AlertRuleRow = {
  id: string;
  name: string;
  metric: AlertMetric;
  threshold_value: unknown;
  condition: AlertCondition;
  unit: AlertUnit;
  notification_message: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

const governmentAlertNotificationType = 'government_alert_triggered';

const alertMetricDefinitions: AlertMetricDefinition[] = [
  {
    value: 'openIncidents',
    label: 'Open incidents',
    description: 'Total active incident tickets across agencies',
    defaultUnit: 'count',
    defaultThresholdValue: 10,
  },
  {
    value: 'criticalIncidents',
    label: 'Critical incidents',
    description: 'Active incidents tagged as critical severity',
    defaultUnit: 'count',
    defaultThresholdValue: 5,
  },
  {
    value: 'hospitalOccupancy',
    label: 'Hospital occupancy',
    description: 'Occupied hospital bed share from synced health resources',
    defaultUnit: 'percent',
    defaultThresholdValue: 85,
  },
  {
    value: 'infectiousDiseaseCases',
    label: 'Infectious disease cases',
    description: 'Active incident reports classified as disease outbreaks',
    defaultUnit: 'count',
    defaultThresholdValue: 80,
  },
  {
    value: 'heatInjuryCases',
    label: 'Heat injury cases',
    description: 'Active reports mentioning heat injury or heat stress',
    defaultUnit: 'count',
    defaultThresholdValue: 35,
  },
  {
    value: 'floodReports',
    label: 'Flood reports',
    description: 'Active flood-related incident reports',
    defaultUnit: 'count',
    defaultThresholdValue: 12,
  },
];

@Injectable()
export class GovernmentAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findMetricDefinitions(): Promise<GovernmentAlertMetricDefinitionDto[]> {
    const currentValues = await this.getCurrentMetricValues();

    return alertMetricDefinitions.map((definition) => ({
      ...definition,
      currentValue: currentValues[definition.value],
    }));
  }

  async findAll(filters: { status?: string } = {}) {
    const rows = await this.findRuleRows();
    const currentValues = await this.getCurrentMetricValues();
    const rules = rows.map((row) => this.toResponseDto(row, currentValues));
    const status = this.normalizeOptionalStatus(filters.status);

    return status ? rules.filter((rule) => rule.status === status) : rules;
  }

  async create(dto: CreateGovernmentAlertRuleDto) {
    const metric = this.toMetric(dto.metric);
    const condition = this.toCondition(dto.condition);
    const unit = this.toUnit(dto.unit);
    const thresholdValue = this.toPositiveNumber(
      dto.thresholdValue,
      'thresholdValue',
    );

    this.validateRequiredString(dto.name, 'name', 120);
    this.validateRequiredString(dto.notificationMessage, 'notificationMessage');

    const rows = await this.prisma.$queryRaw<AlertRuleRow[]>`
      INSERT INTO government_alert_rules (
        name,
        metric,
        threshold_value,
        condition,
        unit,
        notification_message
      )
      VALUES (
        ${dto.name.trim()},
        ${metric},
        ${thresholdValue},
        ${condition},
        ${unit},
        ${dto.notificationMessage.trim()}
      )
      RETURNING
        id,
        name,
        metric,
        threshold_value,
        condition,
        unit,
        notification_message,
        is_enabled,
        created_at,
        updated_at
    `;

    const rule = await this.toLiveRule(rows[0]);
    await this.notifyIfCritical(rule);
    return rule;
  }

  async update(id: string, dto: UpdateGovernmentAlertRuleDto) {
    const existingRule = await this.findRuleRowById(id);

    if (!existingRule) {
      throw new NotFoundException('Government alert rule not found');
    }

    const nextName =
      dto.name === undefined
        ? existingRule.name
        : this.validateRequiredString(dto.name, 'name', 120);
    const nextThreshold =
      dto.thresholdValue === undefined
        ? this.decimalToNumber(existingRule.threshold_value)
        : this.toPositiveNumber(dto.thresholdValue, 'thresholdValue');
    const nextCondition =
      dto.condition === undefined
        ? existingRule.condition
        : this.toCondition(dto.condition);
    const nextUnit =
      dto.unit === undefined ? existingRule.unit : this.toUnit(dto.unit);
    const nextNotificationMessage =
      dto.notificationMessage === undefined
        ? existingRule.notification_message
        : this.validateRequiredString(
            dto.notificationMessage,
            'notificationMessage',
          );
    const nextIsEnabled =
      dto.isEnabled === undefined ? existingRule.is_enabled : dto.isEnabled;

    const rows = await this.prisma.$queryRaw<AlertRuleRow[]>`
      UPDATE government_alert_rules
      SET
        name = ${nextName},
        threshold_value = ${nextThreshold},
        condition = ${nextCondition},
        unit = ${nextUnit},
        notification_message = ${nextNotificationMessage},
        is_enabled = ${nextIsEnabled},
        updated_at = NOW()
      WHERE id = ${id}::uuid
        AND deleted_at IS NULL
      RETURNING
        id,
        name,
        metric,
        threshold_value,
        condition,
        unit,
        notification_message,
        is_enabled,
        created_at,
        updated_at
    `;

    const rule = await this.toLiveRule(rows[0]);
    await this.notifyIfCritical(rule);
    return rule;
  }

  async delete(id: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE government_alert_rules
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id}::uuid
        AND deleted_at IS NULL
      RETURNING id
    `;

    if (rows.length === 0) {
      throw new NotFoundException('Government alert rule not found');
    }

    return { id, deleted: true as const };
  }

  private async toLiveRule(
    row: AlertRuleRow,
  ): Promise<GovernmentAlertRuleResponseDto> {
    const currentValues = await this.getCurrentMetricValues();
    return this.toResponseDto(row, currentValues);
  }

  private async findRuleRows() {
    return this.prisma.$queryRaw<AlertRuleRow[]>`
      SELECT
        id,
        name,
        metric,
        threshold_value,
        condition,
        unit,
        notification_message,
        is_enabled,
        created_at,
        updated_at
      FROM government_alert_rules
      WHERE deleted_at IS NULL
      ORDER BY created_at ASC
    `;
  }

  private async findRuleRowById(id: string) {
    const rows = await this.prisma.$queryRaw<AlertRuleRow[]>`
      SELECT
        id,
        name,
        metric,
        threshold_value,
        condition,
        unit,
        notification_message,
        is_enabled,
        created_at,
        updated_at
      FROM government_alert_rules
      WHERE id = ${id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private toResponseDto(
    row: AlertRuleRow,
    currentValues: Record<AlertMetric, number>,
  ): GovernmentAlertRuleResponseDto {
    const currentValue = currentValues[row.metric] ?? 0;
    const thresholdValue = this.decimalToNumber(row.threshold_value);

    return {
      id: row.id,
      name: row.name,
      metric: row.metric,
      currentValue,
      thresholdValue,
      condition: row.condition,
      unit: row.unit,
      status: row.is_enabled
        ? this.calculateAlertStatus(currentValue, thresholdValue, row.condition)
        : 'Normal',
      notificationMessage: row.notification_message,
      isEnabled: row.is_enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async getCurrentMetricValues(): Promise<Record<AlertMetric, number>> {
    const [
      openIncidents,
      criticalIncidents,
      hospitalOccupancy,
      infectiousDiseaseCases,
      heatInjuryCases,
      floodReports,
    ] = await Promise.all([
      this.countOpenIncidents(),
      this.countCriticalIncidents(),
      this.calculateHospitalOccupancy(),
      this.countTextIncidentMetric('disease|outbreak|infectious'),
      this.countTextIncidentMetric('heat|heat injury|heat stress'),
      this.countTextIncidentMetric('flood|flooding'),
    ]);

    return {
      openIncidents,
      criticalIncidents,
      hospitalOccupancy,
      infectiousDiseaseCases,
      heatInjuryCases,
      floodReports,
    };
  }

  private async countOpenIncidents() {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM incidents
      WHERE UPPER(TRIM(inc_status)) NOT IN ('CLOSED', 'RESOLVED')
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async countCriticalIncidents() {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM incidents
      WHERE severity = 5
        AND UPPER(TRIM(inc_status)) NOT IN ('CLOSED', 'RESOLVED')
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async countTextIncidentMetric(pattern: string) {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM incidents
      WHERE UPPER(TRIM(inc_status)) NOT IN ('CLOSED', 'RESOLVED')
        AND (
          incident_type ~* ${pattern}
          OR COALESCE(category, '') ~* ${pattern}
          OR COALESCE(title, '') ~* ${pattern}
          OR COALESCE(inc_description, '') ~* ${pattern}
        )
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async calculateHospitalOccupancy() {
    const rows = await this.prisma.$queryRaw<Array<{ occupancy: number }>>`
      SELECT
        COALESCE(
          ROUND(
            (
              (SUM(ri.total) - SUM(ri.available))::numeric /
              NULLIF(SUM(ri.total), 0)
            ) * 100
          ),
          0
        )::int AS occupancy
      FROM resource_inventory ri
      INNER JOIN resource_outlets ro ON ro.id = ri.outlet_id
      WHERE UPPER(ro.agency_id) IN ('SINGHEALTH', 'NUHS', 'MOH', 'SGH', 'NUH')
        AND (
          ri.resource_category ILIKE '%bed%'
          OR ri.resource_name ILIKE '%bed%'
          OR ri.resource_category ILIKE '%capacity%'
          OR ri.resource_name ILIKE '%capacity%'
        )
    `;

    return Number(rows[0]?.occupancy ?? 0);
  }

  private calculateAlertStatus(
    currentValue: number,
    thresholdValue: number,
    condition: AlertCondition,
  ): AlertStatus {
    if (thresholdValue <= 0) {
      return 'Normal';
    }

    if (condition === 'above') {
      if (currentValue >= thresholdValue) return 'Critical';
      if (currentValue >= thresholdValue * 0.8) return 'Warning';
      return 'Normal';
    }

    if (currentValue <= thresholdValue) return 'Critical';
    if (currentValue <= thresholdValue * 1.2) return 'Warning';
    return 'Normal';
  }

  private async notifyIfCritical(rule: GovernmentAlertRuleResponseDto) {
    if (rule.status !== 'Critical') {
      return;
    }

    await this.notificationsService.create({
      title: `${rule.name} triggered`,
      message: `${rule.notificationMessage} Current: ${this.formatAlertValue(
        rule.currentValue,
        rule.unit,
      )} - Threshold: ${this.formatAlertValue(
        rule.thresholdValue,
        rule.unit,
      )}.`,
      notificationType: governmentAlertNotificationType,
      referenceType: 'government_alert_rule',
      referenceId: rule.id,
      metadata: {
        alertRuleId: rule.id,
        condition: rule.condition,
        currentValue: rule.currentValue,
        metric: rule.metric,
        status: rule.status,
        thresholdValue: rule.thresholdValue,
        unit: rule.unit,
      },
      recipients: [
        {
          recipientType: 'role',
          recipientRole: 'government',
        },
      ],
    });
  }

  private formatAlertValue(value: number, unit: AlertUnit) {
    return unit === 'percent' ? `${value}%` : value.toString();
  }

  private normalizeOptionalStatus(status: string | undefined) {
    if (!status) return undefined;
    const normalized = status.trim();
    if (['Normal', 'Warning', 'Critical'].includes(normalized)) {
      return normalized as AlertStatus;
    }
    throw new BadRequestException(
      'status must be Normal, Warning, or Critical',
    );
  }

  private toMetric(value: string): AlertMetric {
    if (
      alertMetricDefinitions.some((definition) => definition.value === value)
    ) {
      return value as AlertMetric;
    }
    throw new BadRequestException('Invalid alert metric');
  }

  private toCondition(value: string): AlertCondition {
    if (value === 'above' || value === 'below') {
      return value;
    }
    throw new BadRequestException('condition must be above or below');
  }

  private toUnit(value: string): AlertUnit {
    if (value === 'count' || value === 'percent') {
      return value;
    }
    throw new BadRequestException('unit must be count or percent');
  }

  private toPositiveNumber(value: unknown, field: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive number`);
    }
    return parsed;
  }

  private validateRequiredString(
    value: string | undefined,
    field: string,
    maxLength?: number,
  ) {
    if (!value?.trim()) {
      throw new BadRequestException(`${field} cannot be empty`);
    }

    const trimmed = value.trim();
    if (maxLength !== undefined && trimmed.length > maxLength) {
      throw new BadRequestException(
        `${field} cannot exceed ${maxLength} characters`,
      );
    }

    return trimmed;
  }

  private decimalToNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
