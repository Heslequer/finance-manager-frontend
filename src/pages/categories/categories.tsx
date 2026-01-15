import './categories.scss'
import { Button, Empty, Layout } from 'antd';
import NewBankAccountModal from '../../components/newBankAccountModal/newBankAccountModal';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import NewCategoryModal from '../../components/newCategoryModal/newCategoryModal';
import type { Category } from '../../services/supabase/categories/categories.interface';
import { CategoriesService } from '../../services/supabase/categories/categories.service';
import CategoryCard from '../categories/categoryCard/categoryCard';
import { Content } from 'antd/es/layout/layout';

export default function CategoriesPage() {
    const categoriesService = new CategoriesService();
    const navigate = useNavigate();
    const [showNewBankAccountModal, setShowNewBankAccountModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);	



    const handleCreateCategory = (category?: Category) => {
        setShowNewCategoryModal(true);
        setCategoryToEdit(category ?? null);
    };

    useEffect(() => {
        const fetchData = async () => {
            const categories = await categoriesService.getCategories();
            setCategories(categories);
        };
        fetchData();
    }, []);
    const updateCategories = async () => {
        const categories = await categoriesService.getCategories();
        setCategories(categories);
        console.log("categories", categories);
    };
    return (
        <>
            <Layout style={{ minHeight: "100vh" }}>
                <Sidebar onOpenDashboardPage={() => navigate('/dashboard')} onOpenCategoriesPage={() => navigate('/categories')} />
                <Layout>
                    <Content>
                        {showNewCategoryModal && (
                            <NewCategoryModal onClose={() => setShowNewCategoryModal(false)} editcategory={categoryToEdit} uptadeCategories={() => updateCategories()}/>
                        )}
                        <div className='main-content p-5'>
                            <div className="flex page-header mb-3">
                                <h3>Manage Categories</h3>
                                <Button type="primary" onClick={() => handleCreateCategory()}>New Category</Button>
                            </div>
                            <div className="categories-container flex">
                                <div className="expense-categories bd flex-column p-2">
                                    <h5 className='mb-2 red'>Expense</h5>
                                    {categories.filter((category) => category.type === "expense").length === 0 ?(
                                        <Empty description="No expense categories" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{margin: "auto"}}/>
                                        ):(categories.filter((category) => category.type === "expense").map((category) => (
                                            <CategoryCard key={`${category.id}-${category.updated_at}`} currentCategory={category} updateCategories={() => updateCategories()}></CategoryCard>
                                        )))}
                                </div>
                                <div className="income-categories bd flex-column p-2">
                                    <h5 className='mb-2 green'>Income</h5>
                                    {categories.filter((category) => category.type === "income").length === 0 ?(
                                        <Empty description="No income categories" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{margin: "auto"}}/>
                                        ):(categories.filter((category) => category.type === "income").map((category) => (
                                            <CategoryCard key={`${category.id}-${category.updated_at}`} currentCategory={category} updateCategories={() => updateCategories()}></CategoryCard>
                                        )))}
                                </div>
                            </div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    )
}