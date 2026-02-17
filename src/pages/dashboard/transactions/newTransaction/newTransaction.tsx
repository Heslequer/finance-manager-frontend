import "./newTransaction.scss";
import type { Expense } from "../../../../types/expense.interface";
import type { Income } from "../../../../types/income.interface";
import { categoriesApiService } from "../../../../services/api/categories/categories.api";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { EditOutlined } from '@ant-design/icons';
type NewTransactionProps = {
    expense: Expense | null;
    income: Income | null;
    onSendExpenseOrIncome: (expense: Expense | null, income: Income | null) => void;
}
export default function NewTransaction({expense, income, onSendExpenseOrIncome}: NewTransactionProps) {
    const [expenseCategoryColor, setExpenseCategoryColor] = useState<string>("");
    const [expenseCategoryName, setExpenseCategoryName] = useState<string>("");
    const [incomeCategoryColor, setIncomeCategoryColor] = useState<string>("");
    const [incomeCategoryName, setIncomeCategoryName] = useState<string>("");
    useEffect(() => {
        const fetchData = async () => {
            if(expense && expense.category_id){
                const categoryColor: string = await categoriesApiService.getCategoryColorById(expense.category_id);
                const category = await categoriesApiService.getCategoryById(expense.category_id);
                setExpenseCategoryColor(categoryColor);
                setExpenseCategoryName(category?.name ?? '');
            } else {
                setExpenseCategoryColor("");
                setExpenseCategoryName("");
            }
            if(income && income.category_id){
                const categoryColor: string = await categoriesApiService.getCategoryColorById(income.category_id);
                const category = await categoriesApiService.getCategoryById(income.category_id);
                setIncomeCategoryColor(categoryColor);
                setIncomeCategoryName(category?.name ?? '');
            } else {
                setIncomeCategoryColor("");
                setIncomeCategoryName("");
            }
        }
        fetchData();
    }, [expense, income]);
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
                                {expenseCategoryName && (
                                    <span style={{backgroundColor: `${expenseCategoryColor}60`}}>
                                        <p>{expenseCategoryName}</p>
                                    </span>
                                )}
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
                                {incomeCategoryName && (
                                    <span style={{backgroundColor: `${incomeCategoryColor}60`}}>
                                        <p>{incomeCategoryName}</p>
                                    </span>
                                )}
                            </div>
                        </td>
                        <td>{new Date(income.date).toLocaleDateString("en-US", {day: "2-digit", month: "short", year: "numeric"})}</td>
                    </>
                )}
                <td className="edit-button-td">
                    <div className="edit-button-container">
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(expense, income)} />
                    </div>
                </td>
            </tr>
        </>
    )
}