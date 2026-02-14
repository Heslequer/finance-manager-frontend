import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(createCategoryDto: CreateCategoryDto, userId: string) {
    return this.categoriesRepository.create(createCategoryDto, userId);
  }

  findAll(userId: string) {
    return this.categoriesRepository.findAllByUserId(userId);
  }

  findOne(id: string, userId: string) {
    return this.categoriesRepository.findOneByUserId(id, userId);
  }

  async findManyByIds(ids: string[], userId: string) {
    const categories = await this.categoriesRepository.findManyByIds(ids, userId);
    const orderMap = new Map(categories.map((category) => [category.id, category]));

    return ids
      .map((id) => orderMap.get(id))
      .filter((category): category is NonNullable<typeof category> => Boolean(category));
  }

  async getColorById(id: string, userId: string) {
    const category = await this.categoriesRepository.findOneByUserId(id, userId);
    return category?.color_hex ?? null;
  }

  async getIdByName(name: string, userId: string) {
    const category = await this.categoriesRepository.findByName(name, userId);
    return category?.id ?? null;
  }

  findByType(type: string, userId: string) {
    return this.categoriesRepository.findByType(type, userId);
  }

  async getNamesByIds(ids: string[], userId: string) {
    const categories = await this.findManyByIds(ids, userId);
    return categories.map((category) => category.name);
  }

  async getColorsByIds(ids: string[], userId: string) {
    const categories = await this.findManyByIds(ids, userId);
    return categories.map((category) => category.color_hex ?? '');
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    return this.categoriesRepository.updateByUserId(id, updateCategoryDto, userId);
  }

  remove(id: string, userId: string) {
    return this.categoriesRepository.removeByUserId(id, userId);
  }
}
