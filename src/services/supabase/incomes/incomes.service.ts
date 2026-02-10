import { supabase } from "../../supabaseClient";
import type { Income } from "./incomes.interface";

export class IncomesService {
    async createIncome(income: Income): Promise<Income> {
        const { data, error } = await supabase
            .from("incomes")
            .insert({
                amount: income.amount,
                date: income.date,
                description: income.description,
                user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
                ...(income.category_id != null && { category_id: income.category_id }),
                ...(income.subcategory_id != null && { subcategory_id: income.subcategory_id }),
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getIncomesAmount(): Promise<number> {
        const { data, error } = await supabase
            .from("incomes")
            .select("*")
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(income => income.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async getAllIncomesByUserId(userId: string): Promise<Income[]> {
        const { data, error } = await supabase
            .from("incomes")
            .select("*")
            .eq("user_id", userId);
        if (error) throw error;
        return data;
    }

    async editIncome(income: Income): Promise<Income> {
        const { data, error } = await supabase
            .from("incomes")
            .update({
                amount: income.amount,
                date: income.date,
                description: income.description,
                category_id: income.category_id,
                subcategory_id: income.subcategory_id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", income.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteIncome(id: string): Promise<void> {
        const { error } = await supabase
            .from("incomes")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    async getIncomeCategoriesIds(): Promise<string[]> {
        const { data, error } = await supabase
            .from("incomes")
            .select("category_id")
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;

        const categories: string[] = data
            .map(income => income.category_id)
            .filter((id): id is string => id != null && id !== 'null' && id !== 'undefined')
            .flat();
        const responseFiltered = [...new Set(categories)];
        return responseFiltered;
    }

    async getIncomesAmountByCategoryId(categoryId: string): Promise<number> {
        const { data, error } = await supabase
            .from("incomes")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(income => income.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async getIncomesAmountByCategoriesIds(categoriesIds: string[]): Promise<number[]> {
        const incomesAmountByCategory: number[] = [];
        for(const categoryId of categoriesIds){
            const { data, error } = await supabase
            .from("incomes")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
            if (error) throw error;
            incomesAmountByCategory.push(data.map(income => income.amount).reduce((acc, curr) => acc + curr, 0));
        }
        return incomesAmountByCategory;
    }

    async getIncomesAmountBySubcategoryId(subcategoryId: string): Promise<number> {
        const { data, error } = await supabase
            .from("incomes")
            .select("*")
            .eq("subcategory_id", subcategoryId)
            .eq("user_id", "50baa1d0-57aa-4eff-932f-228e773784eb");
        if (error) throw error;
        return data.map(income => income.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async updateIncomeCategory(incomeId: string, categoryId: string, subcategoryId: string | null): Promise<void> {
        const { error } = await supabase
            .from("incomes")
            .update({
                category_id: categoryId,
                subcategory_id: subcategoryId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", incomeId);
        if (error) throw error;
    }
}