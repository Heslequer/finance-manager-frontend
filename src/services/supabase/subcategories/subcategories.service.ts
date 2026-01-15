import { supabase } from "../../supabaseClient";
import type { Subcategory } from "./subcategories.interface";

export class SubcategoriesService {
    async createSubcategory(subcategory: Subcategory): Promise<Subcategory> {
        const { data, error } = await supabase
            .from("subcategories")
            .insert({
                name: subcategory.name,
                category_id: subcategory.category_id,
                user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
        const subcategories: Subcategory[] = [];
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
        if (error) throw error;
        subcategories.push(...data);
        return subcategories;
    }

    async getSubcategoriesByCategoryIds(categoryIds: string[]): Promise<Subcategory[]> {
        const subcategories: Subcategory[] = [];
        for(const categoryId of categoryIds){
            const { data, error } = await supabase
                .from("subcategories")
                .select("*")
                .eq("category_id", categoryId)
                .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            if (error) throw error;
            subcategories.push(...data);
        }
        return subcategories;
    }

    async getSubcategoryById(id: string): Promise<Subcategory> {
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("id", id)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data;
    }

    async getSubcategoryByCategoryId(categoryId: string): Promise<Subcategory[]> {
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
        if (error) throw error;
        return data;
    }

    async getSubcategoryIdByName(name: string): Promise<string> {
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("name", name)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data.id;
    }

    async getSubcategoryAmountByCategoryId(categoryId: string): Promise<number> {
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("category_id", categoryId)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
        if (error) throw error;
        return data.map(subcategory => subcategory.amount).reduce((acc, curr) => acc + curr, 0);
    }

    async getCategoryIdBySubcategoryName(subcategoryName: string): Promise<string> {
        const { data, error } = await supabase
            .from("subcategories")
            .select("category_id")
            .eq("name", subcategoryName)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data.category_id;
    }

    async deleteSubcategory(id: string): Promise<boolean> {
        const { error } = await supabase
            .from("subcategories")
            .delete()
            .eq("id", id)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb');
        if (error) {
            console.error("Error deleting subcategory:", error);
            return false;
        }
        return true;
    }

}