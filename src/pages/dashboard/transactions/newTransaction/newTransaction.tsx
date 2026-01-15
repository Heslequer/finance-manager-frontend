import "./newTransaction.scss";
import type { Expense } from "../../../../services/supabase/expenses/expenses.interface";
import type { Income } from "../../../../services/supabase/incomes/incomes.interface";
import { CategoriesService } from "../../../../services/supabase/categories/categories.service";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { EditOutlined } from '@ant-design/icons';
type NewTransactionProps = {
    expense: Expense | null;
    income: Income | null;
    onSendExpenseOrIncome: (expense: Expense | null, income: Income | null) => void;
}
export default function NewTransaction({expense, income, onSendExpenseOrIncome}: NewTransactionProps) {
    const [expenseCategoryColors, setExpenseCategoryColors] = useState<string[]>([]);
    const [expenseCategoryNames, setExpenseCategoryNames] = useState<string[]>([]);
    const [incomeCategoryColors, setIncomeCategoryColors] = useState<string[]>([]);
    const [incomeCategoryNames, setIncomeCategoryNames] = useState<string[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            const categoriesService = new CategoriesService();
            let expenseCategoryColors: string[] = [];
            let expenseCategoryNames: string[] = [];
            let incomeCategoryColors: string[] = [];
            let incomeCategoryNames: string[] = [];
            if(expense){
                const expenseCategoryArray: string[] = expense.category;
                const expenseCategoryIds: string[] = expense.category_ids;
                for(const index in expenseCategoryArray){
                    const categoryColor: string = await categoriesService.getCategoryColorById(expenseCategoryIds[index]);
                    expenseCategoryColors.push(categoryColor);
                    expenseCategoryNames.push(expenseCategoryArray[index]);
                }
            }
            if(income){
                const incomeCategoryArray: string[] = income.category;
                const incomeCategoryIds: string[] = income.category_ids;
                for(const index in incomeCategoryArray){
                    const categoryColor: string = await categoriesService.getCategoryColorById(incomeCategoryIds[index]);
                    incomeCategoryColors.push(categoryColor);
                    incomeCategoryNames.push(incomeCategoryArray[index]);
                }
            }
            setIncomeCategoryNames(incomeCategoryNames);
            setIncomeCategoryColors(incomeCategoryColors);
            setExpenseCategoryNames(expenseCategoryNames);
            setExpenseCategoryColors(expenseCategoryColors);
        }
        fetchData();
    }, []);
    const handleEdit = (expense: Expense | null, income: Income | null) => {
        if(expense){
            console.log("edit expense"+ expense.date);
            onSendExpenseOrIncome(expense, null);
            // alert("edit expense"+ expense.amount);
            // openExpenseModal = true;
        }
        if(income){
            onSendExpenseOrIncome(null, income);
            // openIncomeModal = true;
            // alert("edit income"+ income.amount);
            // <NewIncomeModal onClose={() => {}} income={income} />
        }
    }
    return (
        <>
            <tr className="transaction-row">
                {expense && (
                    <>
                        <td style={{color: "red"}}><strong >Expense</strong></td>
                        <td>R$ {expense.amount.toFixed(2).replace(".", ",")}</td>
                        <td className="category-names">
                            <div className="category-names-container">
                                {expenseCategoryNames.map((category, index) =>(<span  key={category} style={{backgroundColor: `${expenseCategoryColors[index]}60`}}><p>{category.toString()}</p></span>))}
                            </div>
                        </td>
                        <td>{new Date(expense.date).toLocaleDateString("en-US", {day: "2-digit", month: "short", year: "numeric"})}</td>   
                    </>
                )}
                {income && (
                    <>
                        <td style={{color: "green"}}><strong>Income</strong></td>
                        <td>R$ {income.amount.toFixed(2).replace(".", ",")}</td>
                        <td className="category-names">
                            <div className="category-names-container">
                                {incomeCategoryNames.map((category, index) =>(<span key={category} style={{backgroundColor: `${incomeCategoryColors[index]}60`}}><p>{category.toString()}</p></span>))}
                            </div>
                        </td>
                        <td>{new Date(income.date).toLocaleDateString("en-US", {day: "2-digit", month: "short", year: "numeric"})}</td>
                    </>
                )}
                <td className="edit-button-td">
                    <div className="edit-button-container">
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(expense, income)} target="_blank" />
                    </div>
                </td>
            </tr>
        </>
    )
}