import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGovernmentAlertRuleDto {
  @ApiPropertyOptional({ example: 'Open incidents threshold', maxLength: 120 })
  name?: string;

  @ApiPropertyOptional({ example: 10 })
  thresholdValue?: number;

  @ApiPropertyOptional({ example: 'above', enum: ['above', 'below'] })
  condition?: string;

  @ApiPropertyOptional({ example: 'count', enum: ['count', 'percent'] })
  unit?: string;

  @ApiPropertyOptional({
    example:
      'Notify government command when open incidents exceed the safe coordination threshold.',
  })
  notificationMessage?: string;

  @ApiPropertyOptional({ example: true })
  isEnabled?: boolean;
}

