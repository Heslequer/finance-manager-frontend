import { supabase } from "../../supabaseClient";
import type { Category } from "./categories.interface";

export class CategoriesService {
    async createCategory(Category: Category): Promise<Category> {
        const { data, error } = await supabase
            .from("categories")
            .insert({
                name: Category.name,
                color_hex: Category.color_hex,
                user_id: Category.user_id,
                type: Category.type,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getCategories(): Promise<Category[]> {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb');
        if (error) throw error;
        return data;
    }

    async getCategoryById(id: string): Promise<Category> {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("id", id)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data;
    }

    async getCategoriesByIds(ids: string[]): Promise<Category[]> {
        const categories: Category[] = [];
        for(const id of ids){
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("id", id)
                .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
                .single();
            if (error) throw error;
            categories.push(data);
        }
        return categories;
    }

    async getCategoryColorById(id: string): Promise<string> {
        const { data, error } = await supabase
            .from("categories") 
            .select("color_hex")
            .eq("id", id)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data.color_hex;
    }

    async getCategoryIdByName(name: string): Promise<string> {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("name", name)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .single();
        if (error) throw error;
        return data.id;
    }

    async getCategoriesByType(type: string): Promise<Category[]> {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("type", type)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
        if (error) throw error;
        return data;
    }

    async getCategoriesNamesByIds(ids: string[]): Promise<string[]> {
        const categoriesNames: string[] = [];
        for(const id of ids){
            const { data, error } = await supabase
                .from("categories")
                .select("name")
                .eq("id", id)
                .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
                .single();
            if (error) throw error;
            categoriesNames.push(data.name);
        }
        return categoriesNames;
    }
    async getCategoriesColorsByCategoryIds(ids: string[]): Promise<string[]> {
        const categoriesColors: string[] = [];
        for(const id of ids){
            const { data, error } = await supabase
                .from("categories")
                .select("color_hex")
                .eq("id", id)
                .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
                .single();
            if (error) throw error;
            categoriesColors.push(data.color_hex);
        }
        return categoriesColors;
    }
    
    async updateCategory(category: Category, categoryToEditId: string): Promise<Category> {
        const { data, error } = await supabase
            .from("categories")
            .update({
                name: category.name,
                color_hex: category.color_hex,
                type: category.type,
                updated_at: new Date().toISOString(),
            })
            .eq("id", categoryToEditId)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb')
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    
    async deleteCategory(id: string): Promise<boolean> {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id)
            .eq("user_id", '50baa1d0-57aa-4eff-932f-228e773784eb');
        if (error) throw error;
        return true;
    }

}