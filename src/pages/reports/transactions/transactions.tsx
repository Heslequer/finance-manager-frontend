import './transactions.scss';
import { incomesApiService } from '../../../services/api/incomes/incomes.api';
import { expensesApiService } from '../../../services/api/expenses/expenses.api';
import { categoriesApiService } from '../../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../../services/api/subcategories/subcategories.api';
import { useState, useEffect } from 'react';
import NewexpenseModal from '../../../components/newExpanseModal/newTransactionModal';
import ImportOfxModal from '../../../components/importOfxModal/ImportOfxModal';
import { Button, Layout, Popconfirm, Drawer } from 'antd';
import Select, { type StylesConfig } from 'react-select';
import type { TableProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';

import { colourStyles } from '../../../components/newExpanseModal/newTransactionModal';
import { type ColourOption } from '../../../components/newExpanseModal/docs/data';
import TransactionsTable, { type DataType } from '../../../components/transactionsTable/transactionsTable';

export type { DataType };

type ModalProps = {
  onOpenNotification: (type: string, message: string, description?: string) => any;
};

export default function Transactions({ onOpenNotification }: ModalProps) {
  const [openTransactionDrawer, setOpenTransactionDrawer] = useState<boolean>(false);
  const [importOfxOpen, setImportOfxOpen] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [transactionToEdit, setTransactionToEdit] = useState<DataType | null>(null);
  const [tableKey, setTableKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplyingBulkCategory, setIsApplyingBulkCategory] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [areSelectsDisabled, setAreSelectsDisabled] = useState(false);
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const navigate = useNavigate();

  const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
  const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
  const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);

  const drawerSelectStyles: StylesConfig<ColourOption> = {
    ...colourStyles,
    menuPortal: (base) => ({ ...base, zIndex: 1001 }),
    menu: (base) => ({ ...base, zIndex: 1001 }),
  };

  const onCategoryChange = async (colourOptionSelected: ColourOption) => {
    setCategorySelected(colourOptionSelected);
    setSubcategorySelected(null);
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

  const onSubcategoryChange = async (colourOptionSelected: ColourOption) => {
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

  // Effect to check transaction types and load categories for bulk actions
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
      const transactionType = Array.from(types)[0];
      setAreSelectsDisabled(false);
      loadCategoriesForType(transactionType);
    } else {
      setAreSelectsDisabled(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setSubcategoryOptions([]);
      setColourOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowKeys, data]);

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar
          onOpenDashboardPage={() => navigate('/')}
          onOpenCategoriesPage={() => navigate('/categories')}
        />
        <Layout>
          <Content>
            {openTransactionDrawer && (
              <NewexpenseModal
                onClose={() => setOpenTransactionDrawer(false)}
                uptadeTransactions={() => setTableKey((prev) => prev + 1)}
                transactionToEdit={transactionToEdit}
                onOpenNotification={(type: string, message: string, description?: string) =>
                  onOpenNotification(type, message, description)
                }
                origin="transactions"
              />
            )}
            <ImportOfxModal
              open={importOfxOpen}
              onClose={() => setImportOfxOpen(false)}
              onSuccess={() => setTableKey((prev) => prev + 1)}
              onOpenNotification={onOpenNotification}
            />

            <div className="grid-accurate-18 main-container flex-column p-5">
              <div className="header flex">
                <div className="flex-column">
                  <h5 className="text-midnight-navy !text-3xl !font-semibold">All Transactions</h5>
                  <p className="text-steel-blue font-medium">View and manage all your transactions in one place</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="!rounded-xl !py-5 !text-base"
                    icon={<UploadOutlined className="!text-lg" />}
                    onClick={() => setImportOfxOpen(true)}
                  >
                    Import
                  </Button>
                  <Button
                    className="!rounded-xl !py-5 !text-base"
                    type="primary"
                    onClick={() => {
                      setOpenTransactionDrawer(!openTransactionDrawer);
                      setTransactionToEdit(null);
                    }}
                  >
                    Add Transaction
                  </Button>
                </div>
              </div>

              <div className="transactions-container flex-column mt-4">
                <TransactionsTable
                  pageSize={10}
                  showActions={true}
                  rowSelection={rowSelection}
                  refreshTrigger={tableKey}
                  onDataChange={setData}
                  onEdit={(record) => {
                    setOpenTransactionDrawer(true);
                    setTransactionToEdit(record);
                  }}
                  onOpenNotification={onOpenNotification}
                  onTransactionUpdated={() => setTableKey((prev) => prev + 1)}
                />
                <div className="transactions-body flex" />
              </div>

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
                <div className="flex flex-column gap-2 h-full justify-between py-2">
                  <div className="flex-column gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-normal text-red">
                        Selected: {selectedRowKeys.length} transaction{selectedRowKeys.length > 1 ? 's' : ''}
                      </span>
                      <Popconfirm
                        title="Are you sure?"
                        onConfirm={handleBulkDelete}
                        okText="Yes"
                        cancelText="No"
                        icon={null}
                        okButtonProps={{ loading: isDeleting, iconPosition: 'end' }}
                        placement="bottom"
                      >
                        <Button danger loading={isDeleting} icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                    <div className="flex-column gap-1">
                      <label htmlFor="bulk-category" className="font-weight-500 py-1">
                        Category
                      </label>
                      <Select<ColourOption, false>
                        id="bulk-category"
                        value={categorySelected}
                        options={colourOptions}
                        styles={drawerSelectStyles}
                        placeholder="Select a category"
                        onChange={(e) => void onCategoryChange(e as ColourOption)}
                        isSearchable={false}
                        menuPlacement="bottom"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isDisabled={areSelectsDisabled}
                      />
                    </div>
                    <div className="flex-column gap-1">
                      <label htmlFor="bulk-subcategory" className="font-weight-500 py-1">
                        Subcategory
                      </label>
                      <Select<ColourOption, false>
                        id="bulk-subcategory"
                        value={subcategorySelected}
                        options={subcategoryOptions}
                        styles={drawerSelectStyles}
                        placeholder="Select a subcategory"
                        onChange={(e) => void onSubcategoryChange(e as ColourOption)}
                        menuPlacement="bottom"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isDisabled={areSelectsDisabled}
                      />
                    </div>
                  </div>
                  <div className="flex flex-column">
                    <Button
                      type="primary"
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
        </Layout>
      </Layout>
    </>
  );
}