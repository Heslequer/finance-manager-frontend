import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository, PrismaService],
})
export class ExpensesModule {}
