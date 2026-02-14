import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(createCategoryDto: CreateCategoryDto, userId: string) {
    return this.prisma.categories.create({
      data: { ...createCategoryDto, user_id: userId },
    });
  }

  findAllByUserId(userId: string) {
    return this.prisma.categories.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findOneByUserId(id: string, userId: string) {
    return this.prisma.categories.findFirst({
      where: { id, user_id: userId },
    });
  }

  async findManyByIds(ids: string[], userId: string) {
    return this.prisma.categories.findMany({
      where: {
        id: { in: ids },
        user_id: userId,
      },
    });
  }

  findByName(name: string, userId: string) {
    return this.prisma.categories.findFirst({
      where: { name, user_id: userId },
      select: { id: true },
    });
  }

  findByType(type: string, userId: string) {
    return this.prisma.categories.findMany({
      where: { type, user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateByUserId(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    await this.prisma.categories.updateMany({
      where: { id, user_id: userId },
      data: updateCategoryDto as Prisma.categoriesUpdateInput,
    });

    return this.findOneByUserId(id, userId);
  }

  async removeByUserId(id: string, userId: string) {
    const result = await this.prisma.categories.deleteMany({
      where: { id, user_id: userId },
    });

    return result.count > 0;
  }
}
