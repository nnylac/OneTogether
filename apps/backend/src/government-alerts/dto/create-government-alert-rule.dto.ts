import { ApiProperty } from '@nestjs/swagger';

export class CreateGovernmentAlertRuleDto {
  @ApiProperty({ example: 'Open incidents threshold', maxLength: 120 })
  name!: string;

  @ApiProperty({
    example: 'openIncidents',
    enum: [
      'openIncidents',
      'criticalIncidents',
      'hospitalOccupancy',
      'infectiousDiseaseCases',
      'heatInjuryCases',
      'floodReports',
    ],
  })
  metric!: string;

  @ApiProperty({ example: 10 })
  thresholdValue!: number;

  @ApiProperty({ example: 'above', enum: ['above', 'below'] })
  condition!: string;

  @ApiProperty({ example: 'count', enum: ['count', 'percent'] })
  unit!: string;

  @ApiProperty({
    example:
      'Notify government command when open incidents exceed the safe coordination threshold.',
  })
  notificationMessage!: string;
}

