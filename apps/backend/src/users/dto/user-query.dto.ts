import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({
    example: 'moderator',
    enum: ['user', 'moderator', 'admin'],
  })
  role?: string;

  @ApiPropertyOptional({ example: true })
  isVerified?: boolean | string;

  @ApiPropertyOptional({ example: 'amy' })
  search?: string;

  @ApiPropertyOptional({ example: 20 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
