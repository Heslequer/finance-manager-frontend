import {
  Injectable,
  NestMiddleware,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

type RequestWithUser = Request & {
  userId?: string;
  payload?: {
    sub: string;
    [key: string]: unknown;
  };
  user?: Record<string, unknown>;
};

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: RequestWithUser, _res: Response, next: NextFunction) {

    if (req.method === 'OPTIONS') {
      return next();
    }

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is required.');
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Invalid authorization format. Use Bearer token.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('SUPABASE_JWT_SECRET'),
      });
      const authId = String((payload as Record<string, unknown>).sub ?? '');
      if (!authId) {
        throw new UnauthorizedException('Token payload is missing subject.');
      }

      req.payload = {
        sub: authId,
        ...(payload as Record<string, unknown>),
      };
      req.user = payload as Record<string, unknown>;

      // User profile is created right after signup on POST /users.
      if (req.path === '/users' && req.method === 'POST') {
        return next();
      }

      const user = await this.prisma.users.findUnique({
        where: { auth_id: authId },
        select: { id: true },
      });

      if (!user) {
        throw new UnauthorizedException('User profile not found.');
      }

      req.userId = user.id;
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
