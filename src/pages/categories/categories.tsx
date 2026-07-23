import './categories.scss'
import { Button, Empty, Layout, Spin, Pagination } from 'antd';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import NewCategoryModal from '../../components/newCategoryModal/newCategoryModal';
import type { Category } from '../../types/category.interface';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import CategoryCard from '../categories/categoryCard/categoryCard';
import { Content } from 'antd/es/layout/layout';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

export default function CategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expensePage, setExpensePage] = useState(1);
    const [incomePage, setIncomePage] = useState(1);
    const pageSize = 5;	



    const handleCreateCategory = (category?: Category) => {
        setShowNewCategoryModal(true);
        setCategoryToEdit(category ?? null);
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const categories = await categoriesApiService.getCategories();
                setCategories(categories);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    const updateCategories = async () => {
        setIsLoading(true);
        try {
            const categories = await categoriesApiService.getCategories();
            setCategories(categories);
            console.log("categories", categories);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <>
            <Layout style={{ height: "100%" }}>
                <Sidebar onOpenDashboardPage={() => navigate('/reports')} onOpenCategoriesPage={() => navigate('/categories')} />
                <Layout>
                    <Content>
                        {showNewCategoryModal && (
                            <NewCategoryModal onClose={() => setShowNewCategoryModal(false)} editcategory={categoryToEdit} uptadeCategories={() => updateCategories()}/>
                        )}
                        <div className='main-content p-5' style={{ height: '100%', minHeight: '100vh' }}>
                            <div className="flex page-header mb-3">
                              <div className="flex-column">
                                <h5 className='text-midnight-navy !text-3xl !font-semibold'>Categories</h5>
                                <p className='text-steel-blue font-medium'>Organize and edit your expense and income categories</p>
                              </div>
                              <Button className='!rounded-xl !py-5 !text-base' icon={<PlusOutlined />} onClick={() => handleCreateCategory()}>New Category</Button>
                            </div>
                            <div className="flex">
                                <div className="expense-categories flex-column p-1">
                                    <h5 className='mb-2 red'>Expense</h5>
                                    <Spin className="mt-5" spinning={isLoading} indicator={<LoadingOutlined spin />} size="large">
                                        {!isLoading && categories.filter((category) => category.type === "expense").length === 0 ?(
                                            <Empty description="No expense categories" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{margin: "auto"}}/>
                                            ):(() => {
                                                const expenseCategories = categories.filter((category) => category.type === "expense");
                                                const startIndex = (expensePage - 1) * pageSize;
                                                const endIndex = startIndex + pageSize;
                                                const paginatedCategories = expenseCategories.slice(startIndex, endIndex);
                                                
                                                return (
                                                    <>
                                                    <div className='flex-column gap-3'>
                                                        {paginatedCategories.map((category) => (
                                                            <CategoryCard key={`${category.id}-${category.updated_at}`} currentCategory={category} updateCategories={() => updateCategories()}></CategoryCard>
                                                        ))}
                                                    </div>
                                                    </>
                                                );
                                            })()}
                                    </Spin>
                                    {!isLoading && categories.filter((category) => category.type === "expense").length > 0 && (
                                        <Pagination
                                            current={expensePage}
                                            total={categories.filter((category) => category.type === "expense").length}
                                            pageSize={pageSize}
                                            onChange={(page) => setExpensePage(page)}
                                            style={{ marginTop: '16px', textAlign: 'center' }}
                                        />
                                    )}
                                </div>
                                <div className="income-categories flex-column p-1">
                                    <h5 className='mb-2 green'>Income</h5>
                                    <Spin className="mt-5" spinning={isLoading} indicator={<LoadingOutlined spin />} size="large">
                                        {!isLoading && categories.filter((category) => category.type === "income").length === 0 ?(
                                            <Empty description="No income categories" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{margin: "auto"}}/>
                                            ):(() => {
                                                const incomeCategories = categories.filter((category) => category.type === "income");
                                                const startIndex = (incomePage - 1) * pageSize;
                                                const endIndex = startIndex + pageSize;
                                                const paginatedCategories = incomeCategories.slice(startIndex, endIndex);
                                                
                                                return (
                                                    <>
                                                    <div className='flex-column gap-3'>
                                                        {paginatedCategories.map((category) => (
                                                            <CategoryCard key={`${category.id}-${category.updated_at}`} currentCategory={category} updateCategories={() => updateCategories()}></CategoryCard>
                                                        ))}
                                                    </div>
                                                    </>
                                                );
                                            })()}
                                    </Spin>
                                    {!isLoading && categories.filter((category) => category.type === "income").length > 0 && (
                                        <Pagination
                                            current={incomePage}
                                            total={categories.filter((category) => category.type === "income").length}
                                            pageSize={pageSize}
                                            onChange={(page) => setIncomePage(page)}
                                            style={{ marginTop: '16px', textAlign: 'center' }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    )
}