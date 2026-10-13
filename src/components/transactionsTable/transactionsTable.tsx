import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Checkbox,
  DatePicker,
  Input,
  Popconfirm,
  Tooltip,
} from 'antd';
import type { InputRef, TableColumnType, TableProps } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import Select from 'react-select';
import dayjs from 'dayjs';

import { colourStyles } from '../newExpanseModal/newTransactionModal';
import { type ColourOption } from '../newExpanseModal/docs/data';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../services/api/subcategories/subcategories.api';
import {
  transactionsApiService,
  type TransactionItem,
} from '../../services/api/transactions/transactions.api';
import type { Category } from '../../types/category.interface';
import type { Subcategory } from '../../types/subcategory.interface';
import { truncate } from '../../utils/truncate';

import '../../pages/reports/transactions/transactions.scss';
import '../../pages/reports/reports.scss';

export interface DataType {
  key: string;
  type: string;
  amount: number;
  category: Category[];
  subcategory: Subcategory[];
  date: string;
  dateRaw: string;
  description: string | undefined;
  credit_card_id?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  created_at?: string;
}

type DataIndex = keyof DataType;
type OnChange = NonNullable<TableProps<DataType>['onChange']>;
type Filters = Parameters<OnChange>[1];

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

export interface TransactionsTableProps {
  pageSize?: number;
  showActions?: boolean;
  showSizeChanger?: boolean;
  rowSelection?: TableProps<DataType>['rowSelection'];
  refreshTrigger?: number;
  onEdit?: (record: DataType) => void;
  onDelete?: (record: DataType) => Promise<void> | void;
  onOpenNotification?: (type: string, message: string, description?: string) => void;
  onTransactionUpdated?: () => void;
  onDataChange?: (data: DataType[]) => void;
  scroll?: { x?: number | string | true; y?: number | string };
  className?: string;
  defaultDateFrom?: string;
  defaultDateTo?: string;
}

interface AddCategoryCellProps {
  record: DataType;
  onCategoryUpdated: () => void;
  onOpenNotification?: (type: string, message: string, description?: string) => void;
}

