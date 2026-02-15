import type { ParsedOfxTransaction } from './ofxParser.service';
import { expensesApiService } from '../api/expenses/expenses.api';
import { incomesApiService } from '../api/incomes/incomes.api';

export type OfxImportOptions = {
  expenseCategoryId?: string | null;
  expenseSubcategoryId?: string | null;
  incomeCategoryId?: string | null;
  incomeSubcategoryId?: string | null;
};

export type OfxImportResult = {
  imported: number;
  failed: number;
  errors: string[];
};


export async function importOfxTransactions(
  transactions: ParsedOfxTransaction[],
  options: OfxImportOptions
): Promise<OfxImportResult> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const t of transactions) {
    try {
      if (t.isCredit) {
        await incomesApiService.createIncome({
          amount: t.amount,
          date: t.date,
          description: t.description,
          category_id: options.incomeCategoryId ?? undefined,
          subcategory_id: options.incomeSubcategoryId ?? undefined,
        });
      } else {
        await expensesApiService.createExpense({
          amount: t.amount,
          date: t.date,
          description: t.description,
          category_id: options.expenseCategoryId ?? undefined,
          subcategory_id: options.expenseSubcategoryId ?? undefined,
        });
      }
      imported++;
    } catch (e: unknown) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${t.date} ${t.description}: ${msg}`);
    }
  }

  return { imported, failed, errors };
}
