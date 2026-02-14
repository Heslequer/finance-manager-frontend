import { Injectable } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomesRepository } from './incomes.repository';
import { UpdateIncomeCategoryDto } from './dto/update-income-category.dto';

@Injectable()
export class IncomesService {
  constructor(private readonly incomesRepository: IncomesRepository) {}

  create(createIncomeDto: CreateIncomeDto, userId: string) {
    return this.incomesRepository.create(createIncomeDto, userId);
  }

  findAll(userId: string) {
    return this.incomesRepository.findAllByUserId(userId);
  }

  findOne(id: bigint, userId: string) {
    return this.incomesRepository.findOneByUserId(id, userId);
  }

  update(id: bigint, updateIncomeDto: UpdateIncomeDto, userId: string) {
    return this.incomesRepository.updateByUserId(id, updateIncomeDto, userId);
  }

  updateCategory(id: bigint, updateIncomeCategoryDto: UpdateIncomeCategoryDto, userId: string) {
    return this.incomesRepository.updateCategoryByUserId(
      id,
      updateIncomeCategoryDto,
      userId,
    );
  }

  remove(id: bigint, userId: string) {
    return this.incomesRepository.removeByUserId(id, userId);
  }

  getAmount(userId: string) {
    return this.incomesRepository.getAmountByUserId(userId);
  }

  getCategoryIds(userId: string) {
    return this.incomesRepository.getCategoryIdsByUserId(userId);
  }

  getAmountByCategoryId(userId: string, categoryId: string) {
    return this.incomesRepository.getAmountByCategoryId(userId, categoryId);
  }

  async getAmountByCategoriesIds(userId: string, categoryIds: string[]) {
    const values: number[] = [];

    for (const categoryId of categoryIds) {
      const amount = await this.incomesRepository.getAmountByCategoryId(
        userId,
        categoryId,
      );
      values.push(amount);
    }

    return values;
  }

  getAmountBySubcategoryId(userId: string, subcategoryId: string) {
    return this.incomesRepository.getAmountBySubcategoryId(userId, subcategoryId);
  }
}
