import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Amy' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Tan' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+6590000001' })
  phone?: string;

  @ApiPropertyOptional({ example: true })
  isVerified?: boolean;

  @ApiPropertyOptional({
    example: 'moderator',
    enum: ['user', 'moderator', 'admin'],
  })
  role?: string;
}
