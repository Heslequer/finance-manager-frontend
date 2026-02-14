import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository, PrismaService],
})
export class CategoriesModule {}
