import { ApiProperty } from '@nestjs/swagger';

export class GovernmentAlertMetricDefinitionDto {
  @ApiProperty({ example: 'openIncidents' })
  value!: string;

  @ApiProperty({ example: 'Open incidents' })
  label!: string;

  @ApiProperty({ example: 'Total active incident tickets across agencies' })
  description!: string;

  @ApiProperty({ example: 'count', enum: ['count', 'percent'] })
  defaultUnit!: 'count' | 'percent';

  @ApiProperty({ example: 10 })
  defaultThresholdValue!: number;

  @ApiProperty({ example: 13 })
  currentValue!: number;
}

export class GovernmentAlertRuleResponseDto {
  @ApiProperty({ example: '40000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Open incidents threshold' })
  name!: string;

  @ApiProperty({ example: 'openIncidents' })
  metric!: string;

  @ApiProperty({ example: 13 })
  currentValue!: number;

  @ApiProperty({ example: 10 })
  thresholdValue!: number;

  @ApiProperty({ example: 'above', enum: ['above', 'below'] })
  condition!: 'above' | 'below';

  @ApiProperty({ example: 'count', enum: ['count', 'percent'] })
  unit!: 'count' | 'percent';

  @ApiProperty({ example: 'Critical', enum: ['Normal', 'Warning', 'Critical'] })
  status!: 'Normal' | 'Warning' | 'Critical';

  @ApiProperty({
    example:
      'Notify government command when open incidents exceed the safe coordination threshold.',
  })
  notificationMessage!: string;

  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

