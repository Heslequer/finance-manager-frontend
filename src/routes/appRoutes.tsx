import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/dashboard/dashboard";
import CategoriesPage from "../pages/categories/categories";
import Transactions from "../pages/dashboard/transactions/transactions";

type ModalProps = {
    openNotification: (type: string, message: string, description?: string) => any;
}

export default function AppRoutes( {openNotification}: ModalProps) {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<CategoriesPage />}/>
            <Route path="/dashboard" element={<Dashboard />}/>
            <Route path="/transactions" element={<Transactions onOpenNotification={(type: string, message: string, description?: string) => openNotification(type, message, description)} />}/>
        </Routes>
    )
}