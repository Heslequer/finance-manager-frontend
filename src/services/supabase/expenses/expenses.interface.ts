export interface Expense {
    id?: string;
    amount: number;
    date: string;
    description?: string;
    user_id?: string;
    category_id?: string;
    subcategory_id?: string;
    created_at?: string;
    updated_at?: string;
}