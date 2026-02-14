import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeCategoryDto } from './dto/update-income-category.dto';
import { IncomeCategoryIdsDto } from './dto/income-category-ids.dto';

type RequestWithUserId = Request & {
  userId: string;
};

function parseTransactionId(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException('Invalid income id.');
  }
}

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(
    @Req() req: RequestWithUserId,
    @Body() createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomesService.create(createIncomeDto, req.userId);
  }

  @Get()
  findAll(@Req() req: RequestWithUserId) {
    return this.incomesService.findAll(req.userId);
  }

  @Get('stats/amount')
  getAmount(@Req() req: RequestWithUserId) {
    return this.incomesService.getAmount(req.userId);
  }

  @Get('stats/category-ids')
  getCategoryIds(@Req() req: RequestWithUserId) {
    return this.incomesService.getCategoryIds(req.userId);
  }

  @Get('stats/amount-by-category/:categoryId')
  getAmountByCategoryId(
    @Req() req: RequestWithUserId,
    @Param('categoryId') categoryId: string,
  ) {
    return this.incomesService.getAmountByCategoryId(req.userId, categoryId);
  }

  @Post('stats/amount-by-categories')
  getAmountByCategoriesIds(
    @Req() req: RequestWithUserId,
    @Body() body: IncomeCategoryIdsDto,
  ) {
    return this.incomesService.getAmountByCategoriesIds(req.userId, body.categoryIds);
  }

  @Get('stats/amount-by-subcategory/:subcategoryId')
  getAmountBySubcategoryId(
    @Req() req: RequestWithUserId,
    @Param('subcategoryId') subcategoryId: string,
  ) {
    return this.incomesService.getAmountBySubcategoryId(req.userId, subcategoryId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.incomesService.findOne(parseTransactionId(id), req.userId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(
      parseTransactionId(id),
      updateIncomeDto,
      req.userId,
    );
  }

  @Patch(':id/category')
  updateCategory(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateIncomeCategoryDto: UpdateIncomeCategoryDto,
  ) {
    return this.incomesService.updateCategory(
      parseTransactionId(id),
      updateIncomeCategoryDto,
      req.userId,
    );
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.incomesService.remove(parseTransactionId(id), req.userId);
  }
}
