export interface Category {
    id?: string;
    created_at?: string;
    name: string;
    color_hex: string;
    user_id: string;
    type: "income" | "expense";
    updated_at?: string;
}
