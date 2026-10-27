import './chartsSection.scss';
import { TreeSelect, Spin, Select, Progress, Divider, Empty } from 'antd';
import {
  LoadingOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import {
  PieChart,
  type PieChartProps,
} from '@mui/x-charts/PieChart';
import { useEffect, useState, useMemo } from 'react';
import { categoriesApiService } from '../../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../../services/api/subcategories/subcategories.api';
import type { Category } from '../../../types/category.interface';
import type { Subcategory } from '../../../types/subcategory.interface';
import type { Expense } from '../../../types/expense.interface';
import type { Income } from '../../../types/income.interface';


type ChartsSectionProps = {
  totalExpenses: number;
  totalIncomes: number;
  filtersApplied: boolean;
  filteredExpenses: Expense[];
  filteredIncomes: Income[];
};

export default function ChartsSection({
  totalExpenses,
  totalIncomes,
  filtersApplied,
  filteredExpenses,
  filteredIncomes,
}: ChartsSectionProps) {
  // States for Expenses
  const [chartType, setChartType] = useState<string>('categories-bar');
  const [isLoadingExpensesChart, setIsLoadingExpensesChart] = useState<boolean>(true);
  const [expensesCategories, setExpensesCategories] = useState<string[]>([]);
  const [expensesAmountByCategory, setExpensesAmountByCategory] = useState<number[]>([]);
  const [expensesCategoriesColors, setExpensesCategoriesColors] = useState<string[]>([]);
  const [data1, setData1] = useState<{label: string, value: number, color: string}[]>([]);
  const [data2, setData2] = useState<{label: string, value: number, color: string, categoryAmount: number}[]>([]);

  // States for Incomes
  const [chartTypeIncome, setChartTypeIncome] = useState<string>('categories-bar');
  const [isLoadingIncomesChart, setIsLoadingIncomesChart] = useState<boolean>(true);
  const [incomesCategories, setIncomesCategories] = useState<string[]>([]);
  const [incomesAmountByCategory, setIncomesAmountByCategory] = useState<number[]>([]);
  const [incomesCategoriesColors, setIncomesCategoriesColors] = useState<string[]>([]);
  const [data1Income, setData1Income] = useState<{label: string, value: number, color: string}[]>([]);
  const [data2Income, setData2Income] = useState<{label: string, value: number, color: string, categoryAmount: number}[]>([]);

  // States for Line Chart
  const [isLoadingLineChart, setIsLoadingLineChart] = useState<boolean>(true);
  const [lineChartLabels, setLineChartLabels] = useState<string[]>([]);
  const [incomesLineData, setIncomesLineData] = useState<number[]>([]);
  const [expensesLineData, setExpensesLineData] = useState<number[]>([]);
  const [lineChartTimeframe, setLineChartTimeframe] = useState<string>('day');

  // States for Category Ranking
  const [rankingData, setRankingData] = useState<Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense'; color: string }>>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(true);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allIncomes, setAllIncomes] = useState<Income[]>([]);

  // Functions to create data for Expenses
  const createData1 = async(expenseCategories: Category[]) => {
    const data1: {label: string, value: number, color: string}[] = [];
    for(const category of expenseCategories){
      // Calculate amount from filtered expenses
      const amount = filteredExpenses
        .filter(exp => exp.category_id === category.id)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      data1.push({label: category.name, value: amount, color: category.color_hex});
    }
    setData1(data1);
  }

  const createData2 = (expenseSubcategories: Subcategory[], categories: Category[]) => {
    const data2: {label: string, value: number, color: string}[] = [];
    for(const subcategory of expenseSubcategories){
      // Calculate amount from filtered expenses
      const amount = filteredExpenses
        .filter(exp => exp.subcategory_id === subcategory.id)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      const parentCategory = categories.find(cat => cat.id === subcategory.category_id);
      const subcategoryColor = parentCategory?.color_hex || '#C72629';
      data2.push({label: subcategory.name, value: amount, color: subcategoryColor});
    }
    const updatedData2 = data2.map((item) =>{
      const subcategory = expenseSubcategories.find(sub => sub.name === item.label);
      if (!subcategory) return { ...item, categoryAmount: 0 };
      const categoryId = subcategory.category_id;
      // Calculate category amount from filtered expenses
      const amount = filteredExpenses
        .filter(exp => exp.category_id === categoryId)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      return {
        ...item,
        categoryAmount: amount,
      };
    });
    setData2(updatedData2);
  }

  // Functions to create data for Incomes
  const createData1Income = async(incomeCategories: Category[]) => {
    const data1Income: {label: string, value: number, color: string}[] = [];
    for(const category of incomeCategories){
      // Calculate amount from filtered incomes
      const amount = filteredIncomes
        .filter(inc => inc.category_id === category.id)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      data1Income.push({label: category.name, value: amount, color: category.color_hex});
    }
    setData1Income(data1Income);
  }

  const createData2Income = (incomeSubcategories: Subcategory[], categories: Category[]) => {
    const data2Income: {label: string, value: number, color: string}[] = [];
    for(const subcategory of incomeSubcategories){
      // Calculate amount from filtered incomes
      const amount = filteredIncomes
        .filter(inc => inc.subcategory_id === subcategory.id)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      const parentCategory = categories.find(cat => cat.id === subcategory.category_id);
      const subcategoryColor = parentCategory?.color_hex || '#26C739';
      data2Income.push({label: subcategory.name, value: amount, color: subcategoryColor});
    }
    const updatedData2Income = data2Income.map((item) =>{
      const subcategory = incomeSubcategories.find(sub => sub.name === item.label);
      if (!subcategory) return { ...item, categoryAmount: 0 };
      const categoryId = subcategory.category_id;
      // Calculate category amount from filtered incomes
      const amount = filteredIncomes
        .filter(inc => inc.category_id === categoryId)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      return {
        ...item,
        categoryAmount: amount,
      };
    });
    setData2Income(updatedData2Income);
  }

  // Function to prepare line chart data grouped by timeframe (day, week, or month)
  const prepareLineChartData = (incomes: Income[], expenses: Expense[], timeframe: string) => {
    setIsLoadingLineChart(true);

    // Group data based on timeframe
    const groupedData: { [key: string]: { incomes: number; expenses: number } } = {};

    // Helper function to get the key based on timeframe
    const getGroupKey = (date: Date): string => {
      if (timeframe === 'day') {
        // Group by day: YYYY-MM-DD
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else if (timeframe === 'week') {
        // Group by week: Calculate the start of the week (Monday as first day)
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        // Adjust to Monday (day 1) as start of week
        const diff = day === 0 ? 6 : day - 1; // If Sunday (0), go back 6 days, else go back (day-1) days
        weekStart.setDate(weekStart.getDate() - diff);
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      } else {
        // Group by month: YYYY-MM
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    };

    // Helper function to format label based on timeframe
    const formatLabel = (key: string): string => {
      if (timeframe === 'day') {
        const [year, month, day] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      } else if (timeframe === 'week') {
        const [year, month, day] = key.split('-');
        const weekStart = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
      } else {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      }
    };

    // Process incomes
    (incomes || []).forEach(income => {
      const date = new Date(income.date);
      const groupKey = getGroupKey(date);
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = { incomes: 0, expenses: 0 };
      }
      groupedData[groupKey].incomes += Number(income.amount);
    });

    // Process expenses
    (expenses || []).forEach(expense => {
      const date = new Date(expense.date);
      const groupKey = getGroupKey(date);
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = { incomes: 0, expenses: 0 };
      }
      groupedData[groupKey].expenses += Number(expense.amount);
    });

    // Sort keys chronologically
    const sortedKeys = Object.keys(groupedData).sort();
    
    // Format labels for display
    const labels = sortedKeys.map(key => formatLabel(key));

    // Extract data arrays
    const incomesData = sortedKeys.map(key => groupedData[key].incomes);
    const expensesData = sortedKeys.map(key => groupedData[key].expenses);

    setLineChartLabels(labels);
    setIncomesLineData(incomesData);
    setExpensesLineData(expensesData);
    setIsLoadingLineChart(false);
  }

  function buildRankingData(
    expenseCategories: Category[],
    incomeCategories: Category[],
    expenses: Expense[],
    incomes: Income[]
  ): Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense'; color: string }> {
    const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalInc = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const rows: Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense'; color: string }> = [];
    // Expense categories only (subcategories ignored)
    for (const cat of expenseCategories) {
      const items = expenses.filter((e) => e.category_id === cat.id);
      const amount = items.reduce((s, e) => s + Number(e.amount), 0);
      if (amount > 0) {
        rows.push({
          title: cat.name,
          transactionCount: items.length,
          amount,
          percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
          type: 'expense',
          color: cat.color_hex || '#C72629',
        });
      }
    }
    // Income categories only (subcategories ignored)
    for (const cat of incomeCategories) {
      const items = incomes.filter((i) => i.category_id === cat.id);
      const amount = items.reduce((s, i) => s + Number(i.amount), 0);
      if (amount > 0) {
        rows.push({
          title: cat.name,
          transactionCount: items.length,
          amount,
          percentage: totalInc > 0 ? (amount / totalInc) * 100 : 0,
          type: 'income',
          color: cat.color_hex || '#26C739',
        });
      }
    }
    return rows.sort((a, b) => b.amount - a.amount);
  }

  // Fetch data when filters are applied
  useEffect(() => {
    const fetchData = async () => {
      if (!filtersApplied) {
        // Reset all data when no filters are applied
        setAllExpenses([]);
        setAllIncomes([]);
        setExpensesCategories([]);
        setExpensesCategoriesColors([]);
        setExpensesAmountByCategory([]);
        setIncomesCategories([]);
        setIncomesCategoriesColors([]);
        setIncomesAmountByCategory([]);
        setData1([]);
        setData2([]);
        setData1Income([]);
        setData2Income([]);
        setRankingData([]);
        setIsLoadingExpensesChart(false);
        setIsLoadingIncomesChart(false);
        setIsLoadingRanking(false);
        setIsLoadingLineChart(false);
        setLineChartLabels([]);
        setIncomesLineData([]);
        setExpensesLineData([]);
        return;
      }

      setIsLoadingExpensesChart(true);
      setIsLoadingIncomesChart(true);
      setIsLoadingRanking(true);
      
      // Use filtered data passed from parent
      setAllExpenses(filteredExpenses);
      setAllIncomes(filteredIncomes);

      // Get unique category IDs from filtered expenses
      const expenseCategoryIds = [...new Set(filteredExpenses
        .filter(exp => exp.category_id)
        .map(exp => exp.category_id!))];
      
      // Get unique category IDs from filtered incomes
      const incomeCategoryIds = [...new Set(filteredIncomes
        .filter(inc => inc.category_id)
        .map(inc => inc.category_id!))];

      if (expenseCategoryIds.length > 0) {
        const expenseCategories = await categoriesApiService.getCategoriesByIds(expenseCategoryIds);
        const categoriesColors = await categoriesApiService.getCategoriesColorsByCategoryIds(expenseCategoryIds);
        const expenseSubcategories = await subcategoriesApiService.getSubcategoriesByCategoryIds(expenseCategoryIds);
        const categoriesNames = await categoriesApiService.getCategoriesNamesByIds(expenseCategoryIds);
        
        // Calculate amounts from filtered expenses
        const expensesAmountByCategory: number[] = expenseCategoryIds.map(catId => {
          return filteredExpenses
            .filter(exp => exp.category_id === catId)
            .reduce((sum, exp) => sum + Number(exp.amount), 0);
        });

        setExpensesCategories(categoriesNames);
        setExpensesCategoriesColors(categoriesColors);
        setExpensesAmountByCategory(expensesAmountByCategory);
        await createData1(expenseCategories);
        createData2(expenseSubcategories, expenseCategories);
      } else {
        setExpensesCategories([]);
        setExpensesCategoriesColors([]);
        setExpensesAmountByCategory([]);
        setData1([]);
        setData2([]);
      }
      
      setIsLoadingExpensesChart(false);

      if (incomeCategoryIds.length > 0) {
        const incomeCategories = await categoriesApiService.getCategoriesByIds(incomeCategoryIds);
        const incomeCategoriesColors = await categoriesApiService.getCategoriesColorsByCategoryIds(incomeCategoryIds);
        const incomeSubcategories = await subcategoriesApiService.getSubcategoriesByCategoryIds(incomeCategoryIds);
        const incomeCategoriesNames = await categoriesApiService.getCategoriesNamesByIds(incomeCategoryIds);
        
        // Calculate amounts from filtered incomes
        const incomesAmountByCategory: number[] = incomeCategoryIds.map(catId => {
          return filteredIncomes
            .filter(inc => inc.category_id === catId)
            .reduce((sum, inc) => sum + Number(inc.amount), 0);
        });

        setIncomesCategories(incomeCategoriesNames);
        setIncomesCategoriesColors(incomeCategoriesColors);
        setIncomesAmountByCategory(incomesAmountByCategory);
        await createData1Income(incomeCategories);
        createData2Income(incomeSubcategories, incomeCategories);
      } else {
        setIncomesCategories([]);
        setIncomesCategoriesColors([]);
        setIncomesAmountByCategory([]);
        setData1Income([]);
        setData2Income([]);
      }
      
      setIsLoadingIncomesChart(false);

      // Build ranking from filtered data (categories only, subcategories ignored)
      if (expenseCategoryIds.length > 0 || incomeCategoryIds.length > 0) {
        const expenseCategories = expenseCategoryIds.length > 0 
          ? await categoriesApiService.getCategoriesByIds(expenseCategoryIds)
          : [];
        const incomeCategories = incomeCategoryIds.length > 0
          ? await categoriesApiService.getCategoriesByIds(incomeCategoryIds)
          : [];

        setRankingData(
          buildRankingData(
            expenseCategories,
            incomeCategories,
            filteredExpenses,
            filteredIncomes
          )
        );
      } else {
        setRankingData([]);
      }
      setIsLoadingRanking(false);
    };

    fetchData();
  }, [filtersApplied, filteredExpenses, filteredIncomes]);

  // Update line chart data when timeframe or raw data changes
  useEffect(() => {
    if (!filtersApplied || (!allExpenses?.length && !allIncomes?.length)) {
      setLineChartLabels([]);
      setIncomesLineData([]);
      setExpensesLineData([]);
      setIsLoadingLineChart(false);
      return;
    }
    prepareLineChartData(allIncomes, allExpenses, lineChartTimeframe);
  }, [lineChartTimeframe, allExpenses, allIncomes, filtersApplied]);

  // Configuration for Pie Chart of Categories of Expenses
  const settingsCategoriesPie = useMemo(() => ({
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data1,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item: any) => {
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
  } satisfies PieChartProps), [data1, totalExpenses]);

  // Configuration for Pie Chart of Subcategories of Expenses
  const settingsSubcategoriesPie = useMemo(() => ({
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data2,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item: any) => {
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
  } satisfies PieChartProps), [data2]);

  // Configuration for Pie Chart of Categories of Incomes
  const settingsCategoriesPieIncome = useMemo(() => ({
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data1Income,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item: any) => {
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
  } satisfies PieChartProps), [data1Income, totalIncomes]);

  // Configuration for Pie Chart of Subcategories of Incomes
  const settingsSubcategoriesPieIncome = useMemo(() => ({
    series: [
      {
        innerRadius: 0,
        outerRadius: 150,
        data: data2Income,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: (item: any) => {
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
  } satisfies PieChartProps), [data2Income]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Row: Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance */}
        <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
          <span className="text-xl text-blue-500">Total Balance</span>
          {!filtersApplied ? (
            <div className="flex-1 flex items-center justify-center">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-semibold text-blue-700">
                  R${' '}
                  {(totalIncomes - totalExpenses).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
                <span
                  className={`${
                    totalIncomes - totalExpenses >= 0
                      ? 'bg-green-200/20 text-green-500'
                      : 'bg-red-200/20 text-red-500'
                  } h-fit px-2 rounded-full flex items-center gap-1 text-[11px] font-semibold`}
                >
                  {totalIncomes - totalExpenses >= 0 ? (
                    <CaretUpOutlined className="text-[10px]" />
                  ) : (
                    <CaretDownOutlined className="text-[10px]" />
                  )}
                  <p>{totalIncomes - totalExpenses >= 0 ? 'Positive' : 'Negative'}</p>
                </span>
              </div>
              <span
                className={`${
                  totalIncomes - totalExpenses >= 0 ? 'text-green-500' : 'text-red-500'
                } text-4xl`}
              >
                {totalIncomes - totalExpenses >= 0 ? <RiseOutlined /> : <FallOutlined />}
              </span>
            </div>
          )}
        </div>

        {/* Total Incomes */}
        <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
          <span className="text-xl text-blue-500">Total Incomes</span>
          {!filtersApplied ? (
            <div className="flex-1 flex items-center justify-center">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-semibold text-blue-700">
                  R${' '}
                  {totalIncomes.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>
              <span className="text-green-500 text-4xl">
                <RiseOutlined />
              </span>
            </div>
          )}
        </div>

        {/* Total Expenses */}
        <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
          <span className="text-xl text-blue-500">Total Expenses</span>
          {!filtersApplied ? (
            <div className="flex-1 flex items-center justify-center">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-semibold text-blue-700">
                  R${' '}
                  {totalExpenses.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>
              <span className="text-red-500 text-4xl">
                <FallOutlined />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Line Chart (4 cols) & Category Ranking (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Cash Flow History Line Chart */}
        <div className="lg:col-span-4 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-blue-500">Cash Flow History</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-white-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-white-600">Expenses</span>
              </div>
              <Select
                defaultValue="day"
                size="small"
                style={{ width: 100 }}
                onChange={(e) => setLineChartTimeframe(e)}
                options={[
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ]}
              />
            </div>
          </div>
          <Divider className="my-1 border-white-500" />
          <Spin
            spinning={isLoadingLineChart}
            indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
          >
            {!isLoadingLineChart &&
            (!filtersApplied ||
              (lineChartLabels.length === 0 &&
                incomesLineData.length === 0 &&
                expensesLineData.length === 0)) ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                {!filtersApplied ? (
                  <p className="text-sm text-black-300">Apply filters to view data</p>
                ) : (
                  <Empty
                    description="No data available for the selected period"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ) : (
              <div className="h-[300px] w-full pt-2">
                <LineChart
                  xAxis={[{ data: lineChartLabels, scaleType: 'point' }]}
                  series={[
                    {
                      id: 'incomes',
                      curve: 'natural',
                      data: incomesLineData,
                      label: 'Incomes',
                      color: 'var(--color-green-500)',
                      area: true,
                    },
                    {
                      id: 'expenses',
                      curve: 'natural',
                      data: expensesLineData,
                      label: 'Expenses',
                      color: 'var(--color-red-500)',
                      area: true,
                    },
                  ]}
                  height={290}
                  margin={{ left: 30, right: 20, top: 20, bottom: 25 }}
                  sx={{
                    '& .MuiAreaElement-series-incomes': {
                      fill: 'url(#incomesGradient)',
                    },
                    '& .MuiAreaElement-series-expenses': {
                      fill: 'url(#expensesGradient)',
                    },
                  }}
                >
                  <defs>
                    <linearGradient id="incomesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-green-500)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-green-500)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-red-500)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-red-500)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </div>
            )}
          </Spin>
        </div>

        {/* Category Ranking */}
        <div className="lg:col-span-3 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-blue-500">Category Ranking</h3>
            <span className="text-xs text-white-700">Top Categories</span>
          </div>
          <Divider className="my-1 border-white-500" />
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            <Spin
              spinning={isLoadingRanking}
              indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
            >
              {!isLoadingRanking && (
                <>
                  {!filtersApplied ? (
                    <div className="flex-1 flex items-center justify-center min-h-[280px]">
                      <p className="text-sm text-black-300">Apply filters to view data</p>
                    </div>
                  ) : rankingData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[280px]">
                      <Empty
                        description="No data available for the selected period"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto px-1 py-1">
                      {rankingData.map((row, idx) => {
                        const percent = Math.round(row.percentage);
                        return (
                          <div
                            key={`${row.title}-${row.type}-${idx}`}
                            className="p-3 rounded-[16px] border border-white-500/60 bg-white-200 hover:border-white-500 hover:shadow-xs transition-all flex flex-col gap-1.5"
                          >
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium text-black-500">{row.title}</span>
                                <span className="text-xs text-white-700">
                                  {row.transactionCount} transaction{row.transactionCount === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span
                                  className={`font-semibold ${
                                    row.type === 'income' ? 'text-green-500' : 'text-red-500'
                                  }`}
                                >
                                  R${' '}
                                  {row.amount.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-xs text-white-700">
                                  {row.percentage.toFixed(1)}% of total {row.type}
                                </span>
                              </div>
                            </div>
                            <Progress
                              percent={percent}
                              strokeColor={
                                row.color ||
                                (row.type === 'income' ? 'var(--color-green-500)' : 'var(--color-red-500)')
                              }
                              showInfo={false}
                              size="small"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Spin>
          </div>
        </div>
      </div>

      {/* Bottom Row: Expenses Breakdown & Incomes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown */}
        <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-blue-500">Expenses Breakdown</h3>
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
                    { title: 'Bar', value: 'categories-bar' },
                    { title: 'Pie', value: 'categories-pie' },
                  ],
                },
                {
                  label: 'Subcategories',
                  title: 'Subcategories',
                  value: 'subcategories',
                  selectable: false,
                  children: [
                    { title: 'Bar', value: 'subcategories-bar' },
                    { title: 'Pie', value: 'subcategories-pie' },
                  ],
                },
              ]}
            />
          </div>
          <Divider className="my-1 border-white-500" />
          <div className="chart-container pt-2">
            <Spin
              spinning={isLoadingExpensesChart}
              indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
              size="large"
            >
              {!isLoadingExpensesChart &&
              (!filtersApplied ||
                (expensesCategories.length === 0 && data1.length === 0 && data2.length === 0)) ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  {!filtersApplied ? (
                    <p className="text-sm text-black-300">Apply filters to view data</p>
                  ) : (
                    <Empty
                      description="No data available for the selected period"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
              ) : chartType === 'categories-pie' ? (
                <PieChart
                  {...settingsCategoriesPie}
                  sx={{
                    '& .MuiPieArcLabel-root': {
                      textAnchor: 'middle',
                      dominantBaseline: 'middle',
                      fontSize: 12,
                    },
                  }}
                />
              ) : chartType === 'categories-bar' ? (
                <BarChart
                  xAxis={[
                    {
                      data: expensesCategories,
                      colorMap: {
                        type: 'ordinal',
                        values: expensesCategories,
                        colors: expensesCategoriesColors,
                      },
                    },
                  ]}
                  series={[{ data: expensesAmountByCategory }]}
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
                    },
                  }}
                />
              ) : chartType === 'subcategories-bar' ? (
                <BarChart
                  xAxis={[
                    {
                      data: data2.map((item) => item.label),
                      colorMap: {
                        type: 'ordinal',
                        values: data2.map((item) => item.label),
                        colors: data2.map((item) => item.color),
                      },
                    },
                  ]}
                  series={[{ data: data2.map((item) => item.value) }]}
                  height={300}
                />
              ) : (
                <BarChart
                  xAxis={[
                    {
                      data: expensesCategories,
                      colorMap: {
                        type: 'ordinal',
                        values: expensesCategories,
                        colors: expensesCategoriesColors,
                      },
                    },
                  ]}
                  series={[{ data: expensesAmountByCategory }]}
                  height={300}
                />
              )}
            </Spin>
          </div>
        </div>

        {/* Incomes Breakdown */}
        <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-blue-500">Incomes Breakdown</h3>
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
                    { title: 'Bar', value: 'categories-bar' },
                    { title: 'Pie', value: 'categories-pie' },
                  ],
                },
                {
                  label: 'Subcategories',
                  title: 'Subcategories',
                  value: 'subcategories',
                  selectable: false,
                  children: [
                    { title: 'Bar', value: 'subcategories-bar' },
                    { title: 'Pie', value: 'subcategories-pie' },
                  ],
                },
              ]}
            />
          </div>
          <Divider className="my-1 border-white-500" />
          <div className="chart-container pt-2">
            <Spin
              spinning={isLoadingIncomesChart}
              indicator={<LoadingOutlined style={{ fontSize: 32, color: 'var(--color-blue-500)' }} spin />}
              size="large"
            >
              {!isLoadingIncomesChart &&
              (!filtersApplied ||
                (incomesCategories.length === 0 && data1Income.length === 0 && data2Income.length === 0)) ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  {!filtersApplied ? (
                    <p className="text-sm text-black-300">Apply filters to view data</p>
                  ) : (
                    <Empty
                      description="No data available for the selected period"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
              ) : chartTypeIncome === 'categories-pie' ? (
                <PieChart
                  {...settingsCategoriesPieIncome}
                  sx={{
                    '& .MuiPieArcLabel-root': {
                      textAnchor: 'middle',
                      dominantBaseline: 'middle',
                      fontSize: 12,
                    },
                  }}
                />
              ) : chartTypeIncome === 'categories-bar' ? (
                <BarChart
                  xAxis={[
                    {
                      data: incomesCategories,
                      colorMap: {
                        type: 'ordinal',
                        values: incomesCategories,
                        colors: incomesCategoriesColors,
                      },
                    },
                  ]}
                  series={[{ data: incomesAmountByCategory }]}
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
                    },
                  }}
                />
              ) : chartTypeIncome === 'subcategories-bar' ? (
                <BarChart
                  xAxis={[
                    {
                      data: data2Income.map((item) => item.label),
                      colorMap: {
                        type: 'ordinal',
                        values: data2Income.map((item) => item.label),
                        colors: data2Income.map((item) => item.color),
                      },
                    },
                  ]}
                  series={[{ data: data2Income.map((item) => item.value) }]}
                  height={300}
                />
              ) : (
                <BarChart
                  xAxis={[
                    {
                      data: incomesCategories,
                      colorMap: {
                        type: 'ordinal',
                        values: incomesCategories,
                        colors: incomesCategoriesColors,
                      },
                    },
                  ]}
                  series={[{ data: incomesAmountByCategory }]}
                  height={300}
                />
              )}
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
}
