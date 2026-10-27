import './creditCards.scss';
import { Layout, ConfigProvider, Drawer, Button, Spin, Empty, Progress, Popconfirm, Input, Divider, Tag, Pagination, Popover, Checkbox } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { DeleteOutlined, CreditCardOutlined, DollarOutlined, RiseOutlined, LoadingOutlined, FilterOutlined, CalendarOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import NewCardDrawer from './newCreditCardDrawer/newCreditCard';
import { creditCardsApiService } from '../../services/api/credit-cards/credit-cards.api';
import type { CreditCard } from '../../types/credit-card.interface';
import type { ProgressProps } from 'antd';
import type { SearchProps } from 'antd/es/input';
import NewTransactionModal from '../../components/newExpanseModal/newTransactionModal';
import ImportOfxModal from '../../components/importOfxModal/ImportOfxModal';
import { transactionsApiService } from '../../services/api/transactions/transactions.api';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import type { DataType } from '../reports/transactions/transactions';
import type { TransactionItem } from '../../services/api/transactions/transactions.api';
import type { Category } from '../../types/category.interface';
import type { Subcategory } from '../../types/subcategory.interface';
import { truncate } from '../../utils/truncate';
import Select, { type StylesConfig } from 'react-select';
import { colourStyles } from '../../components/newExpanseModal/newTransactionModal';
import type { ColourOption } from '../../components/newExpanseModal/docs/data';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../services/api/subcategories/subcategories.api';

type CreditCardsProps = {
  onOpenNotification: (type: string, message: string, description?: string) => any;
};

function formatDateOnlyForDisplay(isoDate: string | null | undefined): string {
  const part = String(isoDate ?? '').slice(0, 10);
  const [yStr, mStr, dStr] = part.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return '';
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function CreditCards({ onOpenNotification }: CreditCardsProps) {
  const [open, setOpen] = useState(false);
  const [openTransactionDrawer, setOpenTransactionDrawer] = useState(false);
  const [importOfxOpen, setImportOfxOpen] = useState(false);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [allCards, setAllCards] = useState<CreditCard[]>([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<DataType | null>(null);

  const [transactions, setTransactions] = useState<DataType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState<{ categoryName: string; amount: number; color: string }[]>([]);
  const [allCardTransactions, setAllCardTransactions] = useState<TransactionItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tempSelectedCategoryIds, setTempSelectedCategoryIds] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
  const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
  const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isApplyingBulkCategory, setIsApplyingBulkCategory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [areSelectsDisabled, setAreSelectsDisabled] = useState(true);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = observerTargetRef.current;
    const container = scrollContainerRef.current;
    if (!target || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingTransactions && transactions.length < totalCount) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      {
        root: container,
        rootMargin: '100px',
      }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [isLoadingTransactions, transactions.length, totalCount]);

  const drawerSelectStyles: StylesConfig<ColourOption> = {
    ...colourStyles,
    menuPortal: (base) => ({ ...base, zIndex: 1001 }),
    menu: (base) => ({ ...base, zIndex: 1001 }),
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setIsDeleting(true);
    try {
      const recordsToDelete = transactions.filter((d) => selectedRowKeys.includes(d.key));
      for (const record of recordsToDelete) {
        try {
          if (record.type === 'expense') {
            await expensesApiService.deleteExpense(record.key);
            await delay(500);
          } else if (record.type === 'income') {
            await incomesApiService.deleteIncome(record.key);
          }
        } catch (err) {
          console.error('Error deleting transaction:', err);
        }
      }
      setSelectedRowKeys([]);
      handleTransactionSuccess();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkApplyCategory = async () => {
    if (selectedRowKeys.length === 0 || !categorySelected?.value) {
      onOpenNotification('error', 'Please select a category.');
      return;
    }
    if (areSelectsDisabled) {
      onOpenNotification('error', 'Cannot apply category to mixed transaction types.');
      return;
    }

    setIsApplyingBulkCategory(true);
    try {
      const recordsToUpdate = transactions.filter((d) => selectedRowKeys.includes(d.key));
      for (const record of recordsToUpdate) {
        try {
          if (record.type === 'expense') {
            await expensesApiService.updateExpenseCategory(
              record.key,
              categorySelected.value,
              subcategorySelected?.value ?? null
            );
          } else if (record.type === 'income') {
            await incomesApiService.updateIncomeCategory(
              record.key,
              categorySelected.value,
              subcategorySelected?.value ?? null
            );
          }
        } catch (err) {
          console.error('Error updating transaction category:', err);
        }
      }
      onOpenNotification('success', `Category applied to ${recordsToUpdate.length} transaction(s).`);
      setSelectedRowKeys([]);
      setCategorySelected(null);
      setSubcategorySelected(null);
      handleTransactionSuccess();
    } catch (e) {
      onOpenNotification('error', 'Failed to apply category', e instanceof Error ? e.message : String(e));
    } finally {
      setIsApplyingBulkCategory(false);
    }
  };

  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      setAreSelectsDisabled(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
      setColourOptions([]);
      return;
    }

    const selectedRecords = transactions.filter((d) => selectedRowKeys.includes(d.key));
    const types = new Set(selectedRecords.map((r) => r.type));

    if (types.size === 1) {
      const transactionType = Array.from(types)[0];
      setAreSelectsDisabled(false);
      void loadCategoriesForType(transactionType);
    } else {
      setAreSelectsDisabled(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
      setColourOptions([]);
    }
  }, [selectedRowKeys, transactions]);

  const onCategoryChange = async (colourOptionSelected: ColourOption | null) => {
    setCategorySelected(colourOptionSelected);
    setSubcategorySelected(null);
    if (!colourOptionSelected) {
      setSubcategoryOptions([]);
      return;
    }
    const subcategories = await subcategoriesApiService.getSubcategoryByCategoryId(colourOptionSelected.value);
    const colourOptionsSubcategories: ColourOption[] = [];
    for (const subcategory of subcategories) {
      colourOptionsSubcategories.push({
        value: subcategory.id!,
        label: subcategory.name,
        color: colourOptionSelected.color,
      });
    }
    setSubcategoryOptions(colourOptionsSubcategories);
  };

  const onSubcategoryChange = (colourOptionSelected: ColourOption | null) => {
    setSubcategorySelected(colourOptionSelected);
  };

  const loadCategoriesForType = async (type: string) => {
    setCategorySelected(null);
    setSubcategorySelected(null);
    setSubcategoryOptions([]);
    const cats = await categoriesApiService.getCategoriesByType(type);
    setColourOptions(
      (cats ?? []).map((c) => ({
        value: c.id!,
        label: c.name,
        color: c.color_hex || '#999',
      }))
    );
  };

  const handleAddCategory = async (record: DataType) => {
    if (!categorySelected?.value) {
      onOpenNotification('error', 'Please select a category.');
      return;
    }
    try {
      if (record.type === 'expense') {
        setIsUpdatingCategory(true);
        await expensesApiService.updateExpenseCategory(
          record.key,
          categorySelected.value,
          subcategorySelected?.value ?? null
        );
      } else {
        await incomesApiService.updateIncomeCategory(
          record.key,
          categorySelected.value,
          subcategorySelected?.value ?? null
        );
      }
      onOpenNotification('success', 'Category updated.');
      handleTransactionSuccess();
    } catch (e) {
      onOpenNotification('error', 'Failed to update category', e instanceof Error ? e.message : String(e));
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const addCategoryPopoverContent = (
    <div className="flex flex-col p-1" style={{ width: 228, maxWidth: 228, boxSizing: 'border-box' }}>
      <div className="w-full mr-1 mb-1">
        <label htmlFor="category" className="py-1 text-xs font-semibold text-blue-700">Category</label>
      </div>
      <Select<ColourOption, false>
        value={categorySelected}
        options={colourOptions}
        styles={{
          ...colourStyles,
          container: (base) => ({ ...base, width: '100%', maxWidth: '100%' }),
          valueContainer: (base) => ({ ...base, overflow: 'hidden' }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        placeholder="Select a category"
        onChange={(e) => void onCategoryChange(e)}
        isSearchable={false}
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      />
      <div className="w-full my-1">
        <label htmlFor="subcategory" className="py-1 text-xs font-semibold text-blue-700">Subcategory</label>
      </div>
      <Select<ColourOption, false>
        value={subcategorySelected}
        options={subcategoryOptions}
        styles={{
          ...colourStyles,
          container: (base) => ({ ...base, width: '100%', maxWidth: '100%' }),
          valueContainer: (base) => ({ ...base, overflow: 'hidden' }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        placeholder="Select a subcategory"
        onChange={(e) => onSubcategoryChange(e)}
        isClearable
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      />
    </div>
  );

  const transactionItemToDataType = (item: TransactionItem): DataType => {
    const category = item.categories
      ? ([item.categories] as Category[])
      : [];
    const subcategory = item.subcategories
      ? ([item.subcategories] as Subcategory[])
      : [];
    const dateRaw = String(item.date ?? '').slice(0, 10);
    return {
      key: item.id,
      type: item.type,
      amount: item.amount,
      description: item.description ?? undefined,
      category,
      subcategory,
      date: formatDateOnlyForDisplay(item.date),
      dateRaw,
      credit_card_id: item.credit_card_id,
      installment_number: item.installment_number,
      total_installments: item.total_installments,
      created_at: item.created_at,
    };
  };

  const fetchCategoryStats = async () => {
    try {
      const res = await transactionsApiService.getTransactions({
        page: 1,
        pageSize: 100,
        creditCardId: 'all',
      });

      const totals: Record<string, { amount: number; color: string }> = {};

      res.data.forEach((tx) => {
        if (tx.type === 'expense') {
          const categoryName = tx.categories?.name
            ? tx.categories.name.charAt(0).toUpperCase() + tx.categories.name.slice(1)
            : 'Uncategorized';
          const color = tx.categories?.color_hex || '#1890ff';
          if (!totals[categoryName]) {
            totals[categoryName] = { amount: 0, color };
          }
          totals[categoryName].amount += tx.amount;
        }
      });

      const stats = Object.entries(totals).map(([name, data]) => ({
        categoryName: name,
        amount: data.amount,
        color: data.color,
      })).sort((a, b) => b.amount - a.amount);

      setCategoryTotals(stats);
      setAllCardTransactions(res.data);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const fetchTransactions = async (pageToFetch = currentPage, append = false) => {
    setIsLoadingTransactions(true);
    try {
      const res = await transactionsApiService.getTransactions({
        page: pageToFetch,
        pageSize: pageSize,
        creditCardId: 'all',
        search: searchText,
        categoryId: selectedCategoryIds.join(','),
      });
      const rows = res.data.map(transactionItemToDataType);
      rows.sort((a, b) => {
        const dateCompare = b.dateRaw.localeCompare(a.dateRaw);
        if (dateCompare !== 0) return dateCompare;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      if (append) {
        setTransactions((prev) => {
          const existingKeys = new Set(prev.map((item) => item.key));
          const uniqueNewRows = rows.filter((row) => !existingKeys.has(row.key));
          const nextTransactions = [...prev, ...uniqueNewRows];
          nextTransactions.sort((a, b) => {
            const dateCompare = b.dateRaw.localeCompare(a.dateRaw);
            if (dateCompare !== 0) return dateCompare;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          });
          return nextTransactions;
        });
      } else {
        setTransactions(rows);
      }
      setTotalCount(res.total);
      await fetchCategoryStats();
    } catch (error) {
      console.error('Error fetching card transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleTransactionSuccess = () => {
    fetchCards();
    if (currentPage === 1) {
      void fetchTransactions(1, false);
    } else {
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    void fetchTransactions(currentPage, currentPage > 1);
  }, [currentPage, pageSize, searchText, selectedCategoryIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedCategoryIds]);

  const showDrawer = () => {
    setCardToEdit(null);
    setOpen(true);
  };

  const onClose = () => {
    setCardToEdit(null);
    setOpen(false);
    setIsSavingCard(false);
  };

  const handleEditCard = (card: CreditCard) => {
    setCardToEdit(card);
    setOpen(true);
  };

  const showTransactionDrawer = () => {
    setOpenTransactionDrawer(true);
  };

  const closeTransactionDrawer = () => {
    setOpenTransactionDrawer(false);
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = async (id: string, type: string) => {
    try {
      if (type === 'expense') {
        await expensesApiService.deleteExpense(id);
      } else {
        await incomesApiService.deleteIncome(id);
      }
      onOpenNotification('success', 'Transaction deleted successfully');
      handleTransactionSuccess();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      onOpenNotification('error', 'Error deleting transaction!');
    }
  };

  const handleDeleteCard = async (id?: string) => {
    if (!id) return;
    try {
      await creditCardsApiService.deleteCreditCard(id);
      onOpenNotification('success', 'Credit card deleted successfully');
      fetchCards();
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting credit card:', error);
      onOpenNotification('error', 'Error deleting credit card!');
    }
  };

  const handleEditTransaction = (tx: DataType) => {
    setTransactionToEdit(tx);
    setOpenTransactionDrawer(true);
  };

  const progressbarColors = (cardGradient: CreditCard['card_gradient']): ProgressProps['strokeColor'] => {
    const gradient = cardGradient.split('-')[1];

    const colors = [...gradient.matchAll(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g)]
      .map(match => {
        const [, r, g, b] = match;
        return rgbToHex(Number(r), Number(g), Number(b));
      });

    return {
      '0%': colors[0],
      '100%': colors[1],
    };
  };

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b]
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  const onSearch: SearchProps['onSearch'] = (value: string): void => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setPopoverOpen(newOpen);
    if (newOpen) {
      setTempSelectedCategoryIds(selectedCategoryIds);
    }
  };

  const toggleTempKey = (id: string) => {
    setTempSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setTempSelectedCategoryIds([]);
    setSelectedCategoryIds([]);
    setCurrentPage(1);
    setPopoverOpen(false);
  };

  const handleOk = () => {
    setSelectedCategoryIds(tempSelectedCategoryIds);
    setCurrentPage(1);
    setPopoverOpen(false);
  };

  const uniqueIncomeCategories = Array.from(
    new Map(
      allCardTransactions
        .filter(tx => tx.type === 'income' && tx.categories?.id)
        .map(tx => [tx.categories!.id, tx.categories!])
    ).values()
  );

  const uniqueExpenseCategories = Array.from(
    new Map(
      allCardTransactions
        .filter(tx => tx.type === 'expense' && tx.categories?.id)
        .map(tx => [tx.categories!.id, tx.categories!])
    ).values()
  );

  const popoverContent = (
    <div style={{ padding: 8, minWidth: 220 }} onKeyDown={(e) => e.stopPropagation()}>
      <div style={{ marginBottom: 12 }}>
        <div className="font-semibold mb-1.5 text-black-200 text-xs">Incomes</div>
        {uniqueIncomeCategories.length === 0 ? (
          <span className="text-xs text-black-200">No income category</span>
        ) : (
          <div className="flex flex-col gap-1">
            {uniqueIncomeCategories.map((cat) => {
              const name = cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1) : 'Uncategorized';
              return (
                <Checkbox
                  key={cat.id}
                  checked={tempSelectedCategoryIds.includes(cat.id!)}
                  onChange={() => toggleTempKey(cat.id!)}
                >
                  {name}
                </Checkbox>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="font-semibold mb-1.5 text-black-200 text-xs">Expenses</div>
        {uniqueExpenseCategories.length === 0 ? (
          <span className="text-xs text-black-200">No expense category</span>
        ) : (
          <div className="flex flex-col gap-1">
            {uniqueExpenseCategories.map((cat) => {
              const name = cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1) : 'Uncategorized';
              return (
                <Checkbox
                  key={cat.id}
                  checked={tempSelectedCategoryIds.includes(cat.id!)}
                  onChange={() => toggleTempKey(cat.id!)}
                >
                  {name}
                </Checkbox>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 pt-2 border-t border-white-500/60">
        <Button
          type="link"
          size="small"
          onClick={handleReset}
          className="w-[90px] text-black-200 hover:!text-blue-500"
        >
          Reset
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={handleOk}
          className="w-[90px] !bg-blue-500 hover:!bg-blue-600 rounded-lg"
        >
          OK
        </Button>
      </div>
    </div>
  );

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const [allData, pageRes] = await Promise.all([
        creditCardsApiService.getAllCreditCards(),
        creditCardsApiService.getCreditCardsPage(cardsPage, 3)
      ]);
      setAllCards(allData);
      setCards(pageRes.data);
      setCardsTotal(pageRes.total);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [cardsPage]);

  const navigate = useNavigate();

  // Calculations
  const activeCards = allCards.filter(c => c.card_active !== false);
  const totalLimit = activeCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
  const totalSpent = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);
  const availableLimit = totalLimit - totalSpent;
  const percentAvailable = totalLimit > 0 ? Math.round((availableLimit / totalLimit) * 100) : 0;

  const cardsUsedCount = activeCards.filter(card => {
    const cardTx = allCardTransactions.filter(t => t.credit_card_id === card.id);
    const cardSpent = cardTx.reduce((sum, tx) => {
      if (tx.type === 'expense') return sum + tx.amount;
      if (tx.type === 'income') return sum - tx.amount;
      return sum;
    }, 0);
    return cardSpent > 0;
  }).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar
          onOpenDashboardPage={() => navigate('/dashboard')}
          onOpenCategoriesPage={() => navigate('/categories')}
        />
        <Layout className="!bg-white-300 flex flex-col flex-1">
          <ConfigProvider
            theme={{
              components: {
                Spin: {
                  dotSizeLG: 50,
                },
              },
            }}
          >
            <Content className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
              <Drawer
                title={cardToEdit ? "Edit Credit Card" : "Add a New Card"}
                open={open}
                onClose={onClose}
                width={500}
                footer={
                  <Button
                    type="primary"
                    htmlType="submit"
                    form="new-credit-card-form"
                    className="w-full mb-2 !bg-blue-500 hover:!bg-blue-600 rounded-xl"
                    loading={isSavingCard}
                  >
                    Submit
                  </Button>
                }
              >
                <NewCardDrawer onClose={onClose} onSuccess={fetchCards} cardToEdit={cardToEdit} onLoadingChange={setIsSavingCard} />
              </Drawer>

              {openTransactionDrawer && (
                <NewTransactionModal
                  onClose={closeTransactionDrawer}
                  transactionToEdit={transactionToEdit}
                  uptadeTransactions={handleTransactionSuccess}
                  onOpenNotification={onOpenNotification}
                  origin="credit-cards"
                />
              )}

              <ImportOfxModal
                open={importOfxOpen}
                onClose={() => setImportOfxOpen(false)}
                onSuccess={handleTransactionSuccess}
                onOpenNotification={onOpenNotification}
                showCreditCardSelect={true}
              />

              <div className="flex flex-col gap-6 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-blue-500 tracking-tight">Credit Cards</h1>
                    <p className="text-black-200 text-sm">Manage your credit cards and track your spending.</p>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className="!bg-blue-500 hover:!bg-blue-600 rounded-xl px-6 flex items-center gap-2 shadow-xs transition-all duration-200"
                    onClick={() => setImportOfxOpen(true)}
                  >
                    <UploadOutlined className="text-lg" />
                    Import Transactions
                  </Button>
                </div>

                {/* Top Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Limit */}
                  <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-black-200">Total Limit</span>
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <CreditCardOutlined className="text-xl text-blue-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-semibold text-blue-700 tracking-tight">
                        {formatCurrency(totalLimit)}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-black-200">
                        <span className="bg-blue-100 text-blue-500 px-2.5 py-0.5 rounded-full font-semibold">
                          {activeCards.length} active
                        </span>
                        <span>Registered cards</span>
                      </div>
                    </div>
                  </div>

                  {/* Available Limit */}
                  <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-black-200">Available Limit</span>
                      <div className="p-2 bg-green-200/20 rounded-xl">
                        <RiseOutlined className="text-xl text-green-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-semibold text-blue-700 tracking-tight">
                        {formatCurrency(availableLimit)}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-black-200">
                        <span className="bg-green-200/20 text-green-500 px-2.5 py-0.5 rounded-full font-semibold">
                          {percentAvailable}%
                        </span>
                        <span>of total limit</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Spent */}
                  <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-black-200">Total Spent</span>
                      <div className="p-2 bg-red-200/20 rounded-xl">
                        <DollarOutlined className="text-xl text-red-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-semibold text-blue-700 tracking-tight">
                        {formatCurrency(totalSpent)}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-black-200">
                        <span className="bg-red-200/20 text-red-500 px-2.5 py-0.5 rounded-full font-semibold">
                          {cardsUsedCount}
                        </span>
                        <span>cards with activity</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Cards Container */}
                <div className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-blue-700">Active Cards</h2>
                      <p className="text-xs text-black-200">Manage card limits and visual styling</p>
                    </div>
                    <Button
                      type="primary"
                      className="!bg-blue-500 hover:!bg-blue-600 rounded-xl flex items-center gap-1.5"
                      onClick={showDrawer}
                      icon={<PlusOutlined />}
                    >
                      Add Card
                    </Button>
                  </div>

                  <Divider className="my-0 border-white-500/60" />

                  {isLoading ? (
                    <div className="py-16 flex justify-center">
                      <Spin indicator={<LoadingOutlined spin />} size="large" />
                    </div>
                  ) : cards.length === 0 ? (
                    <div className="py-16 flex justify-center">
                      <Empty description="No credit cards found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {cards.map((card) => {
                          const cardTx = allCardTransactions.filter(t => t.credit_card_id === card.id);
                          const cardSpent = cardTx.reduce((sum, tx) => {
                            if (tx.type === 'expense') return sum + tx.amount;
                            if (tx.type === 'income') return sum - tx.amount;
                            return sum;
                          }, 0);
                          const percentUsed = card.credit_limit ? Math.round((cardSpent / card.credit_limit) * 100) : 0;

                          return (
                            <div
                              key={card.id}
                              className="flex flex-col items-center gap-4 p-5 rounded-[20px] bg-white-200 border border-white-500/60 shadow-xs hover:shadow-sm hover:border-white-500 transition-all"
                            >
                              <div
                                className="w-full max-w-[320px] h-48 py-4 px-5 flex flex-col justify-between rounded-[20px] text-white shadow-md relative overflow-hidden select-none"
                                style={{
                                  background: card.card_gradient || 'linear-gradient(90deg, rgb(16, 142, 233) 0%, rgb(135, 208, 104) 100%)',
                                }}
                              >
                                <div className="flex flex-col">
                                  <p className="text-lg font-semibold tracking-wide m-0 drop-shadow-xs">{truncate(card.card_name, 18)}</p>
                                  <p className="text-xs opacity-85 m-0 drop-shadow-xs">{truncate(card.bank_name, 18)}</p>
                                </div>
                                <div className="flex items-center gap-2 tracking-widest my-auto">
                                  <span className="text-xl font-mono opacity-90">•••• •••• ••••</span>
                                  <span className="text-xl font-mono font-bold tracking-normal">{card.card_digits}</span>
                                </div>
                                <div className="flex justify-end items-end">
                                  <div className="flex flex-col text-right">
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">Valid Thru</span>
                                    <span className="text-xs font-semibold font-mono tracking-wide">{card.valid_thru}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full max-w-[320px] flex flex-col gap-2.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-black-200">Used: <strong className="text-blue-700 font-semibold">{formatCurrency(cardSpent)}</strong></span>
                                  <span className="text-black-200">Limit: <strong className="text-blue-700 font-semibold">{formatCurrency(card.credit_limit || 0)}</strong></span>
                                </div>
                                <Progress
                                  size={{ height: 8 }}
                                  strokeColor={progressbarColors(card.card_gradient)}
                                  percent={percentUsed}
                                  showInfo={false}
                                  className="m-0"
                                />
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-black-200">Usage: <strong className="text-blue-700 font-semibold">{percentUsed}%</strong></span>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="small"
                                      className="rounded-lg hover:!text-blue-500 hover:!border-blue-500"
                                      icon={<EditOutlined />}
                                      onClick={() => handleEditCard(card)}
                                    />
                                    <Popconfirm
                                      title="Are you sure?"
                                      onConfirm={() => handleDeleteCard(card.id)}
                                      cancelText="No"
                                      okText="Yes"
                                      icon={null}
                                      placement="topRight"
                                    >
                                      <Button
                                        size="small"
                                        className="rounded-lg hover:!text-red-500 hover:!border-red-500"
                                        icon={<DeleteOutlined />}
                                      />
                                    </Popconfirm>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {cardsTotal > 0 && (
                        <div className="flex justify-center sm:justify-end pt-2">
                          <Pagination
                            current={cardsPage}
                            pageSize={3}
                            total={cardsTotal}
                            onChange={(page) => setCardsPage(page)}
                            showSizeChanger={false}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom Row: Transactions & Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                  {/* Card Transactions */}
                  <div className="lg:col-span-4 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-blue-700">Card Transactions</h2>
                        <p className="text-xs text-black-200">Latest credit card expenses and incomes</p>
                      </div>
                      <Button
                        type="primary"
                        className="!bg-blue-500 hover:!bg-blue-600 rounded-xl flex items-center gap-1.5"
                        onClick={showTransactionDrawer}
                        icon={<PlusOutlined />}
                      >
                        Add Transaction
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input.Search
                        placeholder="Search transactions..."
                        onSearch={onSearch}
                        size="large"
                        allowClear
                        className="rounded-xl flex-1"
                      />
                      <Popover
                        content={popoverContent}
                        trigger="click"
                        open={popoverOpen}
                        onOpenChange={handleOpenChange}
                        placement="bottomRight"
                      >
                        <Button
                          type={selectedCategoryIds.length > 0 ? 'primary' : 'default'}
                          icon={<FilterOutlined />}
                          size="large"
                          className={selectedCategoryIds.length > 0 ? '!bg-blue-500 rounded-xl' : 'rounded-xl'}
                        />
                      </Popover>
                    </div>

                    <Divider className="my-1 border-white-500/60" />

                    <Spin spinning={isLoadingTransactions && currentPage === 1} indicator={<LoadingOutlined spin />} size="large">
                      {transactions.length === 0 ? (
                        <div className="py-12 flex justify-center">
                          <Empty description="No credit card transactions found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        </div>
                      ) : (
                        <div
                          ref={scrollContainerRef}
                          className="flex flex-col gap-2 overflow-y-auto pr-1"
                          style={{ maxHeight: '420px', overflowAnchor: 'none' }}
                        >
                          {transactions.map((tx) => {
                            const category = tx.category[0];
                            const subcat = tx.subcategory[0];
                            const color = category?.color_hex || '#1890ff';
                            const formattedAmount = tx.amount.toFixed(2).replace('.', ',');

                            return (
                              <div key={tx.key} className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedRowKeys.includes(tx.key)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedRowKeys((prev) =>
                                      checked ? [...prev, tx.key] : prev.filter((k) => k !== tx.key)
                                    );
                                  }}
                                />
                                <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-[16px] border border-white-500/60 bg-white-200 hover:border-white-500 hover:shadow-xs transition-all gap-2">
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <p className="text-sm font-semibold text-blue-700 truncate">{tx.description || 'No Description'}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-black-200">
                                      <span className="flex items-center gap-1">
                                        <CalendarOutlined className="text-black-200" />
                                        {tx.date}
                                      </span>
                                      <div className="container-tags inline-flex items-center">
                                        {category ? (
                                          <>
                                            <Tag
                                              className={`m-0 tag-category ${subcat ? 'has-subcategory' : ''}`}
                                              style={{
                                                backgroundColor: color,
                                                borderColor: color,
                                                color: 'var(--color-pure-white)',
                                                borderRadius: subcat ? '6px 0 0 6px' : '6px',
                                                margin: 0,
                                                height: '22px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '0 8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                              }}
                                              bordered={false}
                                            >
                                              <span>
                                                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                                              </span>
                                            </Tag>
                                            {subcat && (
                                              <Tag
                                                key={subcat.id}
                                                className="m-0 tag-subcategory"
                                                style={{
                                                  backgroundColor: 'var(--color-pure-white)',
                                                  borderColor: color,
                                                  borderLeft: 'none',
                                                  color: color,
                                                  borderRadius: '0 6px 6px 0',
                                                  margin: 0,
                                                  height: '22px',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  padding: '0 8px',
                                                  fontSize: '11px',
                                                  fontWeight: 500,
                                                }}
                                                bordered={true}
                                              >
                                                <span>
                                                  {subcat.name.charAt(0).toUpperCase() + subcat.name.slice(1)}
                                                </span>
                                              </Tag>
                                            )}
                                          </>
                                        ) : (
                                          <Popconfirm
                                            title=""
                                            overlayStyle={{ width: 260 }}
                                            description={addCategoryPopoverContent}
                                            onOpenChange={(open) => {
                                              if (open) loadCategoriesForType(tx.type);
                                            }}
                                            onConfirm={() => handleAddCategory(tx)}
                                            okButtonProps={{ loading: isUpdatingCategory, iconPosition: "end" }}
                                            placement="right"
                                            icon={null}
                                          >
                                            <Button icon={<PlusOutlined />} size="small" className="rounded-lg text-xs">
                                              Add a category
                                            </Button>
                                          </Popconfirm>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                                    <span className={`text-base font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                      {tx.type === 'income' ? '+' : '-'} R$ {formattedAmount}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        icon={<EditOutlined />}
                                        size="small"
                                        className="rounded-lg hover:!text-blue-500 hover:!border-blue-500"
                                        onClick={() => handleEditTransaction(tx)}
                                      />
                                      <Popconfirm
                                        title="Are you sure?"
                                        onConfirm={() => handleDeleteTransaction(tx.key, tx.type)}
                                        cancelText="No"
                                        okText="Yes"
                                        icon={null}
                                        placement="right"
                                      >
                                        <Button
                                          icon={<DeleteOutlined />}
                                          size="small"
                                          className="rounded-lg hover:!text-red-500 hover:!border-red-500"
                                        />
                                      </Popconfirm>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {transactions.length < totalCount && (
                            <div ref={observerTargetRef} className="flex justify-center p-2">
                              <Spin indicator={<LoadingOutlined spin />} size="small" />
                            </div>
                          )}
                        </div>
                      )}
                    </Spin>
                  </div>

                  {/* Categories Breakdown */}
                  <div className="lg:col-span-2 bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-semibold text-blue-700">Categories Breakdown</h2>
                      <p className="text-xs text-black-200">Spending distribution by category</p>
                    </div>
                    <Divider className="my-1 border-white-500/60" />
                    <div className="flex flex-col gap-2.5 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                      {categoryTotals.length === 0 ? (
                        <div className="py-12 flex justify-center">
                          <Empty description="No categories found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        </div>
                      ) : (
                        (() => {
                          const totalVal = categoryTotals.reduce((sum, c) => sum + c.amount, 0);
                          return categoryTotals.map((cat) => {
                            const percent = totalVal > 0 ? Math.round((cat.amount / totalVal) * 100) : 0;
                            return (
                              <div
                                key={cat.categoryName}
                                className="p-3 rounded-[16px] border border-white-500/60 bg-white-200 hover:border-white-500 hover:shadow-xs transition-all flex flex-col gap-1.5"
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-blue-700 truncate">{cat.categoryName}</span>
                                  <span className="font-semibold text-blue-700">{formatCurrency(cat.amount)}</span>
                                </div>
                                <Progress
                                  size={{ height: 6 }}
                                  percent={percent}
                                  strokeColor={cat.color}
                                  showInfo={false}
                                  className="m-0"
                                />
                                <div className="flex justify-end text-[11px] text-black-200">
                                  <span>{percent}% of total</span>
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Drawer */}
                <Drawer
                  title="Bulk Actions"
                  placement="right"
                  width={320}
                  closable={true}
                  mask={false}
                  onClose={() => setSelectedRowKeys([])}
                  open={selectedRowKeys.length > 0}
                  className="bulk-drawer-element"
                >
                  <div className="flex flex-col gap-4 h-full justify-between py-2">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-red-500">
                          Selected: {selectedRowKeys.length} transaction{selectedRowKeys.length > 1 ? 's' : ''}
                        </span>
                        <Popconfirm
                          title="Are you sure?"
                          onConfirm={handleBulkDelete}
                          okText="Yes"
                          cancelText="No"
                          icon={null}
                          okButtonProps={{ loading: isDeleting, iconPosition: "end" }}
                          placement="bottom"
                        >
                          <Button
                            danger
                            loading={isDeleting}
                            icon={<DeleteOutlined />}
                            className="rounded-lg"
                          />
                        </Popconfirm>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="bulk-category" className="text-xs font-semibold text-blue-700">Category</label>
                        <Select<ColourOption, false>
                          id="bulk-category"
                          value={categorySelected}
                          options={colourOptions}
                          styles={drawerSelectStyles}
                          placeholder="Select a category"
                          onChange={(e) => void onCategoryChange(e)}
                          isSearchable={false}
                          menuPlacement="bottom"
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                          isDisabled={areSelectsDisabled}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="bulk-subcategory" className="text-xs font-semibold text-blue-700">Subcategory</label>
                        <Select<ColourOption, false>
                          id="bulk-subcategory"
                          value={subcategorySelected}
                          options={subcategoryOptions}
                          styles={drawerSelectStyles}
                          placeholder="Select a subcategory"
                          onChange={(e) => onSubcategoryChange(e)}
                          menuPlacement="bottom"
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                          isDisabled={areSelectsDisabled}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Button
                        type="primary"
                        size="large"
                        className="!bg-blue-500 hover:!bg-blue-600 rounded-xl"
                        onClick={handleBulkApplyCategory}
                        loading={isApplyingBulkCategory}
                        disabled={areSelectsDisabled || !categorySelected?.value}
                        block
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </Drawer>
              </div>
            </Content>
          </ConfigProvider>
        </Layout>
      </Layout>
    </>
  );
}
