import { useEffect, useState, useMemo } from 'react';
import { Layout, Progress, Spin, Divider, Empty } from 'antd';
import {
  CreditCardOutlined,
  LoadingOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../../components/sidebar/sidebar';
import TransactionsTable from '../../components/transactionsTable/transactionsTable';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import { creditCardsApiService } from '../../services/api/credit-cards/credit-cards.api';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import type { Expense } from '../../types/expense.interface';
import type { Income } from '../../types/income.interface';
import type { CreditCard } from '../../types/credit-card.interface';
import type { Category } from '../../types/category.interface';

const { Content } = Layout;

interface DashboardProps {
  onOpenNotification?: (type: string, message: string, description?: string) => void;
}

function getBillingCycleDates(closingDay?: number): { start: Date; end: Date } {
  const now = new Date();
  const cYear = now.getFullYear();
  const cMonth = now.getMonth();
  const today = now.getDate();

  const cDay = closingDay && closingDay >= 1 && closingDay <= 31 ? closingDay : 31;

  if (today <= cDay) {
    const prevMonthDays = new Date(cYear, cMonth, 0).getDate();
    const actualPrevClosingDay = Math.min(cDay, prevMonthDays);
    const start = new Date(cYear, cMonth - 1, actualPrevClosingDay + 1, 0, 0, 0, 0);

    const thisMonthDays = new Date(cYear, cMonth + 1, 0).getDate();
    const actualThisClosingDay = Math.min(cDay, thisMonthDays);
    const end = new Date(cYear, cMonth, actualThisClosingDay, 23, 59, 59, 999);

    return { start, end };
  } else {
    const thisMonthDays = new Date(cYear, cMonth + 1, 0).getDate();
    const actualThisClosingDay = Math.min(cDay, thisMonthDays);
    const start = new Date(cYear, cMonth, actualThisClosingDay + 1, 0, 0, 0, 0);

    const nextMonthDays = new Date(cYear, cMonth + 2, 0).getDate();
    const actualNextClosingDay = Math.min(cDay, nextMonthDays);
    const end = new Date(cYear, cMonth + 1, actualNextClosingDay, 23, 59, 59, 999);

    return { start, end };
  }
}

export default function DashboardPage({ onOpenNotification }: DashboardProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  const handleCategoryClick = (index: number) => {
    setSelectedCategoryIndex((prev) => (prev === index ? null : index));
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const userId = '50baa1d0-57aa-4eff-932f-228e773784eb';
      const [expData, incData, cardData, catData] = await Promise.all([
        expensesApiService.getAllExpensesByUserId(userId).catch(() => []),
        incomesApiService.getAllIncomesByUserId(userId).catch(() => []),
        creditCardsApiService.getAllCreditCards().catch(() => []),
        categoriesApiService.getCategories().catch(() => []),
      ]);

      setExpenses(expData || []);
      setIncomes(incData || []);
      setCreditCards(cardData || []);
      setCategories(catData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const [isUpdatingSpending, setIsUpdatingSpending] = useState<boolean>(false);

  const refreshSpendingCard = async () => {
    try {
      setIsUpdatingSpending(true);
      const userId = '50baa1d0-57aa-4eff-932f-228e773784eb';
      const [expData, catData] = await Promise.all([
        expensesApiService.getAllExpensesByUserId(userId).catch(() => []),
        categoriesApiService.getCategories().catch(() => []),
      ]);
      setExpenses(expData || []);
      setCategories(catData || []);
    } catch (error) {
      console.error('Error refreshing spending by category:', error);
    } finally {
      setIsUpdatingSpending(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Current and Last Month Date Constants
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth();

  const currentMonthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const currentMonthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInCurrentMonth).padStart(2, '0')}`;

  const isDateInCurrentMonth = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const part = String(dateStr).slice(0, 10);
    const [y, m] = part.split('-').map(Number);
    return y === currentYear && m === (currentMonth + 1);
  };

  const isDateInLastMonth = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const part = String(dateStr).slice(0, 10);
    const [y, m] = part.split('-').map(Number);
    return y === lastMonthYear && m === (lastMonth + 1);
  };

  // Filtered Current & Last Month Data
  const currentIncomes = useMemo(() => {
    return incomes.filter((item) => isDateInCurrentMonth(item.date));
  }, [incomes, currentYear, currentMonth]);

  const lastMonthIncomes = useMemo(() => {
    return incomes.filter((item) => isDateInLastMonth(item.date));
  }, [incomes, lastMonthYear, lastMonth]);

  const currentExpenses = useMemo(() => {
    return expenses.filter((item) => isDateInCurrentMonth(item.date));
  }, [expenses, currentYear, currentMonth]);

  const lastMonthExpenses = useMemo(() => {
    return expenses.filter((item) => isDateInLastMonth(item.date));
  }, [expenses, lastMonthYear, lastMonth]);

  // Calculate Summary Totals
  const totalIncomes = useMemo(() => {
    return currentIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [currentIncomes]);

  const lastTotalIncomes = useMemo(() => {
    return lastMonthIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [lastMonthIncomes]);

  const incomesDiff = useMemo(() => {
    if (lastTotalIncomes <= 0) return null;
    return ((totalIncomes - lastTotalIncomes) / lastTotalIncomes) * 100;
  }, [totalIncomes, lastTotalIncomes]);

  const totalExpenses = useMemo(() => {
    return currentExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [currentExpenses]);

  const lastTotalExpenses = useMemo(() => {
    return lastMonthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [lastMonthExpenses]);

  const expensesDiff = useMemo(() => {
    if (lastTotalExpenses <= 0) return null;
    return ((totalExpenses - lastTotalExpenses) / lastTotalExpenses) * 100;
  }, [totalExpenses, lastTotalExpenses]);

  const monthlyResult = useMemo(() => {
    return totalIncomes - totalExpenses;
  }, [totalIncomes, totalExpenses]);

  const lastMonthResult = useMemo(() => {
    return lastTotalIncomes - lastTotalExpenses;
  }, [lastTotalIncomes, lastTotalExpenses]);

  const resultDiff = useMemo(() => {
    if (lastTotalIncomes === 0 && lastTotalExpenses === 0) return null;
    if (lastMonthResult === 0) return null;
    return ((monthlyResult - lastMonthResult) / Math.abs(lastMonthResult)) * 100;
  }, [monthlyResult, lastMonthResult, lastTotalIncomes, lastTotalExpenses]);

  // Cash Flow Daily Data for MUI LineChart (Current Month Only - Non-empty days only)
  const cashFlowChartData = useMemo(() => {
    const incomeByDay: Record<number, number> = {};
    const expenseByDay: Record<number, number> = {};

    currentIncomes.forEach((inc) => {
      if (inc.date) {
        const d = Number(String(inc.date).slice(8, 10));
        if (d >= 1 && d <= daysInCurrentMonth) {
          incomeByDay[d] = (incomeByDay[d] || 0) + Number(inc.amount || 0);
        }
      }
    });

    currentExpenses.forEach((exp) => {
      if (exp.date) {
        const d = Number(String(exp.date).slice(8, 10));
        if (d >= 1 && d <= daysInCurrentMonth) {
          expenseByDay[d] = (expenseByDay[d] || 0) + Number(exp.amount || 0);
        }
      }
    });

    // Only include days with actual income or expense transactions
    const activeDays = Array.from(
      new Set([
        ...Object.keys(incomeByDay).map(Number),
        ...Object.keys(expenseByDay).map(Number),
      ])
    )
      .filter((d) => (incomeByDay[d] || 0) > 0 || (expenseByDay[d] || 0) > 0)
      .sort((a, b) => a - b);

    const days = activeDays.map((d) => String(d));
    const incomeValues = activeDays.map((d) => incomeByDay[d] || 0);
    const expenseValues = activeDays.map((d) => expenseByDay[d] || 0);

    return {
      days,
      incomeValues,
      expenseValues,
    };
  }, [currentIncomes, currentExpenses, daysInCurrentMonth]);

  // Spending by Category Breakdown for Donut Chart & Legend (Current Month vs Last Month)
  const categoryBreakdown = useMemo(() => {
    const lastMonthCatMap: Record<string, number> = {};
    lastMonthExpenses.forEach((exp) => {
      const catId = exp.category_id || 'unknown';
      const catObj = categories.find((c) => c.id === catId);
      const name = catObj?.name || 'General Expense';
      lastMonthCatMap[name] = (lastMonthCatMap[name] || 0) + Number(exp.amount || 0);
    });

    const catMap: Record<string, { name: string; amount: number; count: number; color: string; diff: number | null }> = {};

    currentExpenses.forEach((exp) => {
      const catId = exp.category_id || 'unknown';
      const catObj = categories.find((c) => c.id === catId);
      const name = catObj?.name || 'General Expense';
      const color = catObj?.color_hex || '#15D05D';

      if (!catMap[name]) {
        catMap[name] = { name, amount: 0, count: 0, color, diff: null };
      }
      catMap[name].amount += Number(exp.amount || 0);
      catMap[name].count += 1;
    });

    Object.keys(catMap).forEach((name) => {
      const lastAmount = lastMonthCatMap[name];
      if (lastAmount && lastAmount > 0) {
        catMap[name].diff = ((catMap[name].amount - lastAmount) / lastAmount) * 100;
      } else {
        catMap[name].diff = null;
      }
    });

    const items = Object.values(catMap);

    return items;
  }, [currentExpenses, lastMonthExpenses, categories]);

  const pieChartData = useMemo(() => {
    return categoryBreakdown.map((item, idx) => ({
      id: idx,
      value: item.amount > 0 ? item.amount : 10,
      label: item.name,
      color: item.color,
    }));
  }, [categoryBreakdown]);

  // Dynamic Center Stats when selecting or hovering over categories
  const activeCategoryStats = useMemo(() => {
    const totalSpending = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const activeIndex = selectedCategoryIndex !== null ? selectedCategoryIndex : hoveredCategoryIndex;

    if (activeIndex !== null && categoryBreakdown[activeIndex]) {
      const item = categoryBreakdown[activeIndex];
      const pct = totalSpending > 0 ? ((item.amount / totalSpending) * 100).toFixed(1).replace('.', ',') : '0';
      return {
        percentage: `${pct}%`,
        diff: item.diff,
        amount: item.amount,
      };
    }

    return {
      percentage: '100%',
      diff: expensesDiff,
      amount: totalSpending,
    };
  }, [selectedCategoryIndex, hoveredCategoryIndex, categoryBreakdown, expensesDiff]);

  // Credit Card Usage List (Current Billing Cycle Only)
  const creditCardList = useMemo(() => {
    if (creditCards.length > 0) {
      const colors = ['#1515E1', '#A610DC', '#CF1010', '#099D28'];
      return creditCards
        .map((card, idx) => {
          const limit = Number(card.credit_limit || 0);
          const { start, end } = getBillingCycleDates(card.closing_day);

          const cycleExpenses = expenses.filter((exp) => {
            if (exp.credit_card_id !== card.id) return false;
            if (!exp.date) return false;
            const [y, m, d] = String(exp.date).slice(0, 10).split('-').map(Number);
            const expDate = new Date(y, m - 1, d, 12, 0, 0);
            return expDate >= start && expDate <= end;
          });

          const balance = cycleExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
          const percent = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;

          return {
            id: card.id || String(idx),
            name: card.card_name || 'Credit Card',
            digits: card.card_digits
              ? `**** **** **** ${card.card_digits.slice(-4)}`
              : `**** **** **** ${5789 + idx * 111}`,
            balance,
            limit,
            percent,
            color: colors[idx % colors.length],
          };
        })
        .filter((card) => card.balance > 0);
    }

    return [];
  }, [creditCards, expenses]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        onOpenDashboardPage={() => navigate('/dashboard')}
        onOpenCategoriesPage={() => navigate('/categories')}
      />
      <Layout className="!bg-white-300 flex flex-col flex-1">
        <Content className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: 'var(--color-blue-500)' }} spin />} />
            </div>
          ) : (
            <>
              {/* Header Title Section */}
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-blue-500 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-black-200 text-sm">
                  Welcome back! Here is your current financial overview.
                </p>
              </div>

              {/* Top Row: Metric Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Income */}
                <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
                  <span className="text-xl text-blue-500">
                    Total Incomes
                  </span>
                  {currentIncomes.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className='flex justify-between'>
                      <div className='flex items-center gap-3'>
                        <h2 className="text-3xl font-semibold text-blue-700">
                          R$
                          {totalIncomes.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </h2>
                        {incomesDiff !== null && (
                          <span className={`${incomesDiff >= 0 ? 'bg-green-200/20 text-green-500' : 'bg-red-200/20 text-red-500'} h-fit px-2 rounded-full flex items-center gap-1`}>
                            {incomesDiff >= 0 ? <CaretUpOutlined className="text-[10px]" /> : <CaretDownOutlined className="text-[10px]" />}
                            <p>{incomesDiff >= 0 ? `+${incomesDiff.toFixed(1)}%` : `${incomesDiff.toFixed(1)}%`}</p>
                          </span>
                        )}
                      </div>
                      <span className={`${incomesDiff !== null && incomesDiff < 0 ? 'text-red-500' : 'text-green-500'} text-4xl`}>
                        {incomesDiff !== null && incomesDiff < 0 ? <FallOutlined /> : <RiseOutlined />}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Expenses */}
                <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
                  <span className="text-xl text-blue-500">
                    Total Expenses
                  </span>
                  {currentExpenses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className='flex justify-between'>
                      <div className='flex items-center gap-3'>
                        <h2 className="text-3xl font-semibold text-blue-700">
                          R$
                          {totalExpenses.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </h2>
                        {expensesDiff !== null && (
                          <span className={`${expensesDiff > 0 ? 'bg-red-200/20 text-red-500' : 'bg-green-200/20 text-green-500'} h-fit px-2 rounded-full flex items-center gap-1`}>
                            {expensesDiff > 0 ? <CaretUpOutlined className="text-[10px]" /> : <CaretDownOutlined className="text-[10px]" />}
                            <p>{expensesDiff > 0 ? `+${expensesDiff.toFixed(1)}%` : `${expensesDiff.toFixed(1)}%`}</p>
                          </span>
                        )}
                      </div>
                      <span className={`${expensesDiff !== null && expensesDiff > 0 ? 'text-red-500' : 'text-green-500'} text-4xl`}>
                        {expensesDiff !== null && expensesDiff > 0 ? <FallOutlined /> : <RiseOutlined />}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Balance / Result */}
                <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-6 min-h-[160px]">
                  <span className="text-xl text-blue-500">
                    Result
                  </span>
                  {currentIncomes.length === 0 && currentExpenses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className='flex justify-between'>
                      <div className='flex items-center gap-3'>
                        <h2 className="text-3xl font-semibold text-blue-700">
                          R$
                          {monthlyResult.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </h2>
                        {resultDiff !== null && (
                          <span className={`${resultDiff >= 0 ? 'bg-green-200/20 text-green-500' : 'bg-red-200/20 text-red-500'} h-fit px-2 rounded-full flex items-center gap-1`}>
                            {resultDiff >= 0 ? <CaretUpOutlined className="text-[10px]" /> : <CaretDownOutlined className="text-[10px]" />}
                            <p>{resultDiff >= 0 ? `+${resultDiff.toFixed(1)}%` : `${resultDiff.toFixed(1)}%`}</p>
                          </span>
                        )}
                      </div>
                      <span className={`${monthlyResult >= 0 ? 'text-green-500' : 'text-red-500'} text-4xl`}>
                        {monthlyResult >= 0 ? <RiseOutlined /> : <FallOutlined />}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Cash Flow Line Chart & Spending Donut Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Cash Flow Line Chart */}
                <div className="lg:col-span-4 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl text-blue-500">Cash Flow</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-white-600">Income</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-white-600">Expenses</span>
                      </div>
                    </div>
                  </div>
                  <Divider className="my-1 border-white-500" />
                  {cashFlowChartData.days.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[260px]">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className="h-[280px] w-full pt-2">
                      <LineChart
                        xAxis={[{ scaleType: 'point', data: cashFlowChartData.days }]}
                        series={[
                          {
                            data: cashFlowChartData.incomeValues,
                            color: '#26C739',
                            showMark: cashFlowChartData.days.length <= 1,
                            curve: 'natural',
                          },
                          {
                            data: cashFlowChartData.expenseValues,
                            color: '#C72629',
                            showMark: cashFlowChartData.days.length <= 1,
                            curve: 'natural',
                          },
                        ]}
                        height={260}
                        margin={{ left: 30, right: 20, top: 20, bottom: 25 }}
                      />
                    </div>
                  )}
                </div>

                {/* Spending By Category Donut Chart */}
                <div className="lg:col-span-3 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col">
                  <h3 className="text-xl text-blue-500">Spending by category</h3>
                  <Divider className="my-3 border-white-500" />
                  <Spin
                    spinning={isUpdatingSpending}
                    indicator={<LoadingOutlined style={{ fontSize: 24, color: 'var(--color-blue-500)' }} spin />}
                  >
                    {categoryBreakdown.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[260px]">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className='flex h-full'>
                      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Donut Chart & Center Content */}
                        <div className="relative flex items-center justify-center w-[220px] h-[220px]">
                          <PieChart
                            series={[
                              {
                                data: pieChartData,
                                innerRadius: 65,
                                outerRadius: 95,
                                paddingAngle: 3,
                                cornerRadius: 4,
                              },
                            ]}
                            width={210}
                            height={210}
                            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                            hideLegend
                            onItemClick={(_event, d) => {
                              if (d && d.dataIndex !== undefined) {
                                handleCategoryClick(d.dataIndex);
                              }
                            }}
                          />
                          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none px-2">
                            <span className="text-2xl font-bold text-blue-800 transition-all">
                              {activeCategoryStats.percentage}
                            </span>
                            {activeCategoryStats.diff !== null && (
                              <span
                                className={`${activeCategoryStats.diff > 0
                                    ? 'bg-red-200/20 text-red-500'
                                    : 'bg-green-200/20 text-green-500'
                                  } px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-0.5 my-0.5 transition-all`}
                              >
                                {activeCategoryStats.diff > 0 ? (
                                  <CaretUpOutlined className="text-[10px]" />
                                ) : (
                                  <CaretDownOutlined className="text-[10px]" />
                                )}
                                {activeCategoryStats.diff > 0
                                  ? `+${activeCategoryStats.diff.toFixed(1)}%`
                                  : `${activeCategoryStats.diff.toFixed(1)}%`}
                              </span>
                            )}
                            <span className="text-xs text-white-700 transition-all">
                              R${activeCategoryStats.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Legend List */}
                        <div className="flex flex-col gap-2 flex-1 max-h-[280px] overflow-y-auto px-1">
                          {categoryBreakdown.map((item, index) => {
                            const isSelected = selectedCategoryIndex === index;
                            const isHovered = hoveredCategoryIndex === index && selectedCategoryIndex === null;
                            const hasSelection = selectedCategoryIndex !== null;

                            let itemStyles = 'border-transparent hover:border-white-500 hover:shadow-sm';
                            if (isSelected) {
                              itemStyles = 'shadow-md scale-[1.01] border-white-600';
                            } else if (hasSelection) {
                              itemStyles = 'border-transparent opacity-50 hover:opacity-90 hover:border-white-500';
                            } else if (isHovered) {
                              itemStyles = 'border-white-500 shadow-sm bg-white';
                            }

                            return (
                              <div
                                key={index}
                                onClick={() => handleCategoryClick(index)}
                                onMouseEnter={() => setHoveredCategoryIndex(index)}
                                onMouseLeave={() => setHoveredCategoryIndex(null)}
                                className={`flex items-center justify-between p-2.5 rounded-[16px] border transition-all cursor-pointer select-none ${itemStyles}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-medium`}>
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-white-700">
                                      {item.count} transactions
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.diff !== null && (
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${item.diff > 0
                                          ? 'bg-red-200/20 text-red-500'
                                          : 'bg-green-200/20 text-green-500'
                                        }`}
                                    >
                                      {item.diff > 0 ? (
                                        <CaretUpOutlined className="text-[10px]" />
                                      ) : (
                                        <CaretDownOutlined className="text-[10px]" />
                                      )}
                                      {item.diff > 0 ? `+${item.diff.toFixed(1)}%` : `${item.diff.toFixed(1)}%`}
                                    </span>
                                  )}
                                  <span className="text-sm font-semibold text-blue-500">
                                    R${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  </Spin>
                </div>
              </div>

              {/* Bottom Row: Transactions & Credit Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                {/* Recent Transactions Table */}
                <div className="lg:col-span-4 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl text-blue-500">
                      Transactions
                    </h3>
                    <button
                      onClick={() => navigate('/transactions')}
                      className="text-sm text-white-600 hover:text-white-700 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      View All
                    </button>
                  </div>
                  {currentIncomes.length === 0 && currentExpenses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[220px]">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <TransactionsTable
                      pageSize={5}
                      showSizeChanger={false}
                      defaultDateFrom={currentMonthStart}
                      defaultDateTo={currentMonthEnd}
                      onOpenNotification={onOpenNotification}
                      onTransactionUpdated={refreshSpendingCard}
                    />
                  )}
                </div>

                {/* Credit Card Usage List */}
                <div className="lg:col-span-2 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl text-blue-500">
                      Credit Card Usage
                    </h3>
                    <button
                      onClick={() => navigate('/credit-cards')}
                      className="text-sm text-white-600 hover:text-white-700 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      View All
                    </button>
                  </div>
                  <Divider className="my-3 border-white-500" />
                  <div className='flex h-full'>
                    {creditCardList.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5 mt-4 w-full">
                        {creditCardList.map((card) => (
                          <div key={card.id} className="flex items-center gap-4">
                            <CreditCardOutlined className="text-2xl text-white-600 flex-shrink-0" />
                            <div className="flex flex-col flex-1 gap-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-black-500 font-medium">
                                  {card.name}
                                </span>
                                <div className="text-xs">
                                  <span className="font-medium text-blue-500">
                                    R${card.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-white-700">
                                    {' '}/ R${card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              <Progress
                                percent={card.percent}
                                showInfo={false}
                                strokeColor={card.color}
                                size="small"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
