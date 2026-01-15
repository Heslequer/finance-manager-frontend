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
import { IncomesService } from '../../services/supabase/incomes/incomes.service';
import { ExpensesService } from '../../services/supabase/expenses/expenses.service';
import { useEffect, useState, useMemo } from 'react';
import { CategoriesService } from '../../services/supabase/categories/categories.service';
import Sidebar from '../../components/sidebar/sidebar';
import NewIncomeModal from '../../components/newIncomeModal/newIncomeModal';
import NewCategoryModal from '../../components/newCategoryModal/newCategoryModal';
import { useNavigate } from 'react-router-dom';
import { Layout, TreeSelect, Spin, ConfigProvider, DatePicker, type GetProps, Button, Select } from 'antd';
import { CloseOutlined, FilterOutlined, LoadingOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import { BarChart } from '@mui/x-charts/BarChart';
import type { Subcategory } from '../../services/supabase/subcategories/subcategories.interface';
import { SubcategoriesService } from '../../services/supabase/subcategories/subcategories.service';
import type { Category } from '../../services/supabase/categories/categories.interface';
import type { Expense } from '../../services/supabase/expenses/expenses.interface';
import {
  PieChart,
  type PieChartProps,
} from '@mui/x-charts/PieChart';
import dayjs from 'dayjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const incomesService = new IncomesService();
const expensesService = new ExpensesService();
const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { RangePicker } = DatePicker;
const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf('day');
};

