import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeCategoryDto } from './dto/update-income-category.dto';

function toSerializableIncome<T extends { id?: bigint }>(row: T): Omit<T, 'id'> & { id: string } {
  if (row == null) return row;
  return { ...row, id: String(row.id) };
}

@Injectable()
export class IncomesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncomeDto: CreateIncomeDto, userId: string) {
    const row = await this.prisma.incomes.create({
      data: { ...createIncomeDto, user_id: userId },
    });
    return toSerializableIncome(row);
  }

  async findAllByUserId(userId: string) {
    const rows = await this.prisma.incomes.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toSerializableIncome);
  }

  async findOneByUserId(id: bigint, userId: string) {
    const row = await this.prisma.incomes.findFirst({
      where: { id, user_id: userId },
    });
    return row ? toSerializableIncome(row) : row;
  }

  async updateByUserId(id: bigint, updateIncomeDto: UpdateIncomeDto, userId: string) {
    await this.prisma.incomes.updateMany({
      where: { id, user_id: userId },
      data: updateIncomeDto,
    });

    return this.findOneByUserId(id, userId);
  }

  async updateCategoryByUserId(
    id: bigint,
    updateIncomeCategoryDto: UpdateIncomeCategoryDto,
    userId: string,
  ) {
    await this.prisma.incomes.updateMany({
      where: { id, user_id: userId },
      data: updateIncomeCategoryDto,
    });

    return this.findOneByUserId(id, userId);
  }

  async removeByUserId(id: bigint, userId: string) {
    const result = await this.prisma.incomes.deleteMany({
      where: { id, user_id: userId },
    });

    return result.count > 0;
  }

  async getAmountByUserId(userId: string) {
    const result = await this.prisma.incomes.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getCategoryIdsByUserId(userId: string) {
    const rows = await this.prisma.incomes.findMany({
      where: { user_id: userId, category_id: { not: null } },
      select: { category_id: true },
      distinct: ['category_id'],
    });

    return rows
      .map((row) => row.category_id)
      .filter((categoryId): categoryId is string => Boolean(categoryId));
  }

  async getAmountByCategoryId(userId: string, categoryId: string) {
    const result = await this.prisma.incomes.aggregate({
      where: { user_id: userId, category_id: categoryId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getAmountBySubcategoryId(userId: string, subcategoryId: string) {
    const result = await this.prisma.incomes.aggregate({
      where: { user_id: userId, subcategory_id: subcategoryId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}
