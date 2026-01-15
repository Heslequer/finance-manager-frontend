import './transactions.scss';
import NewTransaction from './newTransaction/newTransaction'
import { IncomesService } from '../../../services/supabase/incomes/incomes.service';
import type { Income } from '../../../services/supabase/incomes/incomes.interface';
import { ExpensesService } from '../../../services/supabase/expenses/expenses.service';
import { CategoriesService } from '../../../services/supabase/categories/categories.service';
import { SubcategoriesService } from '../../../services/supabase/subcategories/subcategories.service';
import type { Category } from '../../../services/supabase/categories/categories.interface';
import type { Expense } from '../../../services/supabase/expenses/expenses.interface';
import { useState, useEffect, useRef } from 'react';
import NewexpenseModal from '../../../components/newExpanseModal/newExpenseModal';
const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();
import { Button, Layout, Space, Table, Tag, Drawer, ConfigProvider, Popconfirm } from 'antd';
import type { InputRef, TableColumnType, TableProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../../components/sidebar/sidebar';
const expensesService = new ExpensesService();
const incomesService = new IncomesService();
import { useNavigate } from 'react-router-dom';
import type { Subcategory } from '../../../services/supabase/subcategories/subcategories.interface';
import { DeleteOutlined, EditOutlined, LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

import type { FilterDropdownProps } from 'antd/es/table/interface';

import { Input } from 'antd';
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
  const [expense, setexpense] = useState<Expense | null>(null);
  const [income, setIncome] = useState<Income | null>(null);
  const [addTransaction, setAddTransaction] = useState<boolean>(false);
  const [openTransactionDrawer, setOpenTransactionDrawer] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [transactionToEdit, setTransactionToEdit] = useState<DataType | null>(null);
  const [openPopconfirmFor, setOpenPopconfirmFor] = useState<string>("");
  const [tableKey, setTableKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter);
    setFilteredInfo(filters);
    // setSortedInfo(sorter as Sorts);
  };
  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };
    const handleFilter = (data: DataType[]) => {
    const filters: {text: string, value: string}[] = [];
    for(const item of data){
      filters.push({text: item.category[0].name, value: item.category[0].id ?? ""});
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

    const columns: TableProps<DataType>['columns'] = [
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        sorter: (a, b) => (a.type.localeCompare(b.type) ?? 0),  
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        sorter: (a, b) => a.amount - b.amount,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        sorter: (a, b) => (a.description?.localeCompare(b.description ?? "") ?? 0),
        sortDirections: ['descend', 'ascend'],
        ...getColumnSearchProps('description'),
        filteredValue: filteredInfo.description || null,
      },
      {
  
        title: 'Category',
        key: 'category',
        dataIndex: 'category',
        sorter: (a, b) => (a.category[0].name.localeCompare(b.category[0].name) ?? 0),
        filters: handleFilter(data),
        // filters: [
        //   { text: 'Skjsjddans', value: '8c5954ed-be7c-44c1-bbfc-b67be79e156f' },
        //   { text: 'Test', value: 'Test' },
        // ],
        filteredValue: filteredInfo.category || null,
        onFilter:(value, record) => record.category.map(item => item.id).includes(value as string) ?? false,
        
        render: (_, { category, subcategory }) => (
          <>
            {category.map((tag, index) => {
              let color = tag.color_hex
              return (
                <div key={`${tag.id}-${subcategory[index].id}`} className='container-tags'>
                  <Tag className=" m-0 tag-category" color={color} key={tag.id} bordered={true}>
                    <p className='font-weight-600 p4'>
                      {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                    </p>
                  </Tag>
                  <Tag key={subcategory[index].id} style={{color: `${color}` , borderColor: `${color}`, transform: `translateX(-4px)`}} className='tag-subcategory'> 
                    <p className='font-weight-300 p5'>
                      {subcategory[index].name.charAt(0).toUpperCase() + subcategory[index].name.slice(1)}
                    </p>
                  </Tag>
                </div>
              );
            })}
          </>
        ),
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        defaultSortOrder: 'descend',
        sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      },
      {
        title: 'Actions',
        key: 'actions',
        dataIndex: 'actions',
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
          const category = await categoriesService.getCategoryById(expense.category_id);
          const subcategory = await subcategoriesService.getSubcategoryById(expense.subcategory_id);
    
          return {
            key: String(expense.id),
            type: "expense",
            amount: Number(expense.amount),
            description: expense.description,
            category: [category],
            date: new Date(expense.date).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            subcategory: [subcategory],
          } as DataType;
        })
      );
      const incomeRows = await Promise.all(
        incomes.map(async (income) => {
          const category = await categoriesService.getCategoryById(income.category_id);
          const subcategory = await subcategoriesService.getSubcategoryById(income.subcategory_id);
    
          return {
            key: String(income.id),
            type: "income",
            amount: Number(income.amount),
            description: income.description,
            category: [category],
            date: new Date(income.date).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            subcategory: [subcategory],
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

    const onChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter, extra) => {
      console.log('params', filters);
      setFilteredInfo(filters);
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
                    {/* {income && (
                        <NewIncomeModal onClose={() => setIncome(null)} income={income} />
                    )} */}
                    {/* {open && (
                        <NewexpenseModal onClose={() => setOpen(false)}/>
                    )} */}
                    <div className="grid-accurate-18 main-container flex-column p-5">
                        <div className="header flex">
                            <h4 className='font-weight-500'>Recent Transactions</h4>
                            <Button type="primary" onClick={() => {setOpenTransactionDrawer(!openTransactionDrawer); setTransactionToEdit(null)}}>Add Transaction</Button>
                        </div>

                        <div className='transactions-container flex-column mt-4'>
                            <Table<DataType> columns={columns} dataSource={data} key={tableKey} loading={isLoadingData} onChange={onChange}
                              showSorterTooltip={{ target: 'sorter-icon' }} bordered 
                            />
                            <div className="transactions-body flex">

                            </div>
                        </div>
                    </div>
                  </Content>
                </Layout>
            </Layout>
        </>
    )
}