import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

function toSerializableExpense<T extends { id?: bigint }>(row: T): Omit<T, 'id'> & { id: string } {
  if (row == null) return row;
  return { ...row, id: String(row.id) };
}

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    const row = await this.prisma.expenses.create({
      data: { ...createExpenseDto, user_id: userId },
    });
    return toSerializableExpense(row);
  }

  async findAllByUserId(userId: string) {
    const rows = await this.prisma.expenses.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toSerializableExpense);
  }

  async findOneByUserId(id: bigint, userId: string) {
    const row = await this.prisma.expenses.findFirst({
      where: { id, user_id: userId },
    });
    return row ? toSerializableExpense(row) : row;
  }

  async updateByUserId(id: bigint, updateExpenseDto: UpdateExpenseDto, userId: string) {
    await this.prisma.expenses.updateMany({
      where: { id, user_id: userId },
      data: updateExpenseDto,
    });

    return this.findOneByUserId(id, userId);
  }

  async updateCategoryByUserId(
    id: bigint,
    updateExpenseCategoryDto: UpdateExpenseCategoryDto,
    userId: string,
  ) {
    await this.prisma.expenses.updateMany({
      where: { id, user_id: userId },
      data: updateExpenseCategoryDto,
    });

    return this.findOneByUserId(id, userId);
  }

  async removeByUserId(id: bigint, userId: string) {
    const result = await this.prisma.expenses.deleteMany({
      where: { id, user_id: userId },
    });

    return result.count > 0;
  }

  async getAmountByUserId(userId: string) {
    const result = await this.prisma.expenses.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getCategoryIdsByUserId(userId: string) {
    const rows = await this.prisma.expenses.findMany({
      where: { user_id: userId, category_id: { not: null } },
      select: { category_id: true },
      distinct: ['category_id'],
    });

    return rows
      .map((row) => row.category_id)
      .filter((categoryId): categoryId is string => Boolean(categoryId));
  }

  async getAmountByCategoryId(userId: string, categoryId: string) {
    const result = await this.prisma.expenses.aggregate({
      where: { user_id: userId, category_id: categoryId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getAmountBySubcategoryId(userId: string, subcategoryId: string) {
    const result = await this.prisma.expenses.aggregate({
      where: { user_id: userId, subcategory_id: subcategoryId },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}
