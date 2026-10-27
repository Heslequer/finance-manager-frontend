import './categories.scss';
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        onOpenDashboardPage={() => navigate('/dashboard')}
        onOpenCategoriesPage={() => navigate('/categories')}
      />
      <Layout className="!bg-white-300 flex flex-col flex-1">
        <Content className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          {showNewCategoryModal && (
            <NewCategoryModal
              onClose={() => setShowNewCategoryModal(false)}
              editcategory={categoryToEdit}
              uptadeCategories={() => updateCategories()}
            />
          )}

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-blue-500 tracking-tight">Categories</h1>
              <p className="text-black-200 text-sm">
                Organize and edit your expense and income categories.
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => handleCreateCategory()}
              className="!bg-blue-500 hover:!bg-blue-600 rounded-xl px-6 flex items-center gap-2 shadow-xs"
            >
              New Category
            </Button>
          </div>

          {/* Categories Columns: Expense & Income */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <h2 className="text-xl font-semibold text-blue-500">Expense Categories</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-200/20 text-red-500">
                    {categories.filter((category) => category.type === 'expense').length}
                  </span>
                </div>
              </div>

              <Spin
                spinning={isLoading}
                indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
                size="large"
              >
                {!isLoading && categories.filter((category) => category.type === 'expense').length === 0 ? (
                  <div className="bg-white-200 border border-white-500 rounded-[24px] p-8 shadow-xs flex items-center justify-center min-h-[220px]">
                    <Empty description="No expense categories" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                ) : (
                  (() => {
                    const expenseCategories = categories.filter((category) => category.type === 'expense');
                    const startIndex = (expensePage - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginatedCategories = expenseCategories.slice(startIndex, endIndex);

                    return (
                      <div className="flex flex-col gap-4">
                        {paginatedCategories.map((category) => (
                          <CategoryCard
                            key={`${category.id}-${category.updated_at}`}
                            currentCategory={category}
                            updateCategories={() => updateCategories()}
                          />
                        ))}
                      </div>
                    );
                  })()
                )}
              </Spin>

              {!isLoading && categories.filter((category) => category.type === 'expense').length > 0 && (
                <div className="flex justify-center mt-2">
                  <Pagination
                    current={expensePage}
                    total={categories.filter((category) => category.type === 'expense').length}
                    pageSize={pageSize}
                    onChange={(page) => setExpensePage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </div>

            {/* Income Categories Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <h2 className="text-xl font-semibold text-blue-500">Income Categories</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-200/20 text-green-500">
                    {categories.filter((category) => category.type === 'income').length}
                  </span>
                </div>
              </div>

              <Spin
                spinning={isLoading}
                indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
                size="large"
              >
                {!isLoading && categories.filter((category) => category.type === 'income').length === 0 ? (
                  <div className="bg-white-200 border border-white-500 rounded-[24px] p-8 shadow-xs flex items-center justify-center min-h-[220px]">
                    <Empty description="No income categories" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                ) : (
                  (() => {
                    const incomeCategories = categories.filter((category) => category.type === 'income');
                    const startIndex = (incomePage - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginatedCategories = incomeCategories.slice(startIndex, endIndex);

                    return (
                      <div className="flex flex-col gap-4">
                        {paginatedCategories.map((category) => (
                          <CategoryCard
                            key={`${category.id}-${category.updated_at}`}
                            currentCategory={category}
                            updateCategories={() => updateCategories()}
                          />
                        ))}
                      </div>
                    );
                  })()
                )}
              </Spin>

              {!isLoading && categories.filter((category) => category.type === 'income').length > 0 && (
                <div className="flex justify-center mt-2">
                  <Pagination
                    current={incomePage}
                    total={categories.filter((category) => category.type === 'income').length}
                    pageSize={pageSize}
                    onChange={(page) => setIncomePage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}