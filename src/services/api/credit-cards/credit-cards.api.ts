import { apiRequest } from '../http/httpClient';
import type { CreditCard } from '../../../types/credit-card.interface';

function normalizeCreditCard(item: { id?: string | number; [key: string]: unknown }): CreditCard {
  return {
    ...item,
    id: item.id != null ? String(item.id) : undefined,
    credit_limit: typeof item.credit_limit === 'string' ? Number(item.credit_limit) : (item.credit_limit as number),
    current_balance: typeof item.current_balance === 'string' ? Number(item.current_balance) : (item.current_balance as number),
  } as CreditCard;
}

function normalizeCreditCards(data: unknown): CreditCard[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeCreditCard(item as Record<string, unknown>));
}

export class CreditCardsApiService {
  async createCreditCard(creditCard: CreditCard): Promise<CreditCard> {
    const data = await apiRequest<Record<string, unknown>>('/credit-cards', {
      method: 'POST',
      body: JSON.stringify({
        card_name: creditCard.card_name,
        bank_name: creditCard.bank_name,
        card_gradient: creditCard.card_gradient,
        card_digits: creditCard.card_digits,
        valid_thru: creditCard.valid_thru,
        credit_limit: creditCard.credit_limit,
        closing_day: creditCard.closing_day,
        due_day: creditCard.due_day,
        notes: creditCard.notes,
        card_active: creditCard.card_active ?? true,
        current_balance: creditCard.current_balance ?? 0,
      }),
    });
    return normalizeCreditCard(data ?? {});
  }

  async getAllCreditCards(): Promise<CreditCard[]> {
    const res = await apiRequest<{ data?: unknown[] }>('/credit-cards');
    const data = res?.data ?? res;
    return normalizeCreditCards(Array.isArray(data) ? data : []);
  }

  async getCreditCardsPage(page: number, pageSize: number): Promise<{ data: CreditCard[]; total: number }> {
    const res = await apiRequest<{ data: unknown[]; total: number }>(
      `/credit-cards?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
    );
    return {
      data: normalizeCreditCards(res?.data ?? []),
      total: typeof res?.total === 'number' ? res.total : 0,
    };
  }

  async editCreditCard(id: string, creditCard: CreditCard): Promise<CreditCard> {
    const data = await apiRequest<Record<string, unknown>>(`/credit-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        card_name: creditCard.card_name,
        bank_name: creditCard.bank_name,
        card_gradient: creditCard.card_gradient,
        card_digits: creditCard.card_digits,
        valid_thru: creditCard.valid_thru,
        credit_limit: creditCard.credit_limit,
        closing_day: creditCard.closing_day,
        due_day: creditCard.due_day,
        notes: creditCard.notes,
        card_active: creditCard.card_active ?? true,
        current_balance: creditCard.current_balance ?? 0,
      }),
    });
    return normalizeCreditCard(data ?? {});
  }

  async deleteCreditCard(id: string): Promise<void> {
    await apiRequest<void>(`/credit-cards/${id}`, {
      method: 'DELETE',
    });
  }
}


export const creditCardsApiService = new CreditCardsApiService();
