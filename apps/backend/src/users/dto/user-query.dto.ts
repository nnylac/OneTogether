import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({
    example: 'responder',
    enum: ['user', 'responder', 'admin'],
  })
  role?: string;

  @ApiPropertyOptional({ example: true })
  isVerified?: boolean | string;

  @ApiPropertyOptional({ example: 'amy' })
  search?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
  })
  organisationId?: string;

  @ApiPropertyOptional({ example: 20 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
