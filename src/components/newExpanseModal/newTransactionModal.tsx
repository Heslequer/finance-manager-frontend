import './newTransactionModal.scss'
import CurrencyInput from 'react-currency-input-field';
import { useState, useEffect, useRef } from 'react';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import React from 'react';
import chroma from 'chroma-js';
import { type ColourOption } from './docs/data';
import { DatePicker, Input, Space, Button, Radio, Upload, Drawer, message, Spin, Select as AntdSelect, Form } from 'antd';
import type { UploadFile } from 'antd';

/** Existing bucket object path, set when receipts are loaded from Storage */
type ReceiptUploadFile = UploadFile & { storagePath?: string };
import { UploadOutlined } from '@ant-design/icons';
import Select, { type StylesConfig } from 'react-select';
import { subcategoriesApiService } from '../../services/api/subcategories/subcategories.api';
import type { DataType } from '../../pages/reports/transactions/transactions';
import dayjs, { Dayjs } from 'dayjs';
import { receiptsService } from '../../services/receipts/receipts.service';
import { supabase } from '../../lib/supabase';
import { creditCardsApiService } from '../../services/api/credit-cards/credit-cards.api';
import type { CreditCard } from '../../types/credit-card.interface';

type ModalProps = {
    onClose: () => void;
    transactionToEdit?: DataType | null;
    uptadeTransactions: () => void;
    onOpenNotification: (type: string, message: string, description?: string) => any;
    origin?: 'credit-cards' | 'transactions';
};

// const colourStyles: StylesConfig<ColourOption, true> = {
//   control: (styles) => ({ ...styles, backgroundColor: 'white' }),
//   option: (styles, { data, isDisabled, isFocused, isSelected }) => {
//     const color = chroma(data.color);
//     return {
//       ...styles,
//       backgroundColor: isDisabled
//         ? undefined
//         : isSelected
//         ? data.color
//         : isFocused
//         ? color.alpha(0.1).css()
//         : undefined,
//       color: isDisabled
//         ? '#ccc'
//         : isSelected
//         ? chroma.contrast(color, 'white') > 2
//           ? 'white'
//           : 'black'
//         : data.color,
//       cursor: isDisabled ? 'not-allowed' : 'default',

//       ':active': {
//         ...styles[':active'],
//         backgroundColor: !isDisabled
//           ? isSelected
//             ? data.color
//             : color.alpha(0.3).css()
//           : undefined,
//       },
//     };
//   },
//   multiValue: (styles, { data }) => {
//     const color = chroma(data.color);
//     return {
//       ...styles,
//       backgroundColor: color.alpha(0.1).css(),
//     };
//   },
//   multiValueLabel: (styles, { data }) => ({
//     ...styles,
//     color: data.color,
//   }),
//   multiValueRemove: (styles, { data }) => ({
//     ...styles,
//     color: data.color,
//     ':hover': {
//       backgroundColor: data.color,
//       color: 'white',
//     },
//   }),
// };

const dot = (color = 'transparent') => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    borderRadius: 10,
    content: '" "',
    display: 'block',
    marginRight: 8,
    height: 10,
    width: 10,
  },
});

export const colourStyles: StylesConfig<ColourOption> = {
  control: (styles) => ({ ...styles, backgroundColor: 'white' }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    const color = chroma(data.color);
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? data.color
        : isFocused
        ? color.alpha(0.1).css()
        : undefined,
      color: isDisabled
        ? '#ccc'
        : isSelected
        ? chroma.contrast(color, 'white') > 2
          ? 'white'
          : 'black'
        : data.color,
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? data.color
            : color.alpha(0.3).css()
          : undefined,
      },
    };
  },
  input: (styles) => ({ ...styles, ...dot() }),
  placeholder: (styles) => ({ ...styles, ...dot('#ccc') }),
  singleValue: (styles, { data }) => ({ ...styles, ...dot(data.color) }),
};


