import { Injectable, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

@Injectable()
export class AppService {
  getHello(): Object {
    return { message: 'Hello World!' };
  }
}
