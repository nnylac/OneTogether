import { ApiProperty } from '@nestjs/swagger';
import type {
  organisations as OrganisationModel,
  user_organisations as UserOrganisationModel,
  users as UserModel,
} from '../../../generated/prisma/client';

export type UserWithOrganisations = UserModel & {
  user_organisations: Array<
    UserOrganisationModel & { organisations: OrganisationModel }
  >;
};

export class UserOrganisationResponseDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'SCDF' })
  orgName!: string;

  static fromModel(
    userOrganisation: UserOrganisationModel & {
      organisations: OrganisationModel;
    },
  ): UserOrganisationResponseDto {
    return {
      id: userOrganisation.organisations.id,
      orgName: userOrganisation.organisations.org_name,
    };
  }
}

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

  @ApiProperty({ example: 'user', enum: ['user', 'responder', 'admin'] })
  role!: string;

  @ApiProperty({ type: UserOrganisationResponseDto, isArray: true })
  organisations!: UserOrganisationResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastLogin!: Date | null;

  static fromModel(user: UserWithOrganisations): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isVerified: user.is_verified,
      role: user.role,
      organisations: user.user_organisations.map((userOrganisation) =>
        UserOrganisationResponseDto.fromModel(userOrganisation),
      ),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
    };
  }
}
