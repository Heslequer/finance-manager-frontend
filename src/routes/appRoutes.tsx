import { Routes, Route } from "react-router-dom";
import Reports from "../pages/reports/reports";
import CategoriesPage from "../pages/categories/categories";
import Transactions from "../pages/reports/transactions/transactions";
import LoginPage from "../pages/login/login";
import SignUpPage from "../pages/signUp/signUp";
import CreditCards from "../pages/creditCards/creditCards";
type ModalProps = {
    openNotification: (type: string, message: string, description?: string) => any;
}

export default function AppRoutes( {openNotification}: ModalProps) {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/categories" element={<CategoriesPage />}/>
            <Route path="/reports" element={<Reports />}/>
            <Route path="/transactions" element={<Transactions onOpenNotification={(type: string, message: string, description?: string) => openNotification(type, message, description)} />}/>
            <Route path="/credit-cards" element={<CreditCards/>}/>
        </Routes>
    )
}