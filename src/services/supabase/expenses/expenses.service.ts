import { supabase } from "../../supabaseClient";
import type { Expense } from "./expenses.interface";

export class ExpensesService {
    async createExpense(expense: Expense): Promise<Expense> {
        const { data, error } = await supabase
            .from("expenses")
            .insert({
                amount: expense.amount,
                date: expense.date,
                description: expense.description,
                user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
                ...(expense.category_id != null && { category_id: expense.category_id }),
                ...(expense.subcategory_id != null && { subcategory_id: expense.subcategory_id }),
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getExpensesAmount(): Promise<number> {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(expense => expense.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async getAllExpensesByUserId(userId: string): Promise<Expense[]> {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("user_id", userId);
        if (error) throw error;
        return data;
    }

    async getExpenseCategoriesIds(): Promise<string[]> {
        const { data, error } = await supabase
            .from("expenses")
            .select("category_id")
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;

        const categories: string[] = data
            .map(expense => expense.category_id)
            .filter((id): id is string => id != null && id !== 'null' && id !== 'undefined')
            .flat();
        const responseFiltered = [...new Set(categories)];
        return responseFiltered;
    }
    async getExpensesAmountByCategoryId(categoryId: string): Promise<number> {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(expense => expense.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async getExpensesAmountByCategoriesIds(categoriesIds: string[]): Promise<number[]> {
        const expensesAmountByCategory: number[] = [];
        for(const categoryId of categoriesIds){
            const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
            if (error) throw error;
            expensesAmountByCategory.push(data.map(expense => expense.amount).reduce((acc, curr) => acc + curr, 0));
        }
        return expensesAmountByCategory;
    }

    async getExpensesAmountBySubcategoryId(subcategoryId: string): Promise<number> {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("subcategory_id", subcategoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(expense => expense.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async editExpense(expense: Expense): Promise<Expense> {
        const { data, error } = await supabase
        .from("expenses")
        .update({
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            category_id: expense.category_id,
            subcategory_id: expense.subcategory_id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", expense.id)
        .select()
        .single();
        if (error) throw error;
        return data;
    }

    async deleteExpense(id: string): Promise<void> {
        const { error } = await supabase
            .from("expenses")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    async updateExpenseCategory(expenseId: string, categoryId: string, subcategoryId: string | null): Promise<void> {
        const { error } = await supabase
            .from("expenses")
            .update({
                category_id: categoryId,
                subcategory_id: subcategoryId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", expenseId);
        if (error) throw error;
    }
}