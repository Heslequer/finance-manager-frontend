import { apiRequest } from '../http/httpClient';
import type { Category } from '../../../types/category.interface';

export class CategoriesApiService {
  async createCategory(category: Category): Promise<Category> {
    const data = await apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: category.name,
        color_hex: category.color_hex,
        type: category.type,
      }),
    });
    return data as Category;
  }

  async getCategories(): Promise<Category[]> {
    return apiRequest<Category[]>('/categories');
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return apiRequest<Category | null>(`/categories/${encodeURIComponent(id)}`);
  }

  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return [];
    return apiRequest<Category[]>('/categories/ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async getCategoryColorById(id: string): Promise<string> {
    const color = await apiRequest<string | null>(`/categories/${encodeURIComponent(id)}/color`);
    return color ?? '';
  }

  async getCategoryIdByName(name: string): Promise<string> {
    return apiRequest<string>(`/categories/by-name/${encodeURIComponent(name)}/id`);
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    return apiRequest<Category[]>(`/categories/type/${encodeURIComponent(type)}`);
  }

  async getCategoriesNamesByIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    return apiRequest<string[]>('/categories/ids/names', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async getCategoriesColorsByCategoryIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    return apiRequest<string[]>('/categories/ids/colors', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async updateCategory(category: Category, categoryToEditId: string): Promise<Category> {
    const data = await apiRequest<Category>(`/categories/${encodeURIComponent(categoryToEditId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: category.name,
        color_hex: category.color_hex,
        type: category.type,
      }),
    });
    return data as Category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await apiRequest(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  }
}

export const categoriesApiService = new CategoriesApiService();