export default function NewTransactionModal({onClose, transactionToEdit, uptadeTransactions, onOpenNotification, origin = 'transactions'}: ModalProps) {
    const [form] = Form.useForm();
    const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);
    const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
    const [type, setType] = useState<string>("expense");
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
    const [receiptFileList, setReceiptFileList] = useState<ReceiptUploadFile[]>([]);

    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    /** Paths loaded when opening edit; used to delete from bucket when user removes items before submit */
    const initialReceiptStoragePathsRef = useRef<string[]>([]);
    const [loadingReceipts, setLoadingReceipts] = useState(false);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
      let cancelled = false;
      const loadExistingReceipts = async () => {
        if (!transactionToEdit?.key) {
          initialReceiptStoragePathsRef.current = [];
          setReceiptFileList([]);
          return;
        }
        setLoadingReceipts(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id || cancelled) return;
          const items = await receiptsService.listReceiptsWithSignedUrls(user.id, transactionToEdit.key);
          if (cancelled) return;
          initialReceiptStoragePathsRef.current = items.map((item) => item.path);
          setReceiptFileList(
            items.map((item, i) => ({
              uid: `receipt-${transactionToEdit.key}-${i}-${item.name}`,
              name: item.name,
              status: 'done' as const,
              url: item.signedUrl,
              thumbUrl: item.signedUrl,
              storagePath: item.path,
            })),
          );
        } finally {
          if (!cancelled) setLoadingReceipts(false);
        }
      };
      void loadExistingReceipts();
      return () => {
        cancelled = true;
      };
    }, [transactionToEdit?.key]);

    useEffect(() => {
      let cancelled = false;
      const fetchData = async () => {
        const categories = await categoriesApiService.getCategoriesByType(transactionToEdit?.type ?? 'expense');
        if (cancelled) return;
        const colourOptions: ColourOption[] = [];
        for (const category of categories) {
          colourOptions.push({
            value: category.id!,
            label: category.name,
            color: category.color_hex || '#942121',
          });
        }
        setColourOptions(colourOptions);

        if (!transactionToEdit) {
          form.resetFields();
          setType("expense");
          setSubcategoryOptions([]);
          return;
        }

        setType(transactionToEdit.type);

        const parsedDate = dayjs(transactionToEdit.date);
        const initialDate = parsedDate.isValid() ? parsedDate : null;

        const editCategory = transactionToEdit.category[0];
        const categoryColor = editCategory?.color_hex || '#942121';
        let initialCat: ColourOption | null = null;
        let initialSub: ColourOption | null = null;

        if (editCategory?.id) {
          initialCat = {
            value: editCategory.id,
            label: editCategory.name,
            color: categoryColor,
          };
          setLoadingSubcategories(true);
          try {
            const subcategories = await subcategoriesApiService.getSubcategoryByCategoryId(editCategory.id);
            if (cancelled) return;
            const subOpts = subcategories.map((sub) => ({
              value: sub.id!,
              label: sub.name,
              color: categoryColor,
            }));
            setSubcategoryOptions(subOpts);

            const editSub = transactionToEdit.subcategory[0];
            if (editSub?.id) {
              initialSub = {
                value: editSub.id,
                label: editSub.name,
                color: categoryColor,
              };
            }
          } finally {
            if (!cancelled) setLoadingSubcategories(false);
          }
        } else {
          setSubcategoryOptions([]);
        }

        if (cancelled) return;

        form.setFieldsValue({
          type: transactionToEdit.type,
          amount: transactionToEdit.amount.toFixed(2).replace(".", ","),
          date: initialDate,
          description: transactionToEdit.description ?? "",
          category: initialCat,
          subcategory: initialSub,
          creditCard: transactionToEdit.credit_card_id || null,
          installmentNumber: transactionToEdit.installment_number ?? null,
          totalInstallments: transactionToEdit.total_installments ?? null,
        });
      };
      void fetchData();
      return () => {
        cancelled = true;
      };
    }, [transactionToEdit?.key, transactionToEdit?.type, form]);

    useEffect(() => {
      let cancelled = false;
      if (origin === 'credit-cards') {
        const fetchCards = async () => {
          setLoadingCards(true);
          try {
            const data = await creditCardsApiService.getAllCreditCards();
            if (cancelled) return;
            setCreditCards(data);
          } catch (error) {
            console.error('Error fetching credit cards:', error);
          } finally {
            if (!cancelled) setLoadingCards(false);
          }
        };
        void fetchCards();
      }
      return () => {
        cancelled = true;
      };
    }, [origin]);

    const onFinish = async (values: any) => {
      setSendingTransaction(true);

      const dateForApi = values.date
        ? dayjs(values.date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');

      const amountVal = values.amount;
      const newTransaction = {
        type: values.type,
        amount: amountVal ? Number(String(amountVal).replace(",", ".")) : 0,
        date: dateForApi,
        description: values.description ?? "",
        category_id: values.category?.value ?? null,
        subcategory_id: values.subcategory?.value ?? null,
        id: transactionToEdit?.key,
        credit_card_id: origin === 'credit-cards' ? values.creditCard : null,
        installment_number: (origin === 'credit-cards' && values.type === 'expense') ? (values.installmentNumber ? Number(values.installmentNumber) : null) : null,
        total_installments: (origin === 'credit-cards' && values.type === 'expense') ? (values.totalInstallments ? Number(values.totalInstallments) : null) : null,
      };

      let transactionId: string | null = null;

      try {
        if (transactionToEdit) {
          if (newTransaction.type !== transactionToEdit.type) {
            if (newTransaction.type === "expense") {
              await incomesApiService.deleteIncome(transactionToEdit.key!);
              const created = await expensesApiService.createExpense(newTransaction);
              transactionId = created.id ?? null;
            } else {
              await expensesApiService.deleteExpense(transactionToEdit.key!);
              const created = await incomesApiService.createIncome(newTransaction);
              transactionId = created.id ?? null;
            }
          } else if (newTransaction.type === "expense") {
            console.log("editing expense:", newTransaction);
            await expensesApiService.editExpense(newTransaction);
            transactionId = transactionToEdit.key;
          } else {
            console.log("editing income:", newTransaction);
            await incomesApiService.editIncome(newTransaction);
            transactionId = transactionToEdit.key;
          }
          onOpenNotification('success', 'Transaction updated successfully');
        } else {
          if (newTransaction.type === "expense") {
            console.log("creating expense:", newTransaction);
            const created = await expensesApiService.createExpense(newTransaction);
            transactionId = created.id ?? null;
          } else {
            console.log("creating income:", newTransaction);
            const created = await incomesApiService.createIncome(newTransaction);
            transactionId = created.id ?? null;
          }
          onOpenNotification('success', 'Transaction created successfully');
        }

        const { data: { user: userForStorage } } = await supabase.auth.getUser();
        const userId = userForStorage?.id;

        if (userId && transactionId) {
          const remainingPaths = new Set(
            receiptFileList
              .map((f) => f.storagePath)
              .filter((p): p is string => Boolean(p)),
          );
          const pathsToDelete = initialReceiptStoragePathsRef.current.filter((p) => !remainingPaths.has(p));
          if (pathsToDelete.length > 0) {
            const { errors: deleteErrors } = await receiptsService.removeReceipts(pathsToDelete);
            if (deleteErrors.length > 0) {
              onOpenNotification(
                'warning',
                'Transaction saved, but some receipts could not be removed from storage.',
                deleteErrors.map((e) => e.message).join(' '),
              );
            }
          }
        }

        const files = receiptFileList
          .map((f) => f.originFileObj)
          .filter((file): file is NonNullable<typeof file> => file != null);
        if (files.length > 0 && transactionId) {
          if (userId) {
            const { errors } = await receiptsService.uploadReceipts(userId, transactionId, files as File[]);
            if (errors.length > 0) {
              onOpenNotification('warning', 'Transaction saved, but some receipts failed to upload.', errors.map((e) => e.message).join(' '));
            }
          }
        }

        await delay(500);
        form.resetFields();
        onClose();
      } catch (error) {
        console.error("Error creating expense:", error);
        onOpenNotification('error', 'Error creating transaction!');
      } finally {
        setSendingTransaction(false);
        setReceiptFileList([]);
        setSubcategoryOptions([]);
        setType("expense");
        uptadeTransactions();
      }
    };

    const onCategoryChange = async (option: ColourOption | null) => {
      if (!option) {
        setSubcategoryOptions([]);
        return;
      }
      setLoadingSubcategories(true);
      const subcategories = await subcategoriesApiService.getSubcategoryByCategoryId(option.value);
      const colourOptionsSubcategories: ColourOption[] = [];
      for (const subcategory of subcategories) {
        colourOptionsSubcategories.push({
          value: subcategory.id!,
          label: subcategory.name,
          color: option.color,
        });
      }
      setSubcategoryOptions(colourOptionsSubcategories);
      setLoadingSubcategories(false);
    };

    const onTypeChange = async(value: string) => {
      setLoadingCategories(true);
      form.setFieldsValue({ category: null, subcategory: null });
      setType(value);
      const categories = await categoriesApiService.getCategoriesByType(value);
      const colourOptions: ColourOption[] = [];
      for (const category of categories) {
        colourOptions.push({
          value: category.id!,
          label: category.name,
          color: category.color_hex || '#942121',
        });
      }
      setColourOptions(colourOptions);
      setLoadingCategories(false);
    };

    const dateFormat = 'YYYY/MM/DD';

    const creditCardOptions = creditCards.map((card) => ({
      value: card.id ?? "",
      label: `${card.card_name} *${card.card_digits}`,
    }));

    return (
      <>
        <Drawer
          title={transactionToEdit ? "Edit Transaction" : "New Transaction"}
          closable={{ 'aria-label': 'Close Button' }}
          onClose={onClose}
          open={true}
          width={590}
        >
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            className="form-container flex-column"
            initialValues={{
              type: 'expense',
              date: dayjs(),
            }}
          >
            {origin === 'credit-cards' ? (
              <div className="flex justify-between items-center split-line gap-3">
                <div className='flex-column w-100 mr-1'>
                  <Form.Item name="type" label="Transaction type">
                    <Radio.Group className="input-type-category w-100" buttonStyle="solid" onChange={(e) => onTypeChange(e.target.value)}>
                      <Radio.Button value="expense">Expense</Radio.Button>
                      <Radio.Button value="income">Income</Radio.Button>
                    </Radio.Group >
                  </Form.Item>
                </div>
                <div className="flex-column w-100">
                  <Form.Item name="creditCard" label="Credit Card">
                    <AntdSelect
                      options={creditCardOptions}
                      placeholder="Select a credit card"
                      allowClear
                      loading={loadingCards}
                      style={{ width: '100%', height: '38px' }}
                    />
                  </Form.Item>
                </div>
              </div>
            ) : (
              <div className="flex split-line">
                <div className='flex-column w-100 mr-1'>
                  <Form.Item name="type" label="Transaction type">
                    <Radio.Group className="input-type-category w-100" buttonStyle="solid" onChange={(e) => onTypeChange(e.target.value)}>
                      <Radio.Button value="expense">Expense</Radio.Button>
                      <Radio.Button value="income">Income</Radio.Button>
                    </Radio.Group >
                  </Form.Item>
                </div>
              </div>
            )}

            <div className="flex split-line gap-3">
              <div className="w-100 mr-1">
                <Form.Item
                  name="amount"
                  label="Amount"
                  rules={[{ required: true, message: 'Please input the amount' }]}
                >
                  <CurrencyInput
                    placeholder='R$ 0,00'
                    decimalScale={2}
                    decimalsLimit={2}
                    prefix="R$ "
                    intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                    className="py-1 input-amount input-38"
                    onValueChange={(val) => {
                      form.setFieldsValue({ amount: val ?? "" });
                    }}
                  />
                </Form.Item>
              </div>
              <div className="w-100">
                <Form.Item name="date" label="Date">
                  <DatePicker format={dateFormat} className="py-1" style={{ width: '100%', borderRadius: '8px', height: '38px' }}/>
                </Form.Item>
              </div>
            </div>

            <div className="flex split-line gap-3">
              <div className="w-100 mr-1">
                <Form.Item name="category" label="Category">
                  <Select<ColourOption, false>
                    options={colourOptions}
                    styles={colourStyles}
                    placeholder="Select a category"
                    onChange={(option) => {
                      form.setFieldsValue({ category: option, subcategory: null });
                      void onCategoryChange(option);
                    }}
                    isSearchable={false}
                    isClearable
                    isLoading={loadingCategories}
                  />
                </Form.Item>
              </div>
              <div className="w-100">
                <Form.Item name="subcategory" label="Subcategory">
                  <Select<ColourOption, false>
                    options={subcategoryOptions}
                    styles={colourStyles}
                    placeholder="Select a subcategory"
                    isClearable
                    isLoading={loadingSubcategories}
                  />
                </Form.Item>
              </div>
            </div>

            {origin === 'credit-cards' && type === 'expense' && (
              <div className="flex split-line gap-3">
                <div className="w-100 mr-1">
                  <Form.Item name="installmentNumber" label="Installment Number">
                    <Input type="number" min={1} placeholder="e.g. 1" />
                  </Form.Item>
                </div>
                <div className="w-100">
                  <Form.Item name="totalInstallments" label="Total Installments">
                    <Input type="number" min={1} placeholder="e.g. 12" />
                  </Form.Item>
                </div>
              </div>
            )}

            <Form.Item name="description" label="Description">
              <Input size="large" placeholder="Description" />
            </Form.Item>

            <div className='flex-column receipt-field'>
              <label htmlFor="receipt" className="py-1">Attach a Receipt</label>
              <Spin spinning={loadingReceipts}>
                <Upload
                  action=""
                  listType="picture"
                  maxCount={3}
                  multiple
                  fileList={receiptFileList}
                  onChange={({ fileList }) => setReceiptFileList(fileList)}
                  accept=".png,.jpeg,.jpg,.pdf,image/png,image/jpeg,image/jpg,application/pdf"
                  customRequest={({ onSuccess }) => {
                    setTimeout(() => {
                      onSuccess?.(undefined);
                    }, 0);
                  }}
                  beforeUpload={(file) => {
                    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
                    const isAllowed = allowedTypes.includes(file.type);
                    if (!isAllowed) {
                      message.error('Only PNG, JPEG, JPG and PDF files are allowed.');
                      return Upload.LIST_IGNORE;
                    }
                    const maxSizeMb = 5;
                    const maxSizeBytes = maxSizeMb * 1024 * 1024;
                    if (file.size > maxSizeBytes) {
                      message.error(`File size must not exceed ${maxSizeMb} MB.`);
                      return Upload.LIST_IGNORE;
                    }
                    return true;
                  }}
                >
                  <Button type="primary" icon={<UploadOutlined/>} disabled={loadingReceipts}>
                    Upload
                  </Button>
                </Upload>
              </Spin>
              <span className="receipt-field-hint">Allowed formats: PNG, JPEG, JPG and PDF. Maximum size: 5 MB. Up to 3 files.</span>
            </div>

            <Button iconPosition='end' loading={sendingTransaction} disabled={loadingReceipts} type="primary" htmlType="submit" className="mt-4 font-weight-500">{transactionToEdit ? "Update" : "Submit"}</Button>
          </Form>
        </Drawer>
      </>
    );
}