export default function Dashboard() {
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [expensesCategories, setExpensesCategories] = useState<string[]>([]);
  const [expenseCategoriesFull, setExpenseCategoriesFull] = useState<Category[]>([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState<Subcategory[]>([]);
  const [expensesAmountByCategory, setExpensesAmountByCategory] = useState<number[]>([]);
  const [expensesCategoriesColors, setExpensesCategoriesColors] = useState<string[]>([]);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
  const [chartType, setChartType] = useState<string>('categories-bar');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('');
  const [data1, setData1] = useState<{label: string, value: number, color: string}[]>([]);
  const [data2, setData2] = useState<{label: string, value: number, color: string, categoryAmount: number}[]>([]);
  const [dataForLineChart, setDataForLineChart] = useState<{xAxisArray: number[], seriesArray: string[]}| null>(null);
  const [isLoadingExpensesChart, setIsLoadingExpensesChart] = useState<boolean>(true);
  
  // Estados para Incomes
  const [incomesCategories, setIncomesCategories] = useState<string[]>([]);
  const [incomeCategoriesFull, setIncomeCategoriesFull] = useState<Category[]>([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState<Subcategory[]>([]);
  const [incomesAmountByCategory, setIncomesAmountByCategory] = useState<number[]>([]);
  const [incomesCategoriesColors, setIncomesCategoriesColors] = useState<string[]>([]);
  const [chartTypeIncome, setChartTypeIncome] = useState<string>('categories-bar');
  const [data1Income, setData1Income] = useState<{label: string, value: number, color: string}[]>([]);
  const [data2Income, setData2Income] = useState<{label: string, value: number, color: string, categoryAmount: number}[]>([]);
  const [isLoadingIncomesChart, setIsLoadingIncomesChart] = useState<boolean>(true);
  
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingExpensesChart(true);
      setIsLoadingIncomesChart(true);
      
      const incomes = await incomesService.getIncomesAmount();
      const expenses = await expensesService.getExpensesAmount();
      const expenseCategoryIds = await expensesService.getExpenseCategoriesIds();
      const expenseCategories = await categoriesService.getCategoriesByIds(expenseCategoryIds);
      const categoriesColors = await categoriesService.getCategoriesColorsByCategoryIds(expenseCategoryIds);
      const expenseSubcategories = await subcategoriesService.getSubcategoriesByCategoryIds(expenseCategoryIds);
      const categoriesNames = await categoriesService.getCategoriesNamesByIds(expenseCategoryIds);
      setTotalIncomes(incomes);
      setTotalExpenses(expenses);
      setExpensesCategories(categoriesNames);
      setTotalBalance(incomes - expenses);
      const expensesAmountByCategory: number[] = await expensesService.getExpensesAmountByCategoriesIds(expenseCategoryIds);

      setExpensesCategoriesColors(categoriesColors);
      setExpensesAmountByCategory(expensesAmountByCategory);
      setExpenseSubcategories(expenseSubcategories);
      setExpenseCategoriesFull(expenseCategories);
      console.log("expenseCategories", expenseCategories);
      await createData1(expenseCategories);
      await createData2(expenseSubcategories);
      await createDataForLineChart();
      
      setIsLoadingExpensesChart(false);

      // Buscar dados de Incomes
      const incomeCategoryIds = await incomesService.getIncomeCategoriesIds();
      const incomeCategories = await categoriesService.getCategoriesByIds(incomeCategoryIds);
      const incomeCategoriesColors = await categoriesService.getCategoriesColorsByCategoryIds(incomeCategoryIds);
      const incomeSubcategories = await subcategoriesService.getSubcategoriesByCategoryIds(incomeCategoryIds);
      const incomeCategoriesNames = await categoriesService.getCategoriesNamesByIds(incomeCategoryIds);
      const incomesAmountByCategory: number[] = await incomesService.getIncomesAmountByCategoriesIds(incomeCategoryIds);

      setIncomesCategories(incomeCategoriesNames);
      setIncomesCategoriesColors(incomeCategoriesColors);
      setIncomesAmountByCategory(incomesAmountByCategory);
      setIncomeSubcategories(incomeSubcategories);
      setIncomeCategoriesFull(incomeCategories);
      await createData1Income(incomeCategories);
      await createData2Income(incomeSubcategories);
      
      setIsLoadingIncomesChart(false);
    };

    fetchData();
  }, []);
  
  const createData1 = async(expenseCategories: Category[]) => {
    const data1: {label: string, value: number, color: string}[] = [];
    for(const category of expenseCategories){
      const amount = await expensesService.getExpensesAmountByCategoryId(category.id!);
      data1.push({label: category.name, value: amount, color: category.color_hex});
    }
    setData1(data1);
  }

  const createData2 = async(expenseSubcategories: Subcategory[]) => {
    const data2: {label: string, value: number, color: string}[] = [];
    for(const subcategory of expenseSubcategories){
      const amount = await expensesService.getExpensesAmountBySubcategoryId(subcategory.id!);
      const subcategoryColor = await categoriesService.getCategoryColorById(subcategory.category_id);
      data2.push({label: subcategory.name, value: amount, color: subcategoryColor});
      
    }
    const updatedData2 = await Promise.all(data2.map(async (item) =>{
      const categoryId = await subcategoriesService.getCategoryIdBySubcategoryName(item.label);
      const amount = await expensesService.getExpensesAmountByCategoryId(categoryId);
      return {
        ...item,
        categoryAmount: amount,
      };
    }));
    setData2(updatedData2);
  }

  const createDataForLineChart = async () => {
    const expenses: Expense[] = await expensesService.getAllExpensesByUserId("50baa1d0-57aa-4eff-932f-228e773784eb");
    
    // Criar array de objetos com data e amount, depois ordenar por data
    const dataWithDates = expenses.map((expense: Expense) => ({
      date: expense.date,
      amount: expense.amount,
      timestamp: new Date(expense.date).getTime() // Converter para timestamp para ordenação
    }));
    
    // Ordenar por data (mais antiga primeiro)
    dataWithDates.sort((a, b) => a.timestamp - b.timestamp);
    
    // Separar em arrays ordenados
    const seriesArray: string[] = dataWithDates.map(item => item.date);
    const xAxisArray: number[] = dataWithDates.map(item => item.amount);
    
    console.log("seriesArray", seriesArray);
    console.log("xAxisArray", xAxisArray);

    setDataForLineChart({xAxisArray, seriesArray});

  }


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
          selectable: false,
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
          selectable: false,
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
      // Processar ambos os trees em paralelo usando Promise.all conceitual
      // Na prática, ambos são processados simultaneamente já que são operações síncronas
      const buildExpensesTree = () => expenseCategoriesFull.map((category) => {
        const categorySubcategories = expenseSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `expense-category-${category.id}`,
          selectable: false,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `expense-subcategory-${subcategory.id}`,
          })),
        };
      });

      const buildIncomesTree = () => incomeCategoriesFull.map((category) => {
        const categorySubcategories = incomeSubcategories.filter(
          (subcategory) => subcategory.category_id === category.id
        );
        
        return {
          label: category.name,
          title: category.name,
          value: `income-category-${category.id}`,
          selectable: false,
          children: categorySubcategories.map((subcategory) => ({
            title: subcategory.name,
            value: `income-subcategory-${subcategory.id}`,
          })),
        };
      });

      // Processar ambos simultaneamente
      const expensesTree = buildExpensesTree();
      const incomesTree = buildIncomesTree();

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

  const createData1Income = async(incomeCategories: Category[]) => {
    const data1Income: {label: string, value: number, color: string}[] = [];
    for(const category of incomeCategories){
      const amount = await incomesService.getIncomesAmountByCategoryId(category.id!);
      data1Income.push({label: category.name, value: amount, color: category.color_hex});
    }
    setData1Income(data1Income);
  }

  const createData2Income = async(incomeSubcategories: Subcategory[]) => {
    const data2Income: {label: string, value: number, color: string}[] = [];
    for(const subcategory of incomeSubcategories){
      const amount = await incomesService.getIncomesAmountBySubcategoryId(subcategory.id!);
      const subcategoryColor = await categoriesService.getCategoryColorById(subcategory.category_id);
      data2Income.push({label: subcategory.name, value: amount, color: subcategoryColor});
      
    }
    const updatedData2Income = await Promise.all(data2Income.map(async (item) =>{
      const categoryId = await subcategoriesService.getCategoryIdBySubcategoryName(item.label);
      const amount = await incomesService.getIncomesAmountByCategoryId(categoryId);
      return {
        ...item,
        categoryAmount: amount,
      };
    }));
    setData2Income(updatedData2Income);
  }

  // Configuration for Pie Chart of Categories
  const settingsCategoriesPie = {
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data1,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item) => {
          const arcAngle = (((item.endAngle - item.startAngle)) * (180 / Math.PI)); //transform radians to degrees
          if (arcAngle > 36) {
            return `${item.label} (${((item.value/totalExpenses)*100).toFixed(0)}%)`;
          } else {
            return `${((item.value/totalExpenses)*100).toFixed(0)}%`;
          }
        }, 
        arcLabelMinAngle: 20,
        arcLabelRadius: '52%',
      },
    ],
    height: 320,
    hideLegend: true,
  } satisfies PieChartProps;

  // Configuration for Pie Chart of Subcategories
  const settingsSubcategoriesPie = {
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data2,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item) => {
          const arcAngle = (((item.endAngle - item.startAngle)) * (180 / Math.PI)); //transform radians to degrees
          const categoryAmount = data2.find(dataItem => dataItem.label === item.label)?.categoryAmount || 1;
          const percentage = ((item.value/categoryAmount)*100).toFixed(0);
          if (arcAngle > 36) {
            return `${item.label} (${percentage}%)`;
          } else {
            return `${percentage}%`;
          }
        }, 
        arcLabelMinAngle: 20,
        arcLabelRadius: '52%',
      },
    ],
    height: 320,
    hideLegend: true,
  } satisfies PieChartProps;

  // Configuration for Pie Chart of Categories of Incomes
  const settingsCategoriesPieIncome = {
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data1Income,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item) => {
          const arcAngle = (((item.endAngle - item.startAngle)) * (180 / Math.PI)); //transform radians to degrees
          if (arcAngle > 36) {
            return `${item.label} (${((item.value/totalIncomes)*100).toFixed(0)}%)`;
          } else {
            return `${((item.value/totalIncomes)*100).toFixed(0)}%`;
          }
        }, 
        arcLabelMinAngle: 20,
        arcLabelRadius: '52%',
      },
    ],
    height: 320,
    hideLegend: true,
  } satisfies PieChartProps;

  // Configuration for Pie Chart of Subcategories of Incomes
  const settingsSubcategoriesPieIncome = {
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data2Income,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item) => {
          const arcAngle = (((item.endAngle - item.startAngle)) * (180 / Math.PI)); //transform radians to degrees
          const categoryAmount = data2Income.find(dataItem => dataItem.label === item.label)?.categoryAmount || 1;
          const percentage = ((item.value/categoryAmount)*100).toFixed(0);
          if (arcAngle > 36) {
            return `${item.label} (${percentage}%)`;
          } else {
            return `${percentage}%`;
          }
        }, 
        arcLabelMinAngle: 20,
        arcLabelRadius: '52%',
      },
    ],
    height: 320,
    hideLegend: true,
  } satisfies PieChartProps;

  return (
  <>
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar onOpenDashboardPage={() => navigate('/dashboard')} onOpenCategoriesPage={() => navigate('/categories')} />
      <Layout>
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
              <div className="container flex p-5">
                <div className="main-content flex-column">
                  <div className='ml-2 mb-2'>
                    <h4>Financial Reports</h4>
                    <p>Detailed analysis and insights for financial decision-making.</p>
                  </div>
                  <div className='cards-container flex-column'>
                    <div className='first-line mx-2 select-date-container card border'>
                        <div className='flex-spacebetween my-2'>
                          <div className='flex-center'>
                            <FilterOutlined style={{ fontSize: '21px' }}/>
                            <h5 className='font-weight-500 ml-1'>Filter by Date</h5>  
                          </div>
                          <Button>
                            <CloseOutlined />
                            Clear filters
                          </Button>
                        </div>
                        <div className='flex-spacebetween'>
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
                              onChange={(value) => {
                                setSelectedTransactionType(value);
                                setSelectedCategories([]); //clear selected categories when transaction type is changed
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
                              treeDefaultExpandAll
                              value={selectedCategories}
                              onChange={(value) => setSelectedCategories(value)}
                              treeData={buildCategoryTreeData}
                            />
                          </div>
                        </div>
                        <div className='flex-end mt-3'>
                          <Button type="primary">
                            <FilterOutlined />
                            Apply Filters
                          </Button>
                        </div>
                    </div>
                    <div className='second-line flex my-2'>
                      <div className="p-3 card">
                        <div className="header-card flex">
                          <h4 className="font-weight-500">Total Balance</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.4" stroke="currentColor" className="icon">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <h4 className="mt-5 green">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                      </div>

                      <div className="p-3 card">
                        <div className="header-card flex">
                          <h4 className="font-weight-500">Incomes</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" className="icon green">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                          </svg>
                        </div>
                        <h4 className="mt-5 green">R$ {totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                      </div>

                      <div className="p-3 card">
                        <div className="header-card flex">
                          <h4 className="font-weight-500">Expenses</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" className="icon red">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
                          </svg>
                        </div>
                        <h4 className="mt-5 red">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                      </div>
                    </div>

                    <div className='third-line flex my-2'>
                      <div className="grid-accurate-9 card flex-column chart-info-container">
                        <div className="flex card-header">
                          <h5 className='font-weight-500'>Expenses</h5>
                          <TreeSelect
                            defaultValue="categories-bar"
                            value={chartType}
                            key={chartType}
                            prefix={
                              chartType.split('-')[0].charAt(0).toUpperCase() + 
                              chartType.split('-')[0].slice(1).toLowerCase()
                            }
                            style={{ width: 180 }}
                            onChange={(e) => setChartType(e)}
                            placeholder="Select Chart Type"
                            treeDefaultExpandAll
                            treeData={[
                              {
                                label: 'Categories',
                                title: 'Categories',
                                value: 'categories',
                                selectable: false,
                                children: [
                                  {
                                    title: 'Bar',
                                    value: 'categories-bar',
                                  },
                                  {
                                    title: 'Pie',
                                    value: 'categories-pie',
                                  },
                                ],
                              },
                              {
                                label: 'Subcategories',
                                title: 'Subcategories',
                                value: 'subcategories',
                                selectable: false,
                                children: [
                                  {
                                    title: 'Bar',
                                    value: 'subcategories-bar',
                                  },
                                  {
                                    title: 'Pie',
                                    value: 'subcategories-pie',
                                  },
                                ],
                              },
                            ]}
                          />
                        </div>
                        <div className='chart-container pt-2'>
                          <Spin spinning={isLoadingExpensesChart}
                            indicator={<LoadingOutlined spin/>}
                            size="large"
                          >
                            {chartType === 'categories-pie' ? (
                              <PieChart
                                {...settingsCategoriesPie}
                                sx={{
                                  '& .MuiPieArcLabel-root': {
                                    textAnchor: 'middle',
                                    dominantBaseline: 'middle',
                                    fontSize: 12,
                                  }
                                }}
                              />
                            ) : chartType === 'categories-bar' ? (
                              <BarChart
                                xAxis={[{ 
                                  data: expensesCategories,
                                  colorMap: {
                                    type: "ordinal",
                                    values: expensesCategories,
                                    colors: expensesCategoriesColors,
                                  },
                                }]}
                                series={[{data: expensesAmountByCategory}]}
                                height={300}
                              />
                            ) : chartType === 'subcategories-pie' ? (
                              <PieChart
                                {...settingsSubcategoriesPie}
                                sx={{
                                  '& .MuiPieArcLabel-root': {
                                    textAnchor: 'middle',
                                    dominantBaseline: 'middle',
                                    fontSize: 12,
                                  }
                                }}
                              />
                            ) : chartType === 'subcategories-bar' ? (
                              <BarChart
                                xAxis={[{ 
                                  data: data2.map(item => item.label),
                                  colorMap: {
                                    type: "ordinal",
                                    values: data2.map(item => item.label),
                                    colors: data2.map(item => item.color),
                                  },
                                }]}
                                series={[{data: data2.map(item => item.value)}]}
                                height={300}
                              />
                            ) : (
                              <BarChart
                                xAxis={[{ 
                                  data: expensesCategories,
                                  colorMap: {
                                    type: "ordinal",
                                    values: expensesCategories,
                                    colors: expensesCategoriesColors,
                                  },
                                }]}
                                series={[{data: expensesAmountByCategory}]}
                                height={300}
                              />
                            )}
                          </Spin>                                  
                        </div>
                      </div>
                      
                      <div className="grid-accurate-9 card flex-column chart-info-container">
                        <div className="flex card-header">
                          <h5 className='font-weight-500'>Incomes</h5>
                          <TreeSelect
                            defaultValue="categories-bar"
                            value={chartTypeIncome}
                            key={chartTypeIncome}
                            prefix={
                              chartTypeIncome.split('-')[0].charAt(0).toUpperCase() + 
                              chartTypeIncome.split('-')[0].slice(1).toLowerCase()
                            }
                            style={{ width: 180 }}
                            onChange={(e) => setChartTypeIncome(e)}
                            placeholder="Select Chart Type"
                            treeDefaultExpandAll
                            treeData={[
                              {
                                label: 'Categories',
                                title: 'Categories',
                                value: 'categories',
                                selectable: false,
                                children: [
                                  {
                                    title: 'Bar',
                                    value: 'categories-bar',
                                  },
                                  {
                                    title: 'Pie',
                                    value: 'categories-pie',
                                  },
                                ],
                              },
                              {
                                label: 'Subcategories',
                                title: 'Subcategories',
                                value: 'subcategories',
                                selectable: false,
                                children: [
                                  {
                                    title: 'Bar',
                                    value: 'subcategories-bar',
                                  },
                                  {
                                    title: 'Pie',
                                    value: 'subcategories-pie',
                                  },
                                ],
                              },
                            ]}
                          />
                        </div>
                        <div className='chart-container pt-2'>
                          <Spin spinning={isLoadingIncomesChart}
                            indicator={<LoadingOutlined spin/>}
                            size="large"
                          >
                            {chartTypeIncome === 'categories-pie' ? (
                              <PieChart
                                {...settingsCategoriesPieIncome}
                                sx={{
                                  '& .MuiPieArcLabel-root': {
                                    textAnchor: 'middle',
                                    dominantBaseline: 'middle',
                                    fontSize: 12,
                                  }
                                }}
                              />
                            ) : chartTypeIncome === 'categories-bar' ? (
                              <BarChart
                                xAxis={[{ 
                                  data: incomesCategories,
                                  colorMap: {
                                    type: "ordinal",
                                    values: incomesCategories,
                                    colors: incomesCategoriesColors,
                                  },
                                }]}
                                series={[{data: incomesAmountByCategory}]}
                                height={300}
                              />
                            ) : chartTypeIncome === 'subcategories-pie' ? (
                              <PieChart
                                {...settingsSubcategoriesPieIncome}
                                sx={{
                                  '& .MuiPieArcLabel-root': {
                                    textAnchor: 'middle',
                                    dominantBaseline: 'middle',
                                    fontSize: 12,
                                  }
                                }}
                              />
                            ) : chartTypeIncome === 'subcategories-bar' ? (
                              <BarChart
                                xAxis={[{ 
                                  data: data2Income.map(item => item.label),
                                  colorMap: {
                                    type: "ordinal",
                                    values: data2Income.map(item => item.label),
                                    colors: data2Income.map(item => item.color),
                                  },
                                }]}
                                series={[{data: data2Income.map(item => item.value)}]}
                                height={300}
                              />
                            ) : (
                              <BarChart
                                xAxis={[{ 
                                  data: incomesCategories,
                                  colorMap: {
                                    type: "ordinal",
                                    values: incomesCategories,
                                    colors: incomesCategoriesColors,
                                  },
                                }]}
                                series={[{data: incomesAmountByCategory}]}
                                height={300}
                              />
                            )}
                          </Spin>                 
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </Content>
        </ConfigProvider>
      </Layout>
    </Layout>
  </>)
}