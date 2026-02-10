import type { ParsedOfxTransaction } from './ofxParser.service';
import { ExpensesService } from '../supabase/expenses/expenses.service';
import { IncomesService } from '../supabase/incomes/incomes.service';

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

const expensesService = new ExpensesService();
const incomesService = new IncomesService();

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
        await incomesService.createIncome({
          amount: t.amount,
          date: t.date,
          description: t.description,
          category_id: options.incomeCategoryId ?? undefined,
          subcategory_id: options.incomeSubcategoryId ?? undefined,
        });
      } else {
        await expensesService.createExpense({
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
