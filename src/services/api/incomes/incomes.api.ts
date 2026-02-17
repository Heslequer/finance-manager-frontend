import { apiRequest } from '../http/httpClient';
import type { Income } from '../../../types/income.interface';

function normalizeIncome(item: { id?: string | number; amount?: string | number; [key: string]: unknown }): Income {
  return {
    ...item,
    id: item.id != null ? String(item.id) : undefined,
    amount: typeof item.amount === 'string' ? Number(item.amount) : (item.amount as number),
  } as Income;
}

function normalizeIncomes(data: unknown): Income[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeIncome(item as Record<string, unknown>));
}

export class IncomesApiService {
  async createIncome(income: Income): Promise<Income> {
    const data = await apiRequest<Record<string, unknown>>('/incomes', {
      method: 'POST',
      body: JSON.stringify({
        amount: income.amount,
        date: income.date,
        description: income.description,
        category_id: income.category_id,
        subcategory_id: income.subcategory_id,
      }),
    });
    return normalizeIncome(data ?? {});
  }

  async getIncomesAmount(): Promise<number> {
    return apiRequest<number>('/incomes/stats/amount');
  }

  async getAllIncomesByUserId(_userId: string): Promise<Income[]> {
    const res = await apiRequest<{ data?: unknown[] }>('/incomes');
    const data = res?.data ?? res;
    return normalizeIncomes(Array.isArray(data) ? data : []);
  }

  async getIncomesPage(
    _userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Income[]; total: number }> {
    const res = await apiRequest<{ data?: unknown[]; total?: number }>(
      `/incomes?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
    );
    const data = res?.data ?? [];
    const total = typeof res?.total === 'number' ? res.total : 0;
    return {
      data: normalizeIncomes(Array.isArray(data) ? data : []),
      total,
    };
  }

  async editIncome(income: Income): Promise<Income> {
    const id = income.id != null ? String(income.id) : '';
    const data = await apiRequest<Record<string, unknown>>(`/incomes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        amount: income.amount,
        date: income.date,
        description: income.description,
        category_id: income.category_id,
        subcategory_id: income.subcategory_id,
      }),
    });
    return normalizeIncome(data ?? {});
  }

  async deleteIncome(id: string): Promise<void> {
    await apiRequest(`/incomes/${id}`, { method: 'DELETE' });
  }

  async getIncomeCategoriesIds(): Promise<string[]> {
    return apiRequest<string[]>('/incomes/stats/category-ids');
  }

  async getIncomesAmountByCategoryId(categoryId: string): Promise<number> {
    return apiRequest<number>(`/incomes/stats/amount-by-category/${encodeURIComponent(categoryId)}`);
  }

  async getIncomesAmountByCategoriesIds(categoriesIds: string[]): Promise<number[]> {
    return apiRequest<number[]>('/incomes/stats/amount-by-categories', {
      method: 'POST',
      body: JSON.stringify({ categoryIds: categoriesIds }),
    });
  }

  async getIncomesAmountBySubcategoryId(subcategoryId: string): Promise<number> {
    return apiRequest<number>(`/incomes/stats/amount-by-subcategory/${encodeURIComponent(subcategoryId)}`);
  }

  async updateIncomeCategory(
    incomeId: string,
    categoryId: string,
    subcategoryId: string | null,
  ): Promise<void> {
    await apiRequest(`/incomes/${incomeId}/category`, {
      method: 'PATCH',
      body: JSON.stringify({
        category_id: categoryId,
        subcategory_id: subcategoryId ?? undefined,
      }),
    });
  }
}

export const incomesApiService = new IncomesApiService();
