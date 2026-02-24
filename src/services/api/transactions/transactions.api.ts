import { apiRequest } from '../http/httpClient';

export type TransactionItem = {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  date: string | null;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  categories: { id?: string; name?: string; color_hex?: string; type?: string } | null;
  subcategories: { id?: string; name?: string; category_id?: string } | null;
};

export type TransactionsQuery = {
  page?: number;
  pageSize?: number;
  type?: 'expense' | 'income';
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
};

export type TransactionsResponse = {
  data: TransactionItem[];
  total: number;
};

export class TransactionsApiService {
  async getTransactions(query: TransactionsQuery = {}): Promise<TransactionsResponse> {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
    if (query.type != null) params.set('type', query.type);
    if (query.dateFrom != null) params.set('dateFrom', query.dateFrom);
    if (query.dateTo != null) params.set('dateTo', query.dateTo);
    if (query.categoryId != null) params.set('categoryId', query.categoryId);

    const qs = params.toString();
    const url = qs ? `/transactions?${qs}` : '/transactions';
    const res = await apiRequest<TransactionsResponse>(url);
    return {
      data: Array.isArray(res?.data) ? res.data : [],
      total: typeof res?.total === 'number' ? res.total : 0,
    };
  }
}

export const transactionsApiService = new TransactionsApiService();
