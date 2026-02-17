import './dashboard.scss'
import { Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { useEffect, useState, useMemo } from 'react';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import Sidebar from '../../components/sidebar/sidebar';
import NewIncomeModal from '../../components/newIncomeModal/newIncomeModal';
import NewCategoryModal from '../../components/newCategoryModal/newCategoryModal';
import ChartsSection from './chartsSection/chartsSection';
import { useNavigate } from 'react-router-dom';
import { Layout, TreeSelect, ConfigProvider, DatePicker, type GetProps, Button, Select } from 'antd';
import { CloseOutlined, FilterOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import type { Subcategory } from '../../types/subcategory.interface';
import { subcategoriesApiService } from '../../services/api/subcategories/subcategories.api';
import type { Category } from '../../types/category.interface';
import dayjs from 'dayjs';

ChartJS.register(ArcElement, Tooltip, Legend);

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { RangePicker } = DatePicker;
const disabledDate: RangePickerProps['disabledDate'] = () => false; // Allow past and future dates

export default function Dashboard() {
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [_totalBalance, setTotalBalance] = useState<number>(0);
  const [expenseCategoriesFull, setExpenseCategoriesFull] = useState<Category[]>([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState<Subcategory[]>([]);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [internalSelectedCategories, setInternalSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('');
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<any[]>([]);
  
  // States for Incomes
  const [incomeCategoriesFull, setIncomeCategoriesFull] = useState<Category[]>([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState<Subcategory[]>([]);
  
  const navigate = useNavigate();
  
  // Fetch categories and subcategories for filters on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const expenseCategoryIds = await expensesApiService.getExpenseCategoriesIds();
        const validExpenseIds = expenseCategoryIds.filter((id): id is string => id != null && id !== 'null' && id !== 'undefined');
        if (validExpenseIds.length > 0) {
          const expenseCategories = await categoriesApiService.getCategoriesByIds(validExpenseIds);
          const expenseSubcategories = await subcategoriesApiService.getSubcategoriesByCategoryIds(validExpenseIds);
          setExpenseSubcategories(expenseSubcategories);
          setExpenseCategoriesFull(expenseCategories);
        } else {
          setExpenseSubcategories([]);
          setExpenseCategoriesFull([]);
        }

        const incomeCategoryIds = await incomesApiService.getIncomeCategoriesIds();
        const validIncomeIds = incomeCategoryIds.filter((id): id is string => id != null && id !== 'null' && id !== 'undefined');
        if (validIncomeIds.length > 0) {
          const incomeCategories = await categoriesApiService.getCategoriesByIds(validIncomeIds);
          const incomeSubcategories = await subcategoriesApiService.getSubcategoriesByCategoryIds(validIncomeIds);
          setIncomeSubcategories(incomeSubcategories);
          setIncomeCategoriesFull(incomeCategories);
        } else {
          setIncomeSubcategories([]);
          setIncomeCategoriesFull([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);


  // Function to calculate date range based on period
  const getDateRangeFromPeriod = (period: string): [Date, Date] | null => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (period) {
      case 'last_week': {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return [start, today];
      }
      case 'last_month': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        return [start, today];
      }
      case 'last_3_months': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        return [start, today];
      }
      case 'all_time':
        return null; // No date filter
      default:
        return null;
    }
  };

  // Function to apply filters
  const applyFilters = async () => {
    const userId = '50baa1d0-57aa-4eff-932f-228e773784eb';
    
    // Fetch all expenses and incomes
    const [allExpenses, allIncomes] = await Promise.all([
      expensesApiService.getAllExpensesByUserId(userId),
      incomesApiService.getAllIncomesByUserId(userId),
    ]);

    let filteredExp: any[] = [...allExpenses];
    let filteredInc: any[] = [...allIncomes];

    // Apply date filter
    let dateRange: [Date, Date] | null = null;
    if (selectedPeriod === 'custom' && selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
      const start = selectedDateRange[0].toDate();
      start.setHours(0, 0, 0, 0);
      const end = selectedDateRange[1].toDate();
      end.setHours(23, 59, 59, 999);
      dateRange = [start, end];
    } else if (selectedPeriod && selectedPeriod !== 'custom' && selectedPeriod !== 'all_time') {
      dateRange = getDateRangeFromPeriod(selectedPeriod);
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filteredExp = filteredExp.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
      filteredInc = filteredInc.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      });
    }

    // Apply transaction type filter
    if (selectedTransactionType === 'expense') {
      filteredInc = [];
    } else if (selectedTransactionType === 'income') {
      filteredExp = [];
    }

    // Apply category/subcategory filter using internal selection
    if (internalSelectedCategories.size > 0) {
      const categoryIds: string[] = [];
      const subcategoryIds: string[] = [];

      internalSelectedCategories.forEach(cat => {
        if (cat.startsWith('expense-category-')) {
          categoryIds.push(cat.replace('expense-category-', ''));
        } else if (cat.startsWith('expense-subcategory-')) {
          subcategoryIds.push(cat.replace('expense-subcategory-', ''));
        } else if (cat.startsWith('income-category-')) {
          categoryIds.push(cat.replace('income-category-', ''));
        } else if (cat.startsWith('income-subcategory-')) {
          subcategoryIds.push(cat.replace('income-subcategory-', ''));
        }
      });

      if (categoryIds.length > 0 || subcategoryIds.length > 0) {
        filteredExp = filteredExp.filter(expense => {
          if (categoryIds.length > 0 && expense.category_id && categoryIds.includes(expense.category_id)) {
            return true;
          }
          if (subcategoryIds.length > 0 && expense.subcategory_id && subcategoryIds.includes(expense.subcategory_id)) {
            return true;
          }
          return false;
        });

        filteredInc = filteredInc.filter(income => {
          if (categoryIds.length > 0 && income.category_id && categoryIds.includes(income.category_id)) {
            return true;
          }
          if (subcategoryIds.length > 0 && income.subcategory_id && subcategoryIds.includes(income.subcategory_id)) {
            return true;
          }
          return false;
        });
      }
    }

    // Calculate totals
    const totalExp = filteredExp.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalInc = filteredInc.reduce((sum, inc) => sum + Number(inc.amount), 0);

    setFilteredExpenses(filteredExp);
    setFilteredIncomes(filteredInc);
    setTotalExpenses(totalExp);
    setTotalIncomes(totalInc);
    setTotalBalance(totalInc - totalExp);
    setFiltersApplied(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedPeriod(undefined);
    setSelectedDateRange(null);
    setSelectedTransactionType('');
    setSelectedCategories([]);
    setInternalSelectedCategories(new Set());
    setFiltersApplied(false);
    setTotalExpenses(0);
    setTotalIncomes(0);
    setTotalBalance(0);
    setFilteredExpenses([]);
    setFilteredIncomes([]);
  };

  const { SHOW_PARENT } = TreeSelect;
  const buildCategoryTreeData = useMemo(() => {
    
    if (selectedTransactionType === 'expense') {
      const categoriesTree = expenseCategoriesFull.map((category) => {
        const categorySubcategories = expenseSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `expense-category-${category.id}`,
          selectable: true,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `expense-subcategory-${subcategory.id}`,
          })),
        };
      });

      return [
        {
          label: 'Expenses',
          title: 'Expenses',
          value: 'expense-group',
          selectable: true,
          children: categoriesTree,
        },
      ];
    } else if (selectedTransactionType === 'income') {
      const categoriesTree = incomeCategoriesFull.map((category) => {
        const categorySubcategories = incomeSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `income-category-${category.id}`,
          selectable: true,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `income-subcategory-${subcategory.id}`,
          })),
        };
      });

      return [
        {
          label: 'Incomes',
          title: 'Incomes',
          value: 'income-group',
          selectable: true,
          children: categoriesTree,
        },
      ];
    } else if (selectedTransactionType === 'all') {
      // Build expenses tree with categories and subcategories
      const expensesTree = expenseCategoriesFull.map((category) => {
        const categorySubcategories = expenseSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `expense-category-${category.id}`,
          selectable: true,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `expense-subcategory-${subcategory.id}`,
          })),
        };
      });

      // Build incomes tree with categories and subcategories
      const incomesTree = incomeCategoriesFull.map((category) => {
        const categorySubcategories = incomeSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `income-category-${category.id}`,
          selectable: true,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `income-subcategory-${subcategory.id}`,
          })),
        };
      });

      return [
        {
          label: 'Expenses',
          title: 'Expenses',
          value: 'expenses-group',
          selectable: true,
          children: expensesTree,
        },
        {
          label: 'Incomes',
          title: 'Incomes',
          value: 'incomes-group',
          selectable: true,
          children: incomesTree,
        },
      ];
    }
    return [];
  }, [selectedTransactionType, expenseCategoriesFull, expenseSubcategories, incomeCategoriesFull, incomeSubcategories]);

  // Calculate which values should be displayed in TreeSelect (showing parent when all children are selected)
  const getDisplayedValues = useMemo(() => {
    const internalSet = new Set(internalSelectedCategories);
    const displayed: string[] = [];

    // Check if all expenses are selected
    const allExpenseCategoriesSelected = expenseCategoriesFull.every(category => {
      const categorySelected = internalSet.has(`expense-category-${category.id}`);
      const allSubcategoriesSelected = expenseSubcategories
        .filter(sub => sub.category_id === category.id)
        .every(sub => internalSet.has(`expense-subcategory-${sub.id}`));
      return categorySelected && allSubcategoriesSelected;
    });

    if (allExpenseCategoriesSelected && expenseCategoriesFull.length > 0) {
      displayed.push(selectedTransactionType === 'all' ? 'expenses-group' : 'expense-group');
    } else {
      // Check each expense category
      expenseCategoriesFull.forEach(category => {
        const categorySelected = internalSet.has(`expense-category-${category.id}`);
        const subcategories = expenseSubcategories.filter(sub => sub.category_id === category.id);
        const allSubcategoriesSelected = subcategories.every(sub => 
          internalSet.has(`expense-subcategory-${sub.id}`)
        );

        if (categorySelected && allSubcategoriesSelected && subcategories.length > 0) {
          displayed.push(`expense-category-${category.id}`);
        } else {
          // Add individual selections
          if (categorySelected) displayed.push(`expense-category-${category.id}`);
          subcategories.forEach(sub => {
            if (internalSet.has(`expense-subcategory-${sub.id}`)) {
              displayed.push(`expense-subcategory-${sub.id}`);
            }
          });
        }
      });
    }

    // Check if all incomes are selected
    const allIncomeCategoriesSelected = incomeCategoriesFull.every(category => {
      const categorySelected = internalSet.has(`income-category-${category.id}`);
      const allSubcategoriesSelected = incomeSubcategories
        .filter(sub => sub.category_id === category.id)
        .every(sub => internalSet.has(`income-subcategory-${sub.id}`));
      return categorySelected && allSubcategoriesSelected;
    });

    if (allIncomeCategoriesSelected && incomeCategoriesFull.length > 0) {
      displayed.push(selectedTransactionType === 'all' ? 'incomes-group' : 'income-group');
    } else {
      // Check each income category
      incomeCategoriesFull.forEach(category => {
        const categorySelected = internalSet.has(`income-category-${category.id}`);
        const subcategories = incomeSubcategories.filter(sub => sub.category_id === category.id);
        const allSubcategoriesSelected = subcategories.every(sub => 
          internalSet.has(`income-subcategory-${sub.id}`)
        );

        if (categorySelected && allSubcategoriesSelected && subcategories.length > 0) {
          displayed.push(`income-category-${category.id}`);
        } else {
          // Add individual selections
          if (categorySelected) displayed.push(`income-category-${category.id}`);
          subcategories.forEach(sub => {
            if (internalSet.has(`income-subcategory-${sub.id}`)) {
              displayed.push(`income-subcategory-${sub.id}`);
            }
          });
        }
      });
    }

    return displayed;
  }, [internalSelectedCategories, expenseCategoriesFull, expenseSubcategories, incomeCategoriesFull, incomeSubcategories, selectedTransactionType]);

  // Handle TreeSelect onChange with automatic selection of children
  const handleCategoryTreeChange = (value: string[]) => {
    const currentDisplayed = new Set(selectedCategories);
    const newDisplayed = new Set(value);
    
    // Find what was added or removed in the displayed values
    const added = value.filter(v => !currentDisplayed.has(v));
    const removed = selectedCategories.filter(v => !newDisplayed.has(v));

    const newInternalSet = new Set(internalSelectedCategories);

    // Process additions
    for (const addedValue of added) {
      if (addedValue === 'expenses-group' || addedValue === 'expense-group') {
        // Select all expense categories and subcategories internally
        expenseCategoriesFull.forEach(category => {
          newInternalSet.add(`expense-category-${category.id}`);
          const subcategories = expenseSubcategories.filter(
            sub => sub.category_id === category.id
          );
          subcategories.forEach(sub => {
            newInternalSet.add(`expense-subcategory-${sub.id}`);
          });
        });
      } else if (addedValue === 'incomes-group' || addedValue === 'income-group') {
        // Select all income categories and subcategories internally
        incomeCategoriesFull.forEach(category => {
          newInternalSet.add(`income-category-${category.id}`);
          const subcategories = incomeSubcategories.filter(
            sub => sub.category_id === category.id
          );
          subcategories.forEach(sub => {
            newInternalSet.add(`income-subcategory-${sub.id}`);
          });
        });
      } else if (addedValue.startsWith('expense-category-')) {
        // Select all subcategories of this expense category internally
        const categoryId = addedValue.replace('expense-category-', '');
        newInternalSet.add(`expense-category-${categoryId}`);
        const subcategories = expenseSubcategories.filter(
          sub => sub.category_id === categoryId
        );
        subcategories.forEach(sub => {
          newInternalSet.add(`expense-subcategory-${sub.id}`);
        });
      } else if (addedValue.startsWith('income-category-')) {
        // Select all subcategories of this income category internally
        const categoryId = addedValue.replace('income-category-', '');
        newInternalSet.add(`income-category-${categoryId}`);
        const subcategories = incomeSubcategories.filter(
          sub => sub.category_id === categoryId
        );
        subcategories.forEach(sub => {
          newInternalSet.add(`income-subcategory-${sub.id}`);
        });
      } else {
        // Individual subcategory or other selection
        newInternalSet.add(addedValue);
      }
    }

    // Process removals
    for (const removedValue of removed) {
      if (removedValue === 'expenses-group' || removedValue === 'expense-group') {
        // Remove all expense categories and subcategories internally
        expenseCategoriesFull.forEach(category => {
          newInternalSet.delete(`expense-category-${category.id}`);
          const subcategories = expenseSubcategories.filter(
            sub => sub.category_id === category.id
          );
          subcategories.forEach(sub => {
            newInternalSet.delete(`expense-subcategory-${sub.id}`);
          });
        });
      } else if (removedValue === 'incomes-group' || removedValue === 'income-group') {
        // Remove all income categories and subcategories internally
        incomeCategoriesFull.forEach(category => {
          newInternalSet.delete(`income-category-${category.id}`);
          const subcategories = incomeSubcategories.filter(
            sub => sub.category_id === category.id
          );
          subcategories.forEach(sub => {
            newInternalSet.delete(`income-subcategory-${sub.id}`);
          });
        });
      } else if (removedValue.startsWith('expense-category-')) {
        // Remove all subcategories of this expense category internally
        const categoryId = removedValue.replace('expense-category-', '');
        newInternalSet.delete(`expense-category-${categoryId}`);
        const subcategories = expenseSubcategories.filter(
          sub => sub.category_id === categoryId
        );
        subcategories.forEach(sub => {
          newInternalSet.delete(`expense-subcategory-${sub.id}`);
        });
      } else if (removedValue.startsWith('income-category-')) {
        // Remove all subcategories of this income category internally
        const categoryId = removedValue.replace('income-category-', '');
        newInternalSet.delete(`income-category-${categoryId}`);
        const subcategories = incomeSubcategories.filter(
          sub => sub.category_id === categoryId
        );
        subcategories.forEach(sub => {
          newInternalSet.delete(`income-subcategory-${sub.id}`);
        });
      } else {
        // Individual subcategory or other selection
        newInternalSet.delete(removedValue);
      }
    }

    setInternalSelectedCategories(newInternalSet);
  };

  // Update displayed values when internal selection changes
  useEffect(() => {
    const displayed = getDisplayedValues;
    setSelectedCategories(displayed);
  }, [getDisplayedValues]);

  return (
  <>
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar onOpenDashboardPage={() => navigate('/dashboard')} onOpenCategoriesPage={() => navigate('/categories')} />
      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ConfigProvider
          theme={{
            components: {
              Spin: {
                dotSizeLG: 50,
              },
            },
          }}
        >
          <Content>
              {isIncomeModalOpen && (
                <NewIncomeModal onClose={() => setIsIncomeModalOpen(false)} income={null}>
                </NewIncomeModal>
              )}
              {isCategoryModalOpen && (
                <NewCategoryModal onClose={() => setIsCategoryModalOpen(false)} uptadeCategories={() => {}}>
                </NewCategoryModal>
              )}
              <div className="flex p-5">
                <div className="main-content flex-column" style={{ height: '100%'}}>
                  <div className='ml-2 mb-2'>
                    <h4>Financial Reports</h4>
                    <p>Detailed analysis and insights for financial decision-making.</p>
                  </div>
                  <div className='cards-container flex-column'>
                    <div className='first-line mx-2 select-date-container card border'>
                        <div className='flex-space-between my-2'>
                          <div className='flex-center'>
                            <FilterOutlined style={{ fontSize: '21px' }}/>
                            <h5 className='font-weight-500 ml-1'>Filter by Date</h5>  
                          </div>
                          <Button
                            onClick={clearFilters}
                          >
                            <CloseOutlined />
                            Clear filters
                          </Button>
                        </div>
                        <div className='flex-space-between'>
                          <div className='flex-column gap-1'>
                            <p>Quick Filter Period</p>
                            <Select
                              style={{ width: 190 }}
                              placeholder="Select a Period"
                              value={selectedPeriod}
                              onChange={(value) => {
                                setSelectedPeriod(value);
                                if (value !== 'custom') {
                                  setSelectedDateRange(null);
                                }
                              }}
                              options={[
                                {value: 'last_week', label: 'Last Week'},
                                {value: 'last_month', label: 'Last Month'},
                                {value: 'last_3_months', label: 'Last 3 Months'},
                                {value: 'all_time', label: 'All Time'},
                                {value: 'custom', label: 'Custom'},
                              ]}
                            />
                          </div>
                          <div className='flex-column gap-1'>
                            <p>Date Range</p>
                            <RangePicker 
                              value={selectedPeriod === 'custom' ? selectedDateRange : undefined}
                              onChange={(dates) => setSelectedDateRange(dates)}
                              disabled={selectedPeriod !== 'custom'}
                              disabledDate={disabledDate}
                              allowClear
                              allowEmpty
                              style={{ width: 350 }} 
                            />
                          </div>
                          <div className='flex-column gap-1'>
                            <p>Transaction Type</p>
                            <Select
                              placeholder="Select a Type"
                              value={selectedTransactionType || undefined}
                              onChange={(value) => {
                                setSelectedTransactionType(value);
                                setSelectedCategories([]); //clear selected categories when transaction type is changed
                                setInternalSelectedCategories(new Set()); //clear internal selection
                              }}
                              options={[
                                {value: 'expense', label: 'Expense'},
                                {value: 'income', label: 'Income'},
                                {value: 'all', label: 'All'},   
                              ]}
                            />
                          </div>
                          <div className='flex-column gap-1'>
                            <p>Select a Category or Subcategory</p>
                            <TreeSelect
                              multiple
                              style={{ width: 300 }}
                              placeholder="Select categories"
                              value={selectedCategories}
                              treeCheckable={true}
                              showCheckedStrategy={SHOW_PARENT}
                              onChange={handleCategoryTreeChange}
                              treeData={buildCategoryTreeData}
                            />
                          </div>
                        </div>
                        <div className='flex-end mt-3'>
                          <Button type="primary" onClick={applyFilters}>
                            <FilterOutlined />
                            Apply Filters
                          </Button>
                        </div>
                    </div>
                    <div className='second-line flex my-2'>
                    </div>

                    <ChartsSection
                      totalExpenses={totalExpenses}
                      totalIncomes={totalIncomes}
                      filtersApplied={filtersApplied}
                      filteredExpenses={filteredExpenses}
                      filteredIncomes={filteredIncomes}
                    />
                  </div>
                </div>
              </div>
          </Content>
        </ConfigProvider>
      </Layout>
    </Layout>
  </>)
}