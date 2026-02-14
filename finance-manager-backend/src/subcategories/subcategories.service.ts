import { Injectable } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoriesRepository } from './subcategories.repository';

@Injectable()
export class SubcategoriesService {
  constructor(private readonly subcategoriesRepository: SubcategoriesRepository) {}

  create(createSubcategoryDto: CreateSubcategoryDto, userId: string) {
    return this.subcategoriesRepository.create(createSubcategoryDto, userId);
  }

  findAll(userId: string) {
    return this.subcategoriesRepository.findAllByUserId(userId);
  }

  findOne(id: string, userId: string) {
    return this.subcategoriesRepository.findOneByUserId(id, userId);
  }

  findByCategoryId(categoryId: string, userId: string) {
    return this.subcategoriesRepository.findByCategoryId(categoryId, userId);
  }

  findByCategoryIds(categoryIds: string[], userId: string) {
    return this.subcategoriesRepository.getSubcategoriesByCategoryIds(categoryIds, userId);
  }

  getSubcategoryIdByName(name: string, userId: string) {
    return this.subcategoriesRepository.getSubcategoryIdByName(name, userId);
  }

  getCategoryIdBySubcategoryName(name: string, userId: string) {
    return this.subcategoriesRepository.getCategoryIdBySubcategoryName(name, userId);
  }

  getAmountByCategoryId(categoryId: string, userId: string) {
    return this.subcategoriesRepository.getAmountByCategoryId(categoryId, userId);
  }

  update(id: string, updateSubcategoryDto: UpdateSubcategoryDto, userId: string) {
    return this.subcategoriesRepository.updateByUserId(id, updateSubcategoryDto, userId);
  }

  remove(id: string, userId: string) {
    return this.subcategoriesRepository.removeByUserId(id, userId);
  }
}
