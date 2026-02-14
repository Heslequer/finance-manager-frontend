import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesRepository } from './expenses.repository';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  create(createExpenseDto: CreateExpenseDto, userId: string) {
    return this.expensesRepository.create(createExpenseDto, userId);
  }

  findAll(userId: string) {
    return this.expensesRepository.findAllByUserId(userId);
  }

  findOne(id: bigint, userId: string) {
    return this.expensesRepository.findOneByUserId(id, userId);
  }

  update(id: bigint, updateExpenseDto: UpdateExpenseDto, userId: string) {
    return this.expensesRepository.updateByUserId(id, updateExpenseDto, userId);
  }

  updateCategory(id: bigint, updateExpenseCategoryDto: UpdateExpenseCategoryDto, userId: string) {
    return this.expensesRepository.updateCategoryByUserId(
      id,
      updateExpenseCategoryDto,
      userId,
    );
  }

  remove(id: bigint, userId: string) {
    return this.expensesRepository.removeByUserId(id, userId);
  }

  getAmount(userId: string) {
    return this.expensesRepository.getAmountByUserId(userId);
  }

  getCategoryIds(userId: string) {
    return this.expensesRepository.getCategoryIdsByUserId(userId);
  }

  getAmountByCategoryId(userId: string, categoryId: string) {
    return this.expensesRepository.getAmountByCategoryId(userId, categoryId);
  }

  async getAmountByCategoriesIds(userId: string, categoryIds: string[]) {
    const values: number[] = [];

    for (const categoryId of categoryIds) {
      const amount = await this.expensesRepository.getAmountByCategoryId(
        userId,
        categoryId,
      );
      values.push(amount);
    }

    return values;
  }

  getAmountBySubcategoryId(userId: string, subcategoryId: string) {
    return this.expensesRepository.getAmountBySubcategoryId(userId, subcategoryId);
  }
}
