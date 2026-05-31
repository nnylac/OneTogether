import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'onetogether-dev-secret';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('token')
  async getToken(@Body() body: { userId: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const token = jwt.sign(
      { sub: user.id, name: user.name, role: user.role, orgId: user.organisationId },
      JWT_SECRET,
      { expiresIn: '24h' },
    );
    return { token, user: { id: user.id, name: user.name, role: user.role, organisationId: user.organisationId } };
  }
}
