import './transactions.scss';
import { incomesApiService } from '../../../services/api/incomes/incomes.api';
import { expensesApiService } from '../../../services/api/expenses/expenses.api';
import { categoriesApiService } from '../../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../../services/api/subcategories/subcategories.api';
import { transactionsApiService } from '../../../services/api/transactions/transactions.api';
import type { TransactionItem } from '../../../services/api/transactions/transactions.api';
import type { Category } from '../../../types/category.interface';
import { useState, useEffect, useRef } from 'react';
import NewexpenseModal from '../../../components/newExpanseModal/newExpenseModal';
import ImportOfxModal from '../../../components/importOfxModal/ImportOfxModal';
import { Button, Checkbox, DatePicker, Layout, Space, Table, Tag, Popconfirm, Tooltip, Drawer, Divider } from 'antd';
import Select, { type StylesConfig } from 'react-select';
import type { InputRef, TableColumnType, TableProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import type { Subcategory } from '../../../types/subcategory.interface';
import { CalendarOutlined, CloseOutlined, DeleteOutlined, EditOutlined, LoadingOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

import type { FilterDropdownProps } from 'antd/es/table/interface';

import { Input } from 'antd';
import { truncate } from '../../../utils/truncate';

import { colourStyles } from '../../../components/newExpanseModal/newExpenseModal';
import dayjs from 'dayjs';
import { type ColourOption } from '../../../components/newExpanseModal/docs/data';


export interface DataType {
  key: string;
  type: string;
  amount: number;
  category: Category[];
  subcategory: Subcategory[];
  date: string;
  dateRaw: string;
  description: string | undefined;
}
type ModalProps = {
  onOpenNotification: (type: string, message: string, description?: string) => any;
  // notificationData: {
  //   type: 'success' | 'info' | 'warning' | 'error';
  //   message: string;
  //   description?: string;
  // }
};
type DataIndex = keyof DataType;
type OnChange = NonNullable<TableProps<DataType>['onChange']>;
type Filters = Parameters<OnChange>[1];


export default function Transactions( {onOpenNotification}: ModalProps) {
  const [openTransactionDrawer, setOpenTransactionDrawer] = useState<boolean>(false);
  const [importOfxOpen, setImportOfxOpen] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [transactionToEdit, setTransactionToEdit] = useState<DataType | null>(null);
  const [openPopconfirmFor, setOpenPopconfirmFor] = useState<string>("");
  const [tableKey, setTableKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isApplyingBulkCategory, setIsApplyingBulkCategory] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [totalCount, setTotalCount] = useState(0);
  const [areSelectsDisabled, setAreSelectsDisabled] = useState(false);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});

  const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
  const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
  const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
  const [_category, setCategory] = useState<ColourOption | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);
  const [expenseCategoryFilters, setExpenseCategoryFilters] = useState<{ text: string; value: string }[]>([]);
  const [incomeCategoryFilters, setIncomeCategoryFilters] = useState<{ text: string; value: string }[]>([]);

  const currencySymbol = 'R$';

  useEffect(() => {
    const loadAllCategoriesForFilter = async () => {
      try {
        const [expenseCategories, incomeCategories] = await Promise.all([
          categoriesApiService.getCategoriesByType('expense'),
          categoriesApiService.getCategoriesByType('income'),
        ]);
        setExpenseCategoryFilters(
          expenseCategories.map((c) => ({ text: c.name.charAt(0).toUpperCase() + c.name.slice(1), value: c.id ?? '' })),
        );
        setIncomeCategoryFilters(
          incomeCategories.map((c) => ({ text: c.name.charAt(0).toUpperCase() + c.name.slice(1), value: c.id ?? '' })),
        );
      } catch {
        setExpenseCategoryFilters([]);
        setIncomeCategoryFilters([]);
      }
    };
    loadAllCategoriesForFilter();
  }, []);

  const drawerSelectStyles: StylesConfig<ColourOption> = {
    ...colourStyles,
    menuPortal: (base) => ({ ...base, zIndex: 1001 }),
    menu: (base) => ({ ...base, zIndex: 1001 }),
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
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
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <div className="flex-space-between gap-2">
          <Button
            type="link"
            onClick={() => { clearFilters && handleReset(clearFilters); close(); }}
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
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes((value as string).toLowerCase()) ?? false
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
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

  const onCategoryChange = async(colourOptionSelected: ColourOption) => {
    setCategorySelected(colourOptionSelected);
    setSubcategorySelected(null);
    setCategory(colourOptionSelected);
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
  }

  const onSubcategoryChange = async(colourOptionSelected: ColourOption) => {
    setSubcategorySelected(colourOptionSelected);
  }

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

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setIsDeleting(true);
    try {
      const recordsToDelete = data.filter((d) => selectedRowKeys.includes(d.key));
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
      setTableKey((prev) => prev + 1);
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
      const recordsToUpdate = data.filter((d) => selectedRowKeys.includes(d.key));
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
      setTableKey((prev) => prev + 1);
    } catch (e) {
      onOpenNotification('error', 'Failed to apply category', e instanceof Error ? e.message : String(e));
    } finally {
      setIsApplyingBulkCategory(false);
    }
  };

  const rowSelection: TableProps<DataType>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys as string[]);
    },
  };

  // Effect to check transaction types and load categories
  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      setAreSelectsDisabled(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
      setColourOptions([]);
      return;
    }

    const selectedRecords = data.filter((d) => selectedRowKeys.includes(d.key));
    const types = new Set(selectedRecords.map((r) => r.type));
    
    if (types.size === 1) {
      // All transactions are of the same type
      const transactionType = Array.from(types)[0];
      setAreSelectsDisabled(false);
      loadCategoriesForType(transactionType);
    } else {
      // Mixed types
      setAreSelectsDisabled(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
      setColourOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowKeys, data]);

  const addCategoryPopoverContent = (
    <div className="flex-column p-1">
      <div className="w-100 mr-1 mb-1">
        <label htmlFor="category" className="py-1">Category</label>
      </div>
      <Select
        value={categorySelected}
        options={colourOptions}
        styles={colourStyles}
        placeholder="Select a subcategory"
        onChange={(e) => onCategoryChange(e as ColourOption)}
        isSearchable={false}
      />
      <div className="w-100 my-1">
        <label htmlFor="subcategory" className="py-1">Subcategory</label>
      </div>
      <Select
        value={subcategorySelected}
        options={subcategoryOptions}
        styles={colourStyles}
        placeholder="Select a subcategory"
        onChange={(e) => onSubcategoryChange(e as ColourOption)}
      />
    </div>
  );

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
      setTableKey((prev) => prev + 1);
    } catch (e) {
      onOpenNotification('error', 'Failed to update category', e instanceof Error ? e.message : String(e));
    }finally{
      setIsUpdatingCategory(false);
    }
  };

  const columns: TableProps<DataType>['columns'] = [
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
      sorter: (a, b) => (a.description?.localeCompare(b.description ?? "") ?? 0),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
        const currentKeys = Array.isArray(selectedKeys) ? selectedKeys : selectedKeys ? [selectedKeys] : [];
        const toggleKey = (value: string) => {
          const next = currentKeys.includes(value)
            ? currentKeys.filter((k) => k !== value)
            : [...currentKeys, value];
          setSelectedKeys(next);
        };
        return (
          <div style={{ padding: 8, minWidth: 220 }} onKeyDown={(e) => e.stopPropagation()}>
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

            <div className="flex-space-between gap-2">
              <Button type="link" size="small" onClick={() => { clearFilters?.(); confirm(); }} style={{ width: 90 }}>Reset</Button>
              <Button type="primary" size="small" onClick={() => { confirm(); close(); }} style={{ width: 90 }}>OK</Button>
            </div>
          </div>
        );
      },
      filteredValue: filteredInfo.category || null,
      onFilter: (value, record) => (record.category.length > 0 && record.category.map((item) => item.id).includes(value as string)) ?? false,
      render: (_, record) => {
        const { category, subcategory } = record;
        return (
          <>
            {category.length > 0 ? (
              category.map((tag, index) => {
                let color = tag.color_hex
                const subcat = subcategory[index];
                return (
                  <div key={`${tag.id}-${subcat?.id || index}`} className='container-tags'>
                    <Tag className=" m-0 tag-category" color={color} key={tag.id} bordered={true}>
                      <p className='font-weight-600 p4'>
                        {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                      </p>
                    </Tag>
                    {subcat && (
                      <Tag key={subcat.id} style={{color: `${color}` , borderColor: `${color}`, transform: `translateX(-4px)`}} className='tag-subcategory'> 
                        <p className='font-weight-300 p5'>
                          {subcat.name.charAt(0).toUpperCase() + subcat.name.slice(1)}
                        </p>
                      </Tag>
                    )}
                  </div>
                );
              })
            ) : (
              <Popconfirm
                title="" 
                description={addCategoryPopoverContent} 
                onOpenChange={(open) => {
                  if (open) loadCategoriesForType(record.type);
                }}
                onConfirm={() => handleAddCategory(record)}
                okButtonProps={{ loading: isUpdatingCategory, iconPosition: "end"}}
                placement="right"
                icon={null}
              >
                <Button icon={<PlusOutlined />}>Add a category</Button>
              </Popconfirm>      
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
            <div className="flex-space-between gap-2">
              <Button
                type="link"
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm();
                  close();
                }}
                style={{ width: 90 }}
              >
                Reset
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => { confirm(); close(); }}
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
    {
      title: 'Actions',
      key: 'actions',
      dataIndex: 'actions',
      width: 120,
      render: (_, record) => (
        <div className='actions-container'>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure?"
            open={openPopconfirmFor === record.key}
            onConfirm={() => handleDeleteTransaction(record)}
            onCancel={() => setOpenPopconfirmFor("")}
            icon={null}
            okButtonProps={{ loading: isDeleting, iconPosition: "end"}}
          >
            <Button icon={<DeleteOutlined /> } onClick={() => setOpenPopconfirmFor(record.key)} />
          </Popconfirm>
        </div>
      )
    }
  ];
  
  const handleEdit = (record: DataType) => {
    setOpenTransactionDrawer(true);
    setTransactionToEdit(record);
  }
  const handleDeleteTransaction = async (record: DataType) => {
    setIsDeleting(true);
    try{
      if(record.type === "expense"){
        await expensesApiService.deleteExpense(record.key);
        await delay(500);
      }
      if(record.type === "income"){
        await incomesApiService.deleteIncome(record.key);
      }
    }catch(err){
      console.error("Error deleting transaction:", err);
    }finally{
      setTableKey(prev => prev + 1);
      setOpenPopconfirmFor("");
      setIsDeleting(false);
    }
  }
  // const data: DataType[]  = []

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
      date: new Date(item.date ?? '').toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      dateRaw,
    };
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const typeFilter = Array.isArray(filteredInfo.type) ? filteredInfo.type[0] : filteredInfo.type;
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
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
      const categoryFilter = Array.isArray(filteredInfo.category) ? filteredInfo.category[0] : filteredInfo.category;

      const res = await transactionsApiService.getTransactions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(typeFilter ? { type: typeFilter as 'expense' | 'income' } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(categoryFilter ? { categoryId: String(categoryFilter) } : {}),
      });

      const rows = res.data.map(transactionItemToDataType);
      setData(rows);
      setTotalCount(res.total);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableKey, pagination.current, pagination.pageSize, filteredInfo]);

  const onChange: TableProps<DataType>['onChange'] = (paginationInfo, filters) => {
    setFilteredInfo(filters ?? {});
    if (paginationInfo) {
      setPagination({
        current: paginationInfo.current || 1,
        pageSize: paginationInfo.pageSize || 10,
      });
    } else if (filters != null && Object.keys(filters).length > 0) {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };
  return (
      <>
        <Layout style={{ minHeight: "100vh" }}>
            <Sidebar onOpenDashboardPage={() => navigate('/dashboard')} onOpenCategoriesPage={() => navigate('/categories')} />
            <Layout>
              <Content>
                {openTransactionDrawer && (
                    <NewexpenseModal onClose={() => setOpenTransactionDrawer(false)} uptadeTransactions={() =>  setTableKey(prev => prev + 1)} transactionToEdit={transactionToEdit} onOpenNotification={(type: string, message: string, description?: string) => onOpenNotification(type, message, description)} />
                )}
                <ImportOfxModal
                  open={importOfxOpen}
                  onClose={() => setImportOfxOpen(false)}
                  onSuccess={() => setTableKey((prev) => prev + 1)}
                  onOpenNotification={onOpenNotification}
                />
                <div className="grid-accurate-18 main-container flex-column p-5">
                    <div className="header flex">
                        <h4 className='font-weight-500'>Recent Transactions</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button icon={<UploadOutlined />} onClick={() => setImportOfxOpen(true)}>Import</Button>
                          <Button type="primary" onClick={() => {setOpenTransactionDrawer(!openTransactionDrawer); setTransactionToEdit(null)}}>Add Transaction</Button>
                        </div>
                    </div>

                    <div className='transactions-container flex-column mt-4'>
                          <Table<DataType>
                            columns={columns}
                            dataSource={data}
                            key={tableKey}
                            onChange={onChange}
                            rowSelection={rowSelection}
                            loading={isLoadingData ? { indicator: <LoadingOutlined spin style={{ fontSize: 40 }} /> } : false}
                          pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: totalCount,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                          }}
                          showSorterTooltip={{ target: 'sorter-icon' }} bordered 
                        />
                        <div className="transactions-body flex">

                        </div>
                    </div>

                    <Drawer
                      placement="bottom"
                      height={100}
                      closable={false}
                      mask={false}
                      onClose={() => setSelectedRowKeys([])}
                      open={selectedRowKeys.length > 0}
                      className='drawer-element'
                    >
                      <div className='flex-center-row px-auto'>                          
                        <div className="flex-space-between gap-5">
                          <span style={{ color: 'red' }}>
                            You selected {selectedRowKeys.length} line
                            {selectedRowKeys.length > 1 ? 's' : ''}
                          </span>
                            <Divider className='divider' type="vertical"></Divider>
                          <div className="flex gap-3">
                            <label htmlFor="category" className="py-1">Category</label>
                            <Select
                              value={categorySelected}
                              options={colourOptions}
                              styles={drawerSelectStyles}
                              placeholder="Select a category"
                              onChange={(e) => onCategoryChange(e as ColourOption)}
                              isSearchable={false}
                              menuPlacement="top"
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              isDisabled={areSelectsDisabled}
                            />
                          </div>
                          <div className="flex gap-3">
                            <label htmlFor="subcategory" className="py-1">Subcategory</label>
                            <Select
                              value={subcategorySelected}
                              options={subcategoryOptions}
                              styles={drawerSelectStyles}
                              placeholder="Select a subcategory"
                              onChange={(e) => onSubcategoryChange(e as ColourOption)}
                              menuPlacement="top"
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              isDisabled={areSelectsDisabled}
                            />
                          </div>
                          <Button
                            type="primary"
                            onClick={handleBulkApplyCategory}
                            loading={isApplyingBulkCategory}
                            disabled={areSelectsDisabled || !categorySelected?.value}
                          >
                            Apply
                          </Button>
                          <Button
                            onClick={handleBulkDelete}
                            loading={isDeleting}
                            icon={<DeleteOutlined />}
                          >
                          </Button>
                          <CloseOutlined className='close-drawer-icon' onClick={() => setSelectedRowKeys([])} />
                        </div>
                      </div>
                    </Drawer>
                </div>
              </Content>
            </Layout>
        </Layout>
      </>
  )
}