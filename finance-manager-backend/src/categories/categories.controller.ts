import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesIdsDto } from './dto/categories-ids.dto';

type RequestWithUserId = Request & {
  userId: string;
};

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Req() req: RequestWithUserId,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(createCategoryDto, req.userId);
  }

  @Get()
  findAll(@Req() req: RequestWithUserId) {
    return this.categoriesService.findAll(req.userId);
  }

  @Get('type/:type')
  findByType(@Req() req: RequestWithUserId, @Param('type') type: string) {
    return this.categoriesService.findByType(type, req.userId);
  }

  @Get('by-name/:name/id')
  getIdByName(@Req() req: RequestWithUserId, @Param('name') name: string) {
    return this.categoriesService.getIdByName(name, req.userId);
  }

  @Get(':id/color')
  getColorById(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.categoriesService.getColorById(id, req.userId);
  }

  @Post('ids')
  findManyByIds(@Req() req: RequestWithUserId, @Body() body: CategoriesIdsDto) {
    return this.categoriesService.findManyByIds(body.ids, req.userId);
  }

  @Post('ids/names')
  getNamesByIds(@Req() req: RequestWithUserId, @Body() body: CategoriesIdsDto) {
    return this.categoriesService.getNamesByIds(body.ids, req.userId);
  }

  @Post('ids/colors')
  getColorsByIds(@Req() req: RequestWithUserId, @Body() body: CategoriesIdsDto) {
    return this.categoriesService.getColorsByIds(body.ids, req.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.categoriesService.findOne(id, req.userId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.userId);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.categoriesService.remove(id, req.userId);
  }
}
