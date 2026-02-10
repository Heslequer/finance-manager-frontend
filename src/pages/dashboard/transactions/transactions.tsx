import './transactions.scss';
import { IncomesService } from '../../../services/supabase/incomes/incomes.service';
import { ExpensesService } from '../../../services/supabase/expenses/expenses.service';
import { CategoriesService } from '../../../services/supabase/categories/categories.service';
import { SubcategoriesService } from '../../../services/supabase/subcategories/subcategories.service';
import type { Category } from '../../../services/supabase/categories/categories.interface';
import { useState, useEffect, useRef } from 'react';
import NewexpenseModal from '../../../components/newExpanseModal/newExpenseModal';
import ImportOfxModal from '../../../components/importOfxModal/ImportOfxModal';
const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();
import { Button, Layout, Space, Table, Tag, Popconfirm, Tooltip, Drawer, Divider } from 'antd';
import Select, { type StylesConfig } from 'react-select';
import type { InputRef, TableColumnType, TableProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../../components/sidebar/sidebar';
const expensesService = new ExpensesService();
const incomesService = new IncomesService();
import { useNavigate } from 'react-router-dom';
import type { Subcategory } from '../../../services/supabase/subcategories/subcategories.interface';
import { CloseOutlined, DeleteOutlined, EditOutlined, LoadingOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

import type { FilterDropdownProps } from 'antd/es/table/interface';

import { Input } from 'antd';
import { truncate } from '../../../utils/truncate';

import { colourStyles } from '../../../components/newExpanseModal/newExpenseModal';
import { type ColourOption } from '../../../components/newExpanseModal/docs/data';


export interface DataType {
  key: string;
  type: string;
  amount: number;
  category: Category[];
  subcategory: Subcategory[];
  date: string;
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
  const [category, setCategory] = useState<ColourOption | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);

  const currencySymbol = 'R$';

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
    const handleFilter = (data: DataType[]) => {
    const filters: {text: string, value: string}[] = [];
    for(const item of data){
      if(item.category.length > 0 && item.category[0]){
        filters.push({text: item.category[0].name, value: item.category[0].id ?? ""});
      }
    }
    const uniqueFilters = Array.from(new Map(filters.map(item => [item.value, item])).values())
    return uniqueFilters;
  }

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
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button> */}
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
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
    const subcategories = await subcategoriesService.getSubcategoryByCategoryId(colourOptionSelected.value);
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
    const cats = await categoriesService.getCategoriesByType(type);
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
            await expensesService.deleteExpense(record.key);
            await delay(500);
          } else if (record.type === 'income') {
            await incomesService.deleteIncome(record.key);
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
            await expensesService.updateExpenseCategory(
              record.key,
              categorySelected.value,
              subcategorySelected?.value ?? null
            );
          } else if (record.type === 'income') {
            await incomesService.updateIncomeCategory(
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
        await expensesService.updateExpenseCategory(
          record.key,
          categorySelected.value,
          subcategorySelected?.value ?? null
        );
      } else {
        await incomesService.updateIncomeCategory(
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
      filters: handleFilter(data),
      filteredValue: filteredInfo.category || null,
      onFilter:(value, record) => (record.category.length > 0 && record.category.map(item => item.id).includes(value as string)) ?? false,
      
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
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
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
        await expensesService.deleteExpense(record.key);
        await delay(500);
      }
      if(record.type === "income"){
        await incomesService.deleteIncome(record.key);
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

  const fetchData = async (userId: string) => {
    // const rows: DataType[] = [];
    setIsLoadingData(true);
    const expenses = await expensesService.getAllExpensesByUserId(userId);
    const incomes = await incomesService.getAllIncomesByUserId(userId);
    const expenseRows = await Promise.all(
      expenses.map(async (expense) => {
        let category: Category | null = null;
        let subcategory: Subcategory | null = null;
        
        if (expense.category_id) {
          category = await categoriesService.getCategoryById(expense.category_id);
        }
        if (expense.subcategory_id) {
          subcategory = await subcategoriesService.getSubcategoryById(expense.subcategory_id);
        }
  
        return {
          key: String(expense.id),
          type: "expense",
          amount: Number(expense.amount),
          description: expense.description,
          category: category ? [category] : [],
          date: new Date(expense.date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          subcategory: subcategory ? [subcategory] : [],
        } as DataType;
      })
    );
    const incomeRows = await Promise.all(
      incomes.map(async (income) => {
        let category: Category | null = null;
        let subcategory: Subcategory | null = null;
        
        if (income.category_id) {
          category = await categoriesService.getCategoryById(income.category_id);
        }
        if (income.subcategory_id) {
          subcategory = await subcategoriesService.getSubcategoryById(income.subcategory_id);
        }
  
        return {
          key: String(income.id),
          type: "income",
          amount: Number(income.amount),
          description: income.description,
          category: category ? [category] : [],
          date: new Date(income.date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          subcategory: subcategory ? [subcategory] : [],
        } as DataType;
      })
    );

    const allRows = [...expenseRows, ...incomeRows];
    setData(allRows);
    setIsLoadingData(false);
  }

  useEffect(() => {
    // setData([]);
    fetchData("50baa1d0-57aa-4eff-932f-228e773784eb");
  }, [tableKey]);

  // const showDrawer = () => {
  //   setOpenTransactionDrawer(true);
  // };
  
  // const onClose = () => {
  //   setOpenTransactionDrawer(false);
  // };
  // const handleEdit = (record: DataType) => {
  //   if(record.type === "expense"){
  //     setAddTransaction(true);
  //   }
  //   console.log(record);
  // }

  const onChange: TableProps<DataType>['onChange'] = (paginationInfo, filters) => {
    console.log('params', filters);
    setFilteredInfo(filters);
    if (paginationInfo) {
      setPagination({
        current: paginationInfo.current || 1,
        pageSize: paginationInfo.pageSize || 10,
      });
    }
    // setSortedInfo(sorter as Sorts);
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
                  {/* {income && (
                      <NewIncomeModal onClose={() => setIncome(null)} income={income} />
                  )} */}
                  {/* {open && (
                      <NewexpenseModal onClose={() => setOpen(false)}/>
                  )} */}
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


                          <div className= 'flex'>

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