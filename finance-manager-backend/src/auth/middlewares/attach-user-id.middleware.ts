import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from '../../users/users.service';

type RequestWithPayloadAndUserId = Request & {
  payload?: Record<string, unknown>;
  userId?: string;
};

@Injectable()
export class AttachUserIdMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: RequestWithPayloadAndUserId, _res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS' || (req.method === 'POST' && req.path?.includes('/users'))){
      return next();
    }

    const authUserId = req.payload?.sub;
    if (typeof authUserId !== 'string' || authUserId.length === 0) {
      throw new UnauthorizedException('Token payload does not contain a valid sub.');
    }

    const userId = await this.usersService.findPublicIdByAuthId(authUserId);
    if (!userId) {
      throw new UnauthorizedException('User not found for this authenticated token.');
    }

    req.userId = userId;
    next();
  }
}
