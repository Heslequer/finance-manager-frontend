import './newTransactionModal.scss'
import CurrencyInput from 'react-currency-input-field';
import { useState, useEffect, useRef } from 'react';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import React from 'react';
import chroma from 'chroma-js';
import { type ColourOption } from './docs/data';
import { DatePicker, Input, Space, Button, Radio, Upload, Drawer, message, Spin } from 'antd';
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

type ModalProps = {
    onClose: () => void;
    transactionToEdit?: DataType | null;
    uptadeTransactions: () => void;
    onOpenNotification: (type: string, message: string, description?: string) => any;
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


export default function NewTransactionModal({onClose, transactionToEdit, uptadeTransactions, onOpenNotification}: ModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [date, setDate] = useState<Dayjs | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [, setCategory] = useState<ColourOption | null>(null);
    const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);
    const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
    const [_isActive, _setIsActive] = useState(false);
    // const [alertMessage, setAlertMessage] = useState<AlertMessage>({message: "", type: "success"});
    // const [isLoading, setIsLoading] = useState(false);
    const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
    const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
    const [type, setType] = useState<string>("");
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [defaultDate, setDefaultDate] = useState<any| null>(null);
    const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
    const [receiptFileList, setReceiptFileList] = useState<ReceiptUploadFile[]>([]);
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
        const categories = await categoriesApiService.getCategoriesByType(transactionToEdit?.type ?? type);
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
          return;
        }

        const date = new Date(transactionToEdit.date);
        const formatted = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        setDefaultDate(formatted);

        const editCategory = transactionToEdit.category[0];
        const categoryColor = editCategory?.color_hex || '#942121';

        if (editCategory?.id) {
          setCategorySelected({
            value: editCategory.id,
            label: editCategory.name,
            color: categoryColor,
          });
          setLoadingSubcategories(true);
          try {
            const subcategories = await subcategoriesApiService.getSubcategoryByCategoryId(editCategory.id);
            if (cancelled) return;
            setSubcategoryOptions(
              subcategories.map((sub) => ({
                value: sub.id!,
                label: sub.name,
                color: categoryColor,
              })),
            );
          } finally {
            if (!cancelled) setLoadingSubcategories(false);
          }
        } else {
          setCategorySelected(null);
          setSubcategoryOptions([]);
        }

        if (cancelled) return;

        const editSub = transactionToEdit.subcategory[0];
        if (editSub?.id) {
          setSubcategorySelected({
            value: editSub.id,
            label: editSub.name,
            color: categoryColor,
          });
        } else {
          setSubcategorySelected(null);
        }
      };
      void fetchData();
      return () => {
        cancelled = true;
      };
    }, [transactionToEdit?.key, transactionToEdit?.type, type]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingTransaction(true);

      // Backend expects date in ISO 8601 (YYYY-MM-DD). dayjs().toString() is not valid.
      const dateForApi = date
        ? dayjs(date).format('YYYY-MM-DD')
        : defaultDate
          ? defaultDate.replace(/\//g, '-') // "YYYY/MM/DD" -> "YYYY-MM-DD"
          : dayjs().format('YYYY-MM-DD');   // new transaction without date = today

      const newTransaction = {
        type: transactionToEdit?.type ?? type,
        amount: amount ? Number(amount.replace(",",".")) :  transactionToEdit?.amount as number,
        date: dateForApi,
        description: description === "" ? description : description ?? transactionToEdit?.description,
        // JSON.stringify drops `undefined`, so the API would not clear FKs; send `null` to persist cleared selects.
        category_id: categorySelected?.value ?? null,
        subcategory_id: subcategorySelected?.value ?? null,
        id: transactionToEdit?.key,
      };
      console.log("description", description);

      let transactionId: string | null = null;

      try{
        if(transactionToEdit){
          if(newTransaction.type && type)
          {
            if(newTransaction.type === "expense"){
              await incomesApiService.deleteIncome(transactionToEdit.key!);
              const created = await expensesApiService.createExpense(newTransaction);
              transactionId = created.id ?? null;
            }else{
              await expensesApiService.deleteExpense(transactionToEdit.key!);
              const created = await incomesApiService.createIncome(newTransaction);
              transactionId = created.id ?? null;
            }
          }else if(newTransaction.type === "expense"){
            console.log("editing expense:", newTransaction);
            await expensesApiService.editExpense(newTransaction);
            transactionId = transactionToEdit.key;
          }else{
            console.log("editing income:", newTransaction);
            await incomesApiService.editIncome(newTransaction);
            transactionId = transactionToEdit.key;
          }
          onOpenNotification('success', 'Transaction updated successfully');
        }else{
          if(newTransaction.type === "expense"){
            console.log("creating expense:", newTransaction);
            const created = await expensesApiService.createExpense(newTransaction);
            transactionId = created.id ?? null;
          }else{
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
        onClose();
      }catch(error){
        console.error("Error creating expense:", error);
        onOpenNotification('error', 'Error creating transaction!');
      }finally{
        setSendingTransaction(false);
        setAmount("");
        setDate(null);
        setDescription("");
        setCategorySelected(null);
        setSubcategorySelected(null);
        setReceiptFileList([]);
        uptadeTransactions();
      }
    };
    
    const onSubcategoryChange = (option: ColourOption | null) => {
      setSubcategorySelected(option);
    };

    const onCategoryChange = async (option: ColourOption | null) => {
      setCategorySelected(option);
      setSubcategorySelected(null);
      setCategory(option);
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
      setCategorySelected(null);
      setSubcategorySelected(null);
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
    
    return (
      <>
        <Drawer
        title={transactionToEdit ? "Edit Transaction" : "New Transaction"}
        closable={{ 'aria-label': 'Close Button' }}
        onClose={onClose}
        open={true}
        width={590}
        >
          <form onSubmit={(e) => handleSubmit(e)} className="form-container flex-column">
            <div className="flex split-line">
              <div className='flex-column type-field'>
                <label htmlFor="type" className="py-1">Transaction type</label>
                <Radio.Group className="input-type-category" defaultValue={transactionToEdit?.type ?? type} buttonStyle="solid" onChange={(e) => onTypeChange(e.target.value)}>
                      <Radio.Button value="expense">Expense</Radio.Button>
                      <Radio.Button value="income">Income</Radio.Button>
                </Radio.Group >
              </div>
            </div>
            <div className="flex-column split-line">
              <div className="input-labels flex">
                <div className="w-100 mr-1 my-1">
                  <label htmlFor="amount" className="py-1">Amount</label>
                </div>
                <div className="w-100 my-1">
                  <label htmlFor="date" className="py-1">Date</label>
                </div>
              </div>
              <div className="input-fields flex">
                <div className="w-100 mr-1">
                  <CurrencyInput
                    defaultValue={transactionToEdit?.amount.toFixed(2).replace(".", ",") ?? amount}
                    placeholder='R$ 0,00'
                    onValueChange={(val) => setAmount(val ?? "")}
                    decimalScale={2}
                    decimalsLimit={2}
                    prefix="R$ "
                    intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                    className="py-1 input-amount input-38"
                  />
                </div>
                <div className="w-100">
                  <Space direction="vertical" style={{ width: '100%', borderRadius: '8px', height: '38px' }}>
                    <DatePicker  value={date ? date : defaultDate ? dayjs(defaultDate, dateFormat) : null} format={dateFormat} onChange={(e) => setDate(e)}  className="py-1" style={{ width: '100%', borderRadius: '8px', height: '38px' }}/>
                  </Space>              
                </div>
                  
              </div>

            </div>
            <div className="flex-column split-line">
              <div className="input-labels flex">
                <div className="w-100 mr-1 my-1">
                  <label htmlFor="category" className="py-1">Category</label>
                </div>
                <div className="w-100 my-1">
                  <label htmlFor="subcategory" className="py-1">Subcategory</label>
                </div>
              </div>
              <div className="input-fields flex">
                <div className="w-100 mr-1">
                    <Select<ColourOption, false>
                      value={categorySelected}
                      options={colourOptions}
                      styles={colourStyles}
                      placeholder="Select a category"
                      onChange={(e) => void onCategoryChange(e)}
                      isSearchable={false}
                      isClearable
                      isLoading={loadingCategories}
                    />
                </div>
                <div className="w-100">
                  <Select<ColourOption, false>
                    value={subcategorySelected}
                    options={subcategoryOptions}
                    styles={colourStyles}
                    placeholder="Select a subcategory"
                    onChange={(e) => onSubcategoryChange(e)}
                    isClearable
                    isLoading={loadingSubcategories}
                  />
                </div>
              </div>
            </div>
            <label htmlFor="description" className="py-1">Description</label>
            <Input size="large" placeholder="Description" defaultValue={transactionToEdit?.description ?? description ?? ""} onChange={(e) => setDescription(e.target.value)}/>
            
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
          </form>
        </Drawer>
      </>
    )
}