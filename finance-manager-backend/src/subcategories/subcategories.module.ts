import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';
import { SubcategoriesRepository } from './subcategories.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService, SubcategoriesRepository, PrismaService],
})
export class SubcategoriesModule {}
