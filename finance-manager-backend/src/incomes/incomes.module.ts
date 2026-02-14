import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { IncomesRepository } from './incomes.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [IncomesController],
  providers: [IncomesService, IncomesRepository, PrismaService],
})
export class IncomesModule {}
