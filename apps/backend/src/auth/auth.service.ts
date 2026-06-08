import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHash,
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginAccountDto } from './dto/login-account.dto';
import { LogoutAccountDto } from './dto/logout-account.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly allowedRoles = new Set(['user', 'responder', 'admin']);
  private readonly accessTokenTtl = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  private readonly refreshTokenTtl = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  constructor(private readonly prisma: PrismaService) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    this.assertCreateAccountDto(createAccountDto);
    const role = createAccountDto.role ?? 'user';
    this.validateRole(role);
    this.validateOrganisationRequirement(role, createAccountDto);

    const passwordHash = this.hashPassword(createAccountDto.password);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.users.create({
          data: {
            username: createAccountDto.username,
            email: createAccountDto.email,
            first_name: createAccountDto.first_name,
            last_name: createAccountDto.last_name,
            phone: createAccountDto.phone,
            role,
            user_organisations: {
              create: (createAccountDto.organisationIds ?? []).map(
                (organisationId) => ({
                  organisations: { connect: { id: organisationId } },
                }),
              ),
            },
          },
          include: this.userOrganisationInclude,
        });

        const account = await tx.accounts.create({
          data: {
            user_id: user.id,
            password_hash: passwordHash,
          },
        });

        const tokens = this.issueTokens({
          userId: user.id,
          accountId: account.id,
          role: user.role,
        });

        await tx.refresh_tokens.create({
          data: {
            account_id: account.id,
            refresh_token_hash: this.hashToken(tokens.refreshToken),
            expires_at: tokens.refreshTokenExpiresAt,
          },
        });

        return { user, tokens };
      });

      return {
        user: this.toSafeUser(result.user),
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Username or email already exists');
      }

      throw error;
    }
  }

  async login(loginAccountDto: LoginAccountDto) {
    this.assertLoginDto(loginAccountDto);

    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          { email: loginAccountDto.identifier },
          { username: loginAccountDto.identifier },
        ],
      },
      include: {
        accounts: true,
        user_organisations: {
          include: {
            organisations: true,
          },
        },
      },
    });

    if (!user?.accounts) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = this.verifyPassword(
      loginAccountDto.password,
      user.accounts.password_hash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.issueTokens({
      userId: user.id,
      accountId: user.accounts.id,
      role: user.role,
    });

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      }),
      this.prisma.refresh_tokens.create({
        data: {
          account_id: user.accounts.id,
          refresh_token_hash: this.hashToken(tokens.refreshToken),
          expires_at: tokens.refreshTokenExpiresAt,
        },
      }),
    ]);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }

    this.verifyJwt(refreshTokenDto.refreshToken, this.refreshTokenSecret);

    const storedToken = await this.prisma.refresh_tokens.findFirst({
      where: {
        refresh_token_hash: this.hashToken(refreshTokenDto.refreshToken),
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: {
        accounts: {
          include: { users: true },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.signJwt(
      {
        sub: storedToken.accounts.users.id,
        accountId: storedToken.accounts.id,
        role: storedToken.accounts.users.role,
        typ: 'access',
      },
      this.accessTokenSecret,
      this.accessTokenTtl,
    );

    return { accessToken };
  }

  async logout(logoutAccountDto: LogoutAccountDto) {
    if (!logoutAccountDto.refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }

    await this.prisma.refresh_tokens.updateMany({
      where: {
        refresh_token_hash: this.hashToken(logoutAccountDto.refreshToken),
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });

    return { success: true };
  }

  private issueTokens(input: {
    userId: string;
    accountId: string;
    role: string;
  }) {
    const accessToken = this.signJwt(
      {
        sub: input.userId,
        accountId: input.accountId,
        role: input.role,
        typ: 'access',
      },
      this.accessTokenSecret,
      this.accessTokenTtl,
    );

    const refreshToken = this.signJwt(
      {
        sub: input.userId,
        accountId: input.accountId,
        typ: 'refresh',
      },
      this.refreshTokenSecret,
      this.refreshTokenTtl,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: this.getJwtExpiry(refreshToken),
    };
  }

  private signJwt(
    payload: Record<string, string | number>,
    secret: string,
    expiresIn: string,
  ) {
    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + this.durationToSeconds(expiresIn),
    };

    const header = this.toBase64Url({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = this.toBase64Url(body);
    const unsignedToken = `${header}.${encodedPayload}`;
    const signature = this.signToken(unsignedToken, secret);

    return `${unsignedToken}.${signature}`;
  }

  private verifyJwt(token: string, secret: string) {
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.signToken(`${header}.${payload}`, secret);
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const parsedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp?: number; typ?: string };

    if (
      !parsedPayload.exp ||
      parsedPayload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new UnauthorizedException('Token expired');
    }

    return parsedPayload;
  }

  private getJwtExpiry(token: string) {
    const [, payload] = token.split('.');
    const parsedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp: number };

    return new Date(parsedPayload.exp * 1000);
  }

  private signToken(unsignedToken: string, secret: string) {
    return createHmac('sha256', secret)
      .update(unsignedToken)
      .digest('base64url');
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('base64url');
    const iterations = 210000;
    const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');

    return `pbkdf2_sha256$${iterations}$${salt}$${key.toString('base64url')}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [algorithm, iterations, salt, storedKey] = passwordHash.split('$');

    if (algorithm !== 'pbkdf2_sha256' || !iterations || !salt || !storedKey) {
      return false;
    }

    const key = pbkdf2Sync(
      password,
      salt,
      Number(iterations),
      32,
      'sha256',
    ).toString('base64url');

    const keyBuffer = Buffer.from(key);
    const storedKeyBuffer = Buffer.from(storedKey);

    return (
      keyBuffer.length === storedKeyBuffer.length &&
      timingSafeEqual(keyBuffer, storedKeyBuffer)
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toBase64Url(value: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private durationToSeconds(duration: string) {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    if (unit === 'h') return value * 60 * 60;

    return value * 60 * 60 * 24;
  }

  private assertCreateAccountDto(createAccountDto: CreateAccountDto) {
    if (
      !createAccountDto.username ||
      !createAccountDto.email ||
      !createAccountDto.password
    ) {
      throw new BadRequestException(
        'username, email, and password are required',
      );
    }
  }

  private assertLoginDto(loginAccountDto: LoginAccountDto) {
    if (!loginAccountDto.identifier || !loginAccountDto.password) {
      throw new BadRequestException('identifier and password are required');
    }
  }

  private validateRole(role: string) {
    if (!this.allowedRoles.has(role)) {
      throw new BadRequestException('Invalid user role');
    }
  }

  private validateOrganisationRequirement(
    role: string,
    createAccountDto: CreateAccountDto,
  ) {
    if (
      role === 'responder' &&
      (!createAccountDto.organisationIds ||
        createAccountDto.organisationIds.length === 0)
    ) {
      throw new BadRequestException(
        'organisationIds is required for responder accounts',
      );
    }
  }

  private toSafeUser(user: {
    id: string;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    is_verified: boolean;
    user_organisations?: Array<{
      organisations: {
        id: string;
        org_name: string;
      };
    }>;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      organisations: (user.user_organisations ?? []).map(
        (userOrganisation) => ({
          id: userOrganisation.organisations.id,
          orgName: userOrganisation.organisations.org_name,
        }),
      ),
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private get accessTokenSecret() {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  }

  private get refreshTokenSecret() {
    return process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
  }

  private get userOrganisationInclude() {
    return {
      user_organisations: {
        include: {
          organisations: true,
        },
      },
    } satisfies Prisma.usersInclude;
  }
}
