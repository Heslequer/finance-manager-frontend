import { apiRequest } from '../http/httpClient';
import type { Subcategory } from '../../../types/subcategory.interface';

export class SubcategoriesApiService {
  async createSubcategory(subcategory: Subcategory): Promise<Subcategory> {
    const data = await apiRequest<Subcategory>('/subcategories', {
      method: 'POST',
      body: JSON.stringify({
        name: subcategory.name,
        category_id: subcategory.category_id,
      }),
    });
    return data as Subcategory;
  }

  async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
    return apiRequest<Subcategory[]>(
      `/subcategories/category/${encodeURIComponent(categoryId)}`,
    );
  }

  async getSubcategoriesByCategoryIds(categoryIds: string[]): Promise<Subcategory[]> {
    if (categoryIds.length === 0) return [];
    return apiRequest<Subcategory[]>('/subcategories/category/list', {
      method: 'POST',
      body: JSON.stringify({ categoryIds }),
    });
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    return apiRequest<Subcategory | null>(`/subcategories/${encodeURIComponent(id)}`);
  }

  async getSubcategoryByCategoryId(categoryId: string): Promise<Subcategory[]> {
    return this.getSubcategoriesByCategoryId(categoryId);
  }

  async getSubcategoryIdByName(name: string): Promise<string> {
    return apiRequest<string>(`/subcategories/by-name/${encodeURIComponent(name)}/id`);
  }

  async getSubcategoryAmountByCategoryId(categoryId: string): Promise<number> {
    return apiRequest<number>(
      `/subcategories/category/${encodeURIComponent(categoryId)}/amount`,
    );
  }

  async getCategoryIdBySubcategoryName(subcategoryName: string): Promise<string> {
    return apiRequest<string>(
      `/subcategories/by-name/${encodeURIComponent(subcategoryName)}/category-id`,
    );
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    await apiRequest(`/subcategories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  }
}

export const subcategoriesApiService = new SubcategoriesApiService();
