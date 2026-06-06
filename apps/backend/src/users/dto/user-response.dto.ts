import { ApiProperty } from '@nestjs/swagger';
import type { users as UserModel } from '../../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: '50000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'citizen_amy' })
  username!: string;

  @ApiProperty({ example: 'amy.tan@example.sg' })
  email!: string;

  @ApiProperty({ example: 'Amy', nullable: true })
  firstName!: string | null;

  @ApiProperty({ example: 'Tan', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: '+6590000001', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiProperty({ example: 'user', enum: ['user', 'moderator', 'admin'] })
  role!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastLogin!: Date | null;

  static fromModel(user: UserModel): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isVerified: user.is_verified,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
    };
  }
}
