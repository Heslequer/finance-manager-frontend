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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategoryIdsDto } from './dto/expense-category-ids.dto';

type RequestWithUserId = Request & {
  userId: string;
};

function parseTransactionId(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException('Invalid expense id.');
  }
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Req() req: RequestWithUserId,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(createExpenseDto, req.userId);
  }

  @Get()
  async findAll(@Req() req: RequestWithUserId) {
    const data = await this.expensesService.findAll(req.userId);
    // #region agent log
    const first = Array.isArray(data) ? data[0] : data;
    const idType = first != null && 'id' in first ? typeof (first as { id: unknown }).id : 'n/a';
    fetch('http://127.0.0.1:7242/ingest/79dea57e-9295-4a8e-bf68-019a5df3f813', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'expenses.controller.ts:findAll', message: 'GET /expenses response shape', data: { idType, isArray: Array.isArray(data), length: Array.isArray(data) ? data.length : 0 }, timestamp: Date.now(), hypothesisId: 'H1', runId: 'post-fix' }) }).catch(() => {});
    // #endregion
    return data;
  }

  @Get('stats/amount')
  getAmount(@Req() req: RequestWithUserId) {
    return this.expensesService.getAmount(req.userId);
  }

  @Get('stats/category-ids')
  getCategoryIds(@Req() req: RequestWithUserId) {
    return this.expensesService.getCategoryIds(req.userId);
  }

  @Get('stats/amount-by-category/:categoryId')
  getAmountByCategoryId(
    @Req() req: RequestWithUserId,
    @Param('categoryId') categoryId: string,
  ) {
    return this.expensesService.getAmountByCategoryId(req.userId, categoryId);
  }

  @Post('stats/amount-by-categories')
  getAmountByCategoriesIds(
    @Req() req: RequestWithUserId,
    @Body() body: ExpenseCategoryIdsDto,
  ) {
    return this.expensesService.getAmountByCategoriesIds(req.userId, body.categoryIds);
  }

  @Get('stats/amount-by-subcategory/:subcategoryId')
  getAmountBySubcategoryId(
    @Req() req: RequestWithUserId,
    @Param('subcategoryId') subcategoryId: string,
  ) {
    return this.expensesService.getAmountBySubcategoryId(req.userId, subcategoryId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.expensesService.findOne(parseTransactionId(id), req.userId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(
      parseTransactionId(id),
      updateExpenseDto,
      req.userId,
    );
  }

  @Patch(':id/category')
  updateCategory(
    @Req() req: RequestWithUserId,
    @Param('id') id: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateCategory(
      parseTransactionId(id),
      updateExpenseCategoryDto,
      req.userId,
    );
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUserId, @Param('id') id: string) {
    return this.expensesService.remove(parseTransactionId(id), req.userId);
  }
}