function AddCategoryCell({
  record,
  onCategoryUpdated,
  onOpenNotification,
}: AddCategoryCellProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
  const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
  const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);

  const loadCategories = async () => {
    setIsLoading(true);
    setCategorySelected(null);
    setSubcategorySelected(null);
    setSubcategoryOptions([]);
    try {
      const cats = await categoriesApiService.getCategoriesByType(record.type);
      setColourOptions(
        (cats ?? []).map((c) => ({
          value: c.id!,
          label: c.name,
          color: c.color_hex || '#999',
        }))
      );
    } catch (err) {
      console.error('Failed to load categories', err);
      setColourOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadCategories();
    } else {
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
    }
  };

  const onCategoryChange = async (option: ColourOption | null) => {
    setCategorySelected(option);
    setSubcategorySelected(null);
    setSubcategoryOptions([]);
    if (!option) return;
    try {
      const subcategories = await subcategoriesApiService.getSubcategoryByCategoryId(option.value);
      setSubcategoryOptions(
        (subcategories ?? []).map((sub) => ({
          value: sub.id!,
          label: sub.name,
          color: option.color,
        }))
      );
    } catch (err) {
      console.error('Failed to load subcategories', err);
      setSubcategoryOptions([]);
    }
  };

  const handleConfirm = async () => {
    if (!categorySelected?.value) {
      onOpenNotification?.('error', 'Please select a category.');
      return;
    }
    setIsUpdating(true);
    try {
      if (record.type === 'expense') {
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
      onOpenNotification?.('success', 'Category updated.');
      setOpen(false);
      onCategoryUpdated();
    } catch (e) {
      onOpenNotification?.('error', 'Failed to update category', e instanceof Error ? e.message : String(e));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popconfirm
      title=""
      styles={{
        root: { width: 260 }
      }}
      description={
        <div className="flex flex-col p-1 w-[240px]">
          <div className="w-full mr-1 mb-1">
            <label className="py-1 text-xs font-semibold text-gray-700">Category</label>
          </div>
          <Select<ColourOption, false>
            value={categorySelected}
            options={colourOptions}
            placeholder={isLoading ? 'Loading categories...' : 'Select a category'}
            isLoading={isLoading}
            onChange={(val) => void onCategoryChange(val as ColourOption | null)}
            isSearchable
            menuPlacement="auto"
            menuPosition="fixed"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            styles={{
              ...colourStyles,
              container: (base) => ({ ...base, width: '100%', maxWidth: '100%' }),
              valueContainer: (base) => ({ ...base, overflow: 'hidden' }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          <div className="w-full my-1">
            <label className="py-1 text-xs font-semibold text-gray-700">Subcategory</label>
          </div>
          <Select<ColourOption, false>
            value={subcategorySelected}
            options={subcategoryOptions}
            placeholder="Select a subcategory"
            isDisabled={!categorySelected}
            onChange={(val) => setSubcategorySelected(val as ColourOption | null)}
            isClearable
            menuPlacement="auto"
            menuPosition="fixed"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            styles={{
              ...colourStyles,
              container: (base) => ({ ...base, width: '100%', maxWidth: '100%' }),
              valueContainer: (base) => ({ ...base, overflow: 'hidden' }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>
      }
      open={open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      okButtonProps={{ loading: isUpdating, iconPosition: 'end' }}
      placement="right"
      icon={null}
    >
      <Button icon={<PlusOutlined />} size="small">Add a category</Button>
    </Popconfirm>
  );
}

export default function TransactionsTable({
  pageSize = 5,
  showActions = false,
  showSizeChanger = true,
  rowSelection,
  refreshTrigger = 0,
  onEdit,
  onDelete,
  onOpenNotification,
  onTransactionUpdated,
  onDataChange,
  scroll,
  className,
  defaultDateFrom,
  defaultDateTo,
}: TransactionsTableProps) {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingTableData, setIsLoadingTableData] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const [openPopconfirmFor, setOpenPopconfirmFor] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseCategoryFilters, setExpenseCategoryFilters] = useState<{ text: string; value: string }[]>([]);
  const [incomeCategoryFilters, setIncomeCategoryFilters] = useState<{ text: string; value: string }[]>([]);

  const currencySymbol = 'R$';

  const handleNotification = (type: string, message: string, description?: string) => {
    if (onOpenNotification) {
      onOpenNotification(type, message, description);
    }
  };

  useEffect(() => {
    const loadAllCategoriesForFilter = async () => {
      try {
        const [expenseCategories, incomeCategories] = await Promise.all([
          categoriesApiService.getCategoriesByType('expense'),
          categoriesApiService.getCategoriesByType('income'),
        ]);
        setExpenseCategoryFilters(
          expenseCategories.map((c) => ({
            text: c.name.charAt(0).toUpperCase() + c.name.slice(1),
            value: c.id ?? '',
          }))
        );
        setIncomeCategoryFilters(
          incomeCategories.map((c) => ({
            text: c.name.charAt(0).toUpperCase() + c.name.slice(1),
            value: c.id ?? '',
          }))
        );
      } catch {
        setExpenseCategoryFilters([]);
        setIncomeCategoryFilters([]);
      }
    };
    loadAllCategoriesForFilter();
  }, []);

  const transactionItemToDataType = (item: TransactionItem): DataType => {
    const category = item.categories ? ([item.categories] as Category[]) : [];
    const subcategory = item.subcategories ? ([item.subcategories] as Subcategory[]) : [];
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
    };
  };

  const resolveTypeQueryParam = (): 'expense' | 'income' | undefined => {
    const raw = filteredInfo.type;
    if (raw == null) return undefined;
    const list = Array.isArray(raw) ? raw.map(String) : [String(raw)];
    const unique = [...new Set(list.filter((t) => t === 'income' || t === 'expense'))];
    if (unique.length === 0) return undefined;
    if (unique.length > 1) return undefined;
    return unique[0] as 'expense' | 'income';
  };

  const fetchTransactionsData = async () => {
    setIsLoadingTableData(true);
    try {
      const typeFilter = resolveTypeQueryParam();
      let dateFrom: string | undefined = defaultDateFrom;
      let dateTo: string | undefined = defaultDateTo;
      const dateFilter = filteredInfo.date;
      if (dateFilter && Array.isArray(dateFilter) && dateFilter[0] != null) {
        try {
          const range = JSON.parse(String(dateFilter[0])) as [string, string];
          dateFrom = range[0];
          dateTo = range[1];
        } catch {
          // ignore
        }
      }
      const rawCategory = filteredInfo.category;
      const categoryIds =
        rawCategory == null
          ? []
          : Array.isArray(rawCategory)
            ? [...new Set(rawCategory.map(String).filter((id) => id.length > 0))]
            : [String(rawCategory)].filter((id) => id.length > 0);

      const searchFilter = filteredInfo.description ? String(filteredInfo.description[0]) : '';

      const res = await transactionsApiService.getTransactions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(typeFilter ? { type: typeFilter as 'expense' | 'income' } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(categoryIds.length > 0 ? { categoryId: categoryIds.join(',') } : {}),
        ...(searchFilter ? { search: searchFilter } : {}),
      });

      const rows = res.data.map(transactionItemToDataType);
      setTableData(rows);
      setTotalCount(res.total);
      onDataChange?.(rows);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoadingTableData(false);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, [tableKey, refreshTrigger, pagination.current, pagination.pageSize, filteredInfo, defaultDateFrom, defaultDateTo]);

  const onTableChange: TableProps<DataType>['onChange'] = (paginationInfo, filters) => {
    setFilteredInfo(filters ?? {});
    if (paginationInfo) {
      setPagination({
        current: paginationInfo.current || 1,
        pageSize: showSizeChanger ? (paginationInfo.pageSize || pageSize) : pageSize,
      });
    } else if (filters != null && Object.keys(filters).length > 0) {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div className="flex justify-between gap-2">
          <Button
            type="link"
            onClick={() => {
              clearFilters && handleReset(clearFilters);
              handleSearch([], confirm, dataIndex);
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    filterDropdownProps: {
      onOpenChange(open: boolean) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleDeleteTransaction = async (record: DataType) => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(record);
      } else {
        if (record.type === 'expense') {
          await expensesApiService.deleteExpense(record.key);
        } else if (record.type === 'income') {
          await incomesApiService.deleteIncome(record.key);
        }
      }
      handleNotification('success', 'Transaction deleted successfully.');
      setTableKey((prev) => prev + 1);
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      handleNotification('error', 'Failed to delete transaction.');
    } finally {
      setOpenPopconfirmFor('');
      setIsDeleting(false);
    }
  };

  const columns: TableProps<DataType>['columns'] = useMemo(() => {
    const baseColumns: TableProps<DataType>['columns'] = [
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        sorter: (a, b) => (a.type.localeCompare(b.type) ?? 0),
        filters: [
          { text: 'Income', value: 'income' },
          { text: 'Expense', value: 'expense' },
        ],
        filteredValue: filteredInfo.type || null,
        onFilter: (value, record) => record.type === value,
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        sorter: (a, b) => a.amount - b.amount,
        render: (amount: number, record: DataType) => {
          const formattedAmount = amount.toFixed(2).replace('.', ',');
          if (record.type === 'income') {
            return <span style={{ color: 'green' }}>+ {currencySymbol}{formattedAmount}</span>;
          } else {
            return <span style={{ color: 'red' }}>- {currencySymbol}{formattedAmount}</span>;
          }
        },
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        width: 300,
        sorter: (a, b) => (a.description?.localeCompare(b.description ?? '') ?? 0),
        sortDirections: ['descend', 'ascend'],
        ...getColumnSearchProps('description'),
        filteredValue: filteredInfo.description || null,
        render: (text: string | undefined) => {
          const fullText = text ?? '';
          const t = truncate(fullText, 50);
          const content =
            searchedColumn === 'description' ? (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={t}
              />
            ) : (
              t
            );

          return (
            <Tooltip title={fullText} placement="top">
              <span>{content}</span>
            </Tooltip>
          );
        },
      },
      {
        title: 'Category',
        key: 'category',
        dataIndex: 'category',
        width: 250,
        sorter: (a, b) => {
          const aName = a.category.length > 0 ? a.category[0].name : '';
          const bName = b.category.length > 0 ? b.category[0].name : '';
          return aName.localeCompare(bName);
        },
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
          const currentKeys = Array.isArray(selectedKeys) ? selectedKeys : selectedKeys ? [selectedKeys] : [];
          const toggleKey = (value: string) => {
            const next = currentKeys.includes(value)
              ? currentKeys.filter((k) => k !== value)
              : [...currentKeys, value];
            setSelectedKeys(next);
          };
          const typeFilterRaw = filteredInfo.type;
          const selectedTypes: string[] =
            typeFilterRaw == null
              ? []
              : Array.isArray(typeFilterRaw)
                ? typeFilterRaw.map(String)
                : [String(typeFilterRaw)];
          const showIncomeCategories = selectedTypes.length === 0 || selectedTypes.includes('income');
          const showExpenseCategories = selectedTypes.length === 0 || selectedTypes.includes('expense');
          return (
            <div style={{ padding: 8, minWidth: 220 }} onKeyDown={(e) => e.stopPropagation()}>
              {showIncomeCategories && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>Incomes</div>
                  {incomeCategoryFilters.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>No income category</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {incomeCategoryFilters.map((opt) => (
                        <Checkbox
                          key={opt.value}
                          checked={currentKeys.includes(opt.value)}
                          onChange={() => toggleKey(opt.value)}
                        >
                          {opt.text}
                        </Checkbox>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {showExpenseCategories && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>Expenses</div>
                  {expenseCategoryFilters.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>No expense category</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {expenseCategoryFilters.map((opt) => (
                        <Checkbox
                          key={opt.value}
                          checked={currentKeys.includes(opt.value)}
                          onChange={() => toggleKey(opt.value)}
                        >
                          {opt.text}
                        </Checkbox>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between gap-2">
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    clearFilters?.();
                    confirm();
                    close?.();
                  }}
                  style={{ width: 90 }}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    confirm();
                    close?.();
                  }}
                  style={{ width: 90 }}
                >
                  OK
                </Button>
              </div>
            </div>
          );
        },
        filteredValue: filteredInfo.category || null,
        onFilter: (value, record) =>
          (record.category.length > 0 && record.category.map((item) => item.id).includes(value as string)) ?? false,
        render: (_, record) => {
          const { category, subcategory } = record;
          return (
            <>
              {category.length > 0 ? (
                category.map((tag, index) => {
                  const color = tag.color_hex || '#ca6510';
                  const subcat = subcategory[index];
                  return (
                    <div key={`${tag.id}-${subcat?.id || index}`} className="container-tags inline-flex items-center">
                      <Tag
                        className={`m-0 tag-category ${subcat ? 'has-subcategory' : ''}`}
                        style={{
                          backgroundColor: color,
                          borderColor: color,
                          color: '#ffffff',
                          borderRadius: subcat ? '4px 0 0 4px' : '4px',
                          margin: 0,
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          fontSize: '12px',
                          lineHeight: '20px',
                        }}
                        bordered={false}
                      >
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>
                          {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                        </span>
                      </Tag>
                      {subcat && (
                        <Tag
                          key={subcat.id}
                          className="m-0 tag-subcategory"
                          style={{
                            backgroundColor: '#ffffff',
                            borderColor: color,
                            borderLeft: 'none',
                            color: color,
                            borderRadius: '0 4px 4px 0',
                            margin: 0,
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            fontSize: '12px',
                            lineHeight: '20px',
                          }}
                          bordered={true}
                        >
                          <span style={{ color: color, fontWeight: 400 }}>
                            {subcat.name.charAt(0).toUpperCase() + subcat.name.slice(1)}
                          </span>
                        </Tag>
                      )}
                    </div>
                  );
                })
              ) : (
                <AddCategoryCell
                  record={record}
                  onCategoryUpdated={() => {
                    setTableKey((prev) => prev + 1);
                    onTransactionUpdated?.();
                  }}
                  onOpenNotification={onOpenNotification}
                />
              )}
            </>
          );
        },
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 180,
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.dateRaw.localeCompare(b.dateRaw),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          let range: [string, string] | undefined;
          try {
            const raw = selectedKeys[0];
            range = raw ? JSON.parse(String(raw)) : undefined;
          } catch {
            range = undefined;
          }
          return (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
              <DatePicker.RangePicker
                value={range ? [dayjs(range[0]), dayjs(range[1])] : undefined}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setSelectedKeys([JSON.stringify([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])]);
                  } else {
                    setSelectedKeys([]);
                  }
                }}
                style={{ marginBottom: 8, width: '100%' }}
                allowClear
              />
              <div className="flex justify-between gap-2">
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    clearFilters?.();
                    confirm();
                  }}
                  style={{ width: 90 }}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    confirm();
                  }}
                  style={{ width: 90 }}
                >
                  OK
                </Button>
              </div>
            </div>
          );
        },
        filterIcon: (filtered: boolean) => (
          <CalendarOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
        filteredValue: filteredInfo.date || null,
        onFilter: (value, record) => {
          const [start, end] = JSON.parse(String(value)) as [string, string];
          return record.dateRaw >= start && record.dateRaw <= end;
        },
      },
    ];

    if (showActions) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        dataIndex: 'actions',
        width: 120,
        render: (_, record) => (
          <div className="actions-container">
            <Button icon={<EditOutlined />} onClick={() => onEdit?.(record)} />
            <Popconfirm
              title="Are you sure?"
              open={openPopconfirmFor === record.key}
              onConfirm={() => handleDeleteTransaction(record)}
              onCancel={() => setOpenPopconfirmFor('')}
              icon={null}
              okButtonProps={{ loading: isDeleting, iconPosition: 'end' }}
            >
              <Button icon={<DeleteOutlined />} onClick={() => setOpenPopconfirmFor(record.key)} />
            </Popconfirm>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [
    showActions,
    filteredInfo,
    searchedColumn,
    searchText,
    expenseCategoryFilters,
    incomeCategoryFilters,
    openPopconfirmFor,
    isDeleting,
    onEdit,
  ]);

  const defaultScroll = useMemo(() => {
    if (scroll) return scroll;
    return showActions ? { x: 1000 } : { x: 800 };
  }, [scroll, showActions]);

  return (
    <Table<DataType>
      columns={columns}
      dataSource={tableData}
      key={tableKey}
      onChange={onTableChange}
      rowSelection={rowSelection}
      loading={
        isLoadingTableData
          ? { indicator: <LoadingOutlined spin style={{ fontSize: 32 }} /> }
          : false
      }
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: totalCount,
        pageSizeOptions: showSizeChanger ? ['10', '20', '30'] : undefined,
        showSizeChanger: showSizeChanger,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      showSorterTooltip={{ target: 'sorter-icon' }}
      bordered
      size="small"
      scroll={defaultScroll}
      className={className || 'rounded-lg overflow-hidden'}
    />
  );
}
