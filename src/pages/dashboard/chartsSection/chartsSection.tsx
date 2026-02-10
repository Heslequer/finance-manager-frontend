import './chartsSection.scss';
import { TreeSelect, Spin, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import {
  PieChart,
  type PieChartProps,
} from '@mui/x-charts/PieChart';
import { useEffect, useState, useMemo } from 'react';
import { IncomesService } from '../../../services/supabase/incomes/incomes.service';
import { ExpensesService } from '../../../services/supabase/expenses/expenses.service';
import { CategoriesService } from '../../../services/supabase/categories/categories.service';
import { SubcategoriesService } from '../../../services/supabase/subcategories/subcategories.service';
import type { Category } from '../../../services/supabase/categories/categories.interface';
import type { Subcategory } from '../../../services/supabase/subcategories/subcategories.interface';
import type { Expense } from '../../../services/supabase/expenses/expenses.interface';
import type { Income } from '../../../services/supabase/incomes/incomes.interface';

const incomesService = new IncomesService();
const expensesService = new ExpensesService();
const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();

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
  const [isLineChartExpanded, setIsLineChartExpanded] = useState<boolean>(false);

  // States for Category Ranking
  const [rankingData, setRankingData] = useState<Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense' }>>([]);
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

  const createData2 = async(expenseSubcategories: Subcategory[]) => {
    const data2: {label: string, value: number, color: string}[] = [];
    for(const subcategory of expenseSubcategories){
      // Calculate amount from filtered expenses
      const amount = filteredExpenses
        .filter(exp => exp.subcategory_id === subcategory.id)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      const subcategoryColor = await categoriesService.getCategoryColorById(subcategory.category_id);
      data2.push({label: subcategory.name, value: amount, color: subcategoryColor});
    }
    const updatedData2 = await Promise.all(data2.map(async (item) =>{
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
    }));
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

  const createData2Income = async(incomeSubcategories: Subcategory[]) => {
    const data2Income: {label: string, value: number, color: string}[] = [];
    for(const subcategory of incomeSubcategories){
      // Calculate amount from filtered incomes
      const amount = filteredIncomes
        .filter(inc => inc.subcategory_id === subcategory.id)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      const subcategoryColor = await categoriesService.getCategoryColorById(subcategory.category_id);
      data2Income.push({label: subcategory.name, value: amount, color: subcategoryColor});
    }
    const updatedData2Income = await Promise.all(data2Income.map(async (item) =>{
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
    }));
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
    expenseSubcategories: Subcategory[],
    incomeCategories: Category[],
    incomeSubcategories: Subcategory[],
    expenses: Expense[],
    incomes: Income[]
  ): Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense' }> {
    const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalInc = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const rows: Array<{ title: string; transactionCount: number; amount: number; percentage: number; type: 'income' | 'expense' }> = [];
    // Expense categories
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
        });
      }
    }
    // Expense subcategories
    for (const sub of expenseSubcategories) {
      const items = expenses.filter((e) => e.subcategory_id === sub.id);
      const amount = items.reduce((s, e) => s + Number(e.amount), 0);
      if (amount > 0) {
        rows.push({
          title: sub.name,
          transactionCount: items.length,
          amount,
          percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
          type: 'expense',
        });
      }
    }
    // Income categories
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
        });
      }
    }
    // Income subcategories
    for (const sub of incomeSubcategories) {
      const items = incomes.filter((i) => i.subcategory_id === sub.id);
      const amount = items.reduce((s, i) => s + Number(i.amount), 0);
      if (amount > 0) {
        rows.push({
          title: sub.name,
          transactionCount: items.length,
          amount,
          percentage: totalInc > 0 ? (amount / totalInc) * 100 : 0,
          type: 'income',
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
        const expenseCategories = await categoriesService.getCategoriesByIds(expenseCategoryIds);
        const categoriesColors = await categoriesService.getCategoriesColorsByCategoryIds(expenseCategoryIds);
        const expenseSubcategories = await subcategoriesService.getSubcategoriesByCategoryIds(expenseCategoryIds);
        const categoriesNames = await categoriesService.getCategoriesNamesByIds(expenseCategoryIds);
        
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
        await createData2(expenseSubcategories);
      } else {
        setExpensesCategories([]);
        setExpensesCategoriesColors([]);
        setExpensesAmountByCategory([]);
        setData1([]);
        setData2([]);
      }
      
      setIsLoadingExpensesChart(false);

      if (incomeCategoryIds.length > 0) {
        const incomeCategories = await categoriesService.getCategoriesByIds(incomeCategoryIds);
        const incomeCategoriesColors = await categoriesService.getCategoriesColorsByCategoryIds(incomeCategoryIds);
        const incomeSubcategories = await subcategoriesService.getSubcategoriesByCategoryIds(incomeCategoryIds);
        const incomeCategoriesNames = await categoriesService.getCategoriesNamesByIds(incomeCategoryIds);
        
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
        await createData2Income(incomeSubcategories);
      } else {
        setIncomesCategories([]);
        setIncomesCategoriesColors([]);
        setIncomesAmountByCategory([]);
        setData1Income([]);
        setData2Income([]);
      }
      
      setIsLoadingIncomesChart(false);

      // Build ranking from filtered data
      if (expenseCategoryIds.length > 0 || incomeCategoryIds.length > 0) {
        const expenseCategories = expenseCategoryIds.length > 0 
          ? await categoriesService.getCategoriesByIds(expenseCategoryIds)
          : [];
        const expenseSubcategories = expenseCategoryIds.length > 0
          ? await subcategoriesService.getSubcategoriesByCategoryIds(expenseCategoryIds)
          : [];
        const incomeCategories = incomeCategoryIds.length > 0
          ? await categoriesService.getCategoriesByIds(incomeCategoryIds)
          : [];
        const incomeSubcategories = incomeCategoryIds.length > 0
          ? await subcategoriesService.getSubcategoriesByCategoryIds(incomeCategoryIds)
          : [];

        setRankingData(
          buildRankingData(
            expenseCategories,
            expenseSubcategories,
            incomeCategories,
            incomeSubcategories,
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
    prepareLineChartData(allExpenses, allIncomes, lineChartTimeframe);
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

    return (<>
      <div className='line flex my-2'>
        <div className="p-3 card">
          <div className="header-card flex">
            <h4 className="font-weight-500">Total Balance</h4>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.4" stroke="currentColor" className="icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className={`mt-5 ${filtersApplied && totalIncomes - totalExpenses >= 0 ? 'green' : filtersApplied ? 'red' : 'green'}`}>
            R$ {filtersApplied ? (totalIncomes - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
          </h4>
        </div>

        <div className="p-3 card">
          <div className="header-card flex">
            <h4 className="font-weight-500">Incomes</h4>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" className="icon green">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <h4 className="mt-5 green">
            R$ {filtersApplied ? totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
          </h4>
        </div>

        <div className="p-3 card">
          <div className="header-card flex">
            <h4 className="font-weight-500">Expenses</h4>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" className="icon red">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
            </svg>
          </div>
          <h4 className="mt-5 red">
            R$ {filtersApplied ? totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
          </h4>
        </div>
      </div>

      <div className='line flex my-2'>
          <div className={`${isLineChartExpanded ? 'grid-accurate-18' : 'grid-accurate-9'} card flex-column chart-info-container`}>
              <div className='chart-container pt-2'>
                  <div className="flex card-header">
                      <h5 className='font-weight-500'>Line Chart</h5>
                      <Select
                          defaultValue="day"
                          style={{ width: 120 }}
                          onChange={(e) => setLineChartTimeframe(e)}
                          options={[
                              { value: 'day', label: 'Day' },
                              { value: 'week', label: 'Week' },
                              { value: 'month', label: 'Month' },
                          ]}
                      />
                  </div>

                <Spin spinning={isLoadingLineChart}
                    indicator={<LoadingOutlined spin/>}
                    size="large"
                >
                  {!isLoadingLineChart && (!filtersApplied || (lineChartLabels.length === 0 && incomesLineData.length === 0 && expensesLineData.length === 0)) ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      {!filtersApplied ? 'Apply filters to view data' : 'No data available for the selected period'}
                    </div>
                  ) : (
                    <LineChart
                      xAxis={[{ data: lineChartLabels, scaleType: 'point' }]}
                      series={[
                        { 
                          curve: "natural", 
                          data: incomesLineData,
                          label: 'Incomes',
                          color: '#4caf50'
                        },
                        { 
                          curve: "natural", 
                          data: expensesLineData,
                          label: 'Expenses',
                          color: '#f44336'
                        },
                      ]}
                      height={300}
                    />
                  )}
                </Spin>
              </div>
          </div>

          <div className="card flex-column chart-info-container category-ranking">
              <h5 className="font-weight-500 mb-2">Ranking of expenses and incomes</h5>
              <div className="ranking-wrapper" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Spin spinning={isLoadingRanking} indicator={<LoadingOutlined spin />} size="large">
                  {!isLoadingRanking && (
                    <div className="ranking-list">
                      {!filtersApplied ? (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          Apply filters to view data
                        </div>
                      ) : rankingData.length === 0 ? (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          No data available for the selected period
                        </div>
                      ) : (
                        rankingData.map((row, idx) => (
                          <div key={`${row.title}-${row.type}-${idx}`} className="ranking-row">
                            <div className="ranking-row-left">
                              <span className="ranking-title">{row.title}</span>
                              <span className="ranking-count">{row.transactionCount} transaction{row.transactionCount === 1 ? '' : 's'}</span>
                            </div>
                            <div className="ranking-row-right">
                              <span className={row.type === 'income' ? 'green' : 'red'}>
                                R$ {row.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="ranking-pct">
                                {row.percentage.toFixed(1)}% of the total {row.type}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Spin>
              </div>
          </div>

      </div>

      <div className='line flex my-2'>
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
                      {!isLoadingExpensesChart && (!filtersApplied || (expensesCategories.length === 0 && data1.length === 0 && data2.length === 0)) ? (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          {!filtersApplied ? 'Apply filters to view data' : 'No data available for the selected period'}
                        </div>
                      ) : chartType === 'categories-pie' ? (
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
                  {!isLoadingIncomesChart && (!filtersApplied || (incomesCategories.length === 0 && data1Income.length === 0 && data2Income.length === 0)) ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      {!filtersApplied ? 'Apply filters to view data' : 'No data available for the selected period'}
                    </div>
                  ) : chartTypeIncome === 'categories-pie' ? (
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

    </>);
}
