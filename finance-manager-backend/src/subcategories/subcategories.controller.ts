import { Body, Controller, Delete, Get, Patch, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoriesCategoryIdsDto } from './dto/subcategories-category-ids.dto';

type RequestWithUserId = Request & {
  userId: string;
};

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(
    @Req() req: RequestWithUserId,
    @Body() createSubcategoryDto: CreateSubcategoryDto,
  ) {
    return this.subcategoriesService.create(createSubcategoryDto, req.userId);
  }

  @Get()
  findAll(@Req() req: RequestWithUserId) {
    return this.subcategoriesService.findAll(req.userId);
  }

  @Get('category/:categoryId/amount')
  getAmountByCategoryId(
    @Req() req: RequestWithUserId,
    @Param('categoryId') categoryId: string,
  ) {
    return this.subcategoriesService.getAmountByCategoryId(categoryId, req.userId);
  }

  @Get('category/:categoryId')
  findByCategoryId(
    @Req() req: RequestWithUserId,
    @Param('categoryId') categoryId: string,
  ) {
    return this.subcategoriesService.findByCategoryId(categoryId, req.userId);
  }

  @Post('category/list')
  findByCategoryIds(
    @Req() req: RequestWithUserId,
    @Body() body: SubcategoriesCategoryIdsDto,
  ) {
    return this.subcategoriesService.findByCategoryIds(body.categoryIds, req.userId);
  }

  @Get('by-name/:name/id')
  getSubcategoryIdByName(
    @Req() req: RequestWithUserId,
    @Param('name') name: string,
  ) {
    return this.subcategoriesService.getSubcategoryIdByName(name, req.userId);
  }

  @Get('by-name/:name/category-id')
  getCategoryIdBySubcategoryName(
    @Req() req: RequestWithUserId,
    @Param('name') name: string,
  ) {
    return this.subcategoriesService.getCategoryIdBySubcategoryName(name, req.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.subcategoriesService.findOne(id, req.userId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto, req.userId);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.subcategoriesService.remove(id, req.userId);
  }
}
