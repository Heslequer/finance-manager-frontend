import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(createSubcategoryDto: CreateSubcategoryDto, userId: string) {
    return this.prisma.subcategories.create({
      data: { ...createSubcategoryDto, user_id: userId },
    });
  }

  findAllByUserId(userId: string) {
    return this.prisma.subcategories.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findOneByUserId(id: string, userId: string) {
    return this.prisma.subcategories.findFirst({
      where: { id, user_id: userId },
    });
  }

  findByCategoryId(categoryId: string, userId: string) {
    return this.prisma.subcategories.findMany({
      where: { category_id: categoryId, user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findManyByCategoryIds(categoryIds: string[], userId: string) {
    return this.prisma.subcategories.findMany({
      where: { category_id: { in: categoryIds }, user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findByName(name: string, userId: string) {
    return this.prisma.subcategories.findFirst({
      where: { name, user_id: userId },
      select: { id: true, category_id: true },
    });
  }

  async updateByUserId(id: string, updateSubcategoryDto: UpdateSubcategoryDto, userId: string) {
    await this.prisma.subcategories.updateMany({
      where: { id, user_id: userId },
      data: updateSubcategoryDto as Prisma.subcategoriesUpdateInput,
    });

    return this.findOneByUserId(id, userId);
  }

  async removeByUserId(id: string, userId: string) {
    const result = await this.prisma.subcategories.deleteMany({
      where: { id, user_id: userId },
    });

    return result.count > 0;
  }

  async getAmountByCategoryId(categoryId: string, userId: string) {
    const [expensesResult, incomesResult] = await Promise.all([
      this.prisma.expenses.aggregate({
        where: {
          user_id: userId,
          subcategories: {
            category_id: categoryId,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.incomes.aggregate({
        where: {
          user_id: userId,
          subcategories: {
            category_id: categoryId,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return Number(expensesResult._sum.amount ?? 0) + Number(incomesResult._sum.amount ?? 0);
  }

  async getCategoryIdBySubcategoryName(name: string, userId: string) {
    const subcategory = await this.findByName(name, userId);
    return subcategory?.category_id ?? null;
  }

  async getSubcategoryIdByName(name: string, userId: string) {
    const subcategory = await this.findByName(name, userId);
    return subcategory?.id ?? null;
  }

  async getSubcategoriesByCategoryIds(categoryIds: string[], userId: string) {
    return this.prisma.subcategories.findMany({
      where: {
        category_id: { in: categoryIds },
        user_id: userId,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
