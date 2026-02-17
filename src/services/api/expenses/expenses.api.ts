import { apiRequest } from '../http/httpClient';
import type { Expense } from '../../../types/expense.interface';

function normalizeExpense(item: { id?: string | number; amount?: string | number; [key: string]: unknown }): Expense {
  return {
    ...item,
    id: item.id != null ? String(item.id) : undefined,
    amount: typeof item.amount === 'string' ? Number(item.amount) : (item.amount as number),
  } as Expense;
}

function normalizeExpenses(data: unknown): Expense[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeExpense(item as Record<string, unknown>));
}

export class ExpensesApiService {
  async createExpense(expense: Expense): Promise<Expense> {
    const data = await apiRequest<Record<string, unknown>>('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        category_id: expense.category_id,
        subcategory_id: expense.subcategory_id,
      }),
    });
    return normalizeExpense(data ?? {});
  }

  async getExpensesAmount(): Promise<number> {
    return apiRequest<number>('/expenses/stats/amount');
  }

  async getAllExpensesByUserId(_userId: string): Promise<Expense[]> {
    const res = await apiRequest<{ data?: unknown[] }>('/expenses');
    const data = res?.data ?? res;
    return normalizeExpenses(Array.isArray(data) ? data : []);
  }

  async getExpensesPage(
    _userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Expense[]; total: number }> {
    const res = await apiRequest<{ data?: unknown[]; total?: number }>(
      `/expenses?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
    );
    const data = res?.data ?? [];
    const total = typeof res?.total === 'number' ? res.total : 0;
    return {
      data: normalizeExpenses(Array.isArray(data) ? data : []),
      total,
    };
  }

  async getExpenseCategoriesIds(): Promise<string[]> {
    return apiRequest<string[]>('/expenses/stats/category-ids');
  }

  async getExpensesAmountByCategoryId(categoryId: string): Promise<number> {
    return apiRequest<number>(`/expenses/stats/amount-by-category/${encodeURIComponent(categoryId)}`);
  }

  async getExpensesAmountByCategoriesIds(categoriesIds: string[]): Promise<number[]> {
    return apiRequest<number[]>('/expenses/stats/amount-by-categories', {
      method: 'POST',
      body: JSON.stringify({ categoryIds: categoriesIds }),
    });
  }

  async getExpensesAmountBySubcategoryId(subcategoryId: string): Promise<number> {
    return apiRequest<number>(`/expenses/stats/amount-by-subcategory/${encodeURIComponent(subcategoryId)}`);
  }

  async editExpense(expense: Expense): Promise<Expense> {
    const id = expense.id != null ? String(expense.id) : '';
    const data = await apiRequest<Record<string, unknown>>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        category_id: expense.category_id,
        subcategory_id: expense.subcategory_id,
      }),
    });
    return normalizeExpense(data ?? {});
  }

  async deleteExpense(id: string): Promise<void> {
    await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
  }

  async updateExpenseCategory(
    expenseId: string,
    categoryId: string,
    subcategoryId: string | null,
  ): Promise<void> {
    await apiRequest(`/expenses/${expenseId}/category`, {
      method: 'PATCH',
      body: JSON.stringify({
        category_id: categoryId,
        subcategory_id: subcategoryId ?? undefined,
      }),
    });
  }
}

export const expensesApiService = new ExpensesApiService();
