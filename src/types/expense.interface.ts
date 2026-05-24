export interface Expense {
    id?: string;
    amount: number;
    date: string;
    description?: string;
    user_id?: string;
    category_id?: string | null;
    subcategory_id?: string | null;
    created_at?: string;
    updated_at?: string;
}
