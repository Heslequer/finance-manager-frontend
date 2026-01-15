import './newExpenseModal.scss'
import CurrencyInput from 'react-currency-input-field';
import { useState, useEffect } from 'react';
import { ExpensesService } from '../../services/supabase/expenses/expenses.service';
import { CategoriesService } from '../../services/supabase/categories/categories.service';
import { IncomesService } from '../../services/supabase/incomes/incomes.service';
import React from 'react';
import chroma from 'chroma-js';
import { type ColourOption } from './docs/data';
import { DatePicker, Input, Space, Button, Alert, Radio, Upload, message, Drawer } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Select, { type StylesConfig } from 'react-select';
import { SubcategoriesService } from '../../services/supabase/subcategories/subcategories.service';
import type { DataType } from '../../pages/dashboard/transactions/transactions';
import dayjs, { Dayjs } from 'dayjs';
import { LoadingOutlined } from '@ant-design/icons';

type ModalProps = {
    onClose: () => void;
    transactionToEdit?: DataType | null;
    uptadeTransactions: () => void;
    onOpenNotification: (type: string, message: string, description?: string) => any;
};

type AlertMessage = {
  message: string;
  type: "success" | "error";
}

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

const colourStyles: StylesConfig<ColourOption> = {
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

const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();
const expensesService = new ExpensesService();
const incomesService = new IncomesService();

export default function NewExpenseModal({onClose, transactionToEdit, uptadeTransactions, onOpenNotification}: ModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [date, setDate] = useState<Dayjs | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [category, setCategory] = useState<ColourOption | null>(null);
    const [subcategoryOptions, setSubcategoryOptions] = useState<ColourOption[]>([]);
    const [colourOptions, setColourOptions] = useState<ColourOption[]>([]);
    const [isActive, setIsActive] = useState(false);
    // const [alertMessage, setAlertMessage] = useState<AlertMessage>({message: "", type: "success"});
    // const [isLoading, setIsLoading] = useState(false);
    const [categorySelected, setCategorySelected] = useState<ColourOption | null>(null);
    const [subcategorySelected, setSubcategorySelected] = useState<ColourOption | null>(null);
    const [type, setType] = useState<string>("");
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [defaultDate, setDefaultDate] = useState<any| null>(null);
    const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
      const fetchData = async () => {
        const categories = await categoriesService.getCategoriesByType(transactionToEdit?.type?? type);
        const colourOptions: ColourOption[] = [];
        for (const category of categories) {
          colourOptions.push({
            value: category.id!,
            label: category.name,
            color: category.color_hex || '#942121',
          });
        }
        setColourOptions(colourOptions);
        if(transactionToEdit){
          const date = new Date(transactionToEdit.date);
          const formatted = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
          setDefaultDate(formatted);
          setCategorySelected({
            value: transactionToEdit.category[0].id!,
            label: transactionToEdit.category[0].name,
            color: transactionToEdit.category[0].color_hex || '#942121',
          });
          setSubcategorySelected({
            value: transactionToEdit.subcategory[0].id!,
            label: transactionToEdit.subcategory[0].name,
            color: "",
          });
          
          if(categorySelected?.value){
            setLoadingSubcategories(true);
            console.log("categorySelected", categorySelected);
            const subcategories = await subcategoriesService.getSubcategoryByCategoryId(categorySelected?.value);
            console.log("subcategories", subcategories);
            const colourOptionsSubcategories: ColourOption[] = [];
            for (const subcategory of subcategories) {
              colourOptionsSubcategories.push({
                value: subcategory.id!,
                label: subcategory.name,
                color: '#942121',
              });
            }
            console.log("colourOptionsSubcategories", colourOptionsSubcategories);
            setSubcategoryOptions(colourOptionsSubcategories);
            setLoadingSubcategories(false);
          }
        }
      };
      fetchData();
    }, [defaultDate]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingTransaction(true);

      if(!categorySelected || !subcategorySelected){
        onOpenNotification('error', 'Error creating transaction!', 'Category and subcategory are required');
        setSendingTransaction(false);
        return;
      }
      const newTransaction = {
        type: transactionToEdit?.type ?? type,
        amount: amount ? Number(amount.replace(",",".")) :  transactionToEdit?.amount as number,
        date: date?.toString() ?? defaultDate.toString(),
        description: description === "" ? description : description ?? transactionToEdit?.description,
        category_id: categorySelected?.value!,
        subcategory_id: subcategorySelected?.value!,
        id: transactionToEdit?.key,
      };
      console.log("description", description);
        
      try{
        if(transactionToEdit){
          if(newTransaction.type && type)
          {
            if(newTransaction.type === "expense"){
              await incomesService.deleteIncome(transactionToEdit.key!);
              await expensesService.createExpense(newTransaction);
            }else{
              await expensesService.deleteExpense(transactionToEdit.key!);
              await incomesService.createIncome(newTransaction);
            }
          }else if(newTransaction.type === "expense"){
            console.log("editing expense:", newTransaction);
            await expensesService.editExpense(newTransaction);
          }else{
            console.log("editing income:", newTransaction);
            await incomesService.editIncome(newTransaction);
          }
          onOpenNotification('success', 'Transaction updated successfully');
        }else{
          if(newTransaction.type === "expense"){
            console.log("creating expense:", newTransaction);
            await expensesService.createExpense(newTransaction);
          }else{
            console.log("creating income:", newTransaction);
            await incomesService.createIncome(newTransaction);
          }
          onOpenNotification('success', 'Transaction created successfully');
        }
        await delay(500);
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
        onClose();
        uptadeTransactions();
      }
    };
    
    const onSubcategoryChange = async(colourOptionSelected: ColourOption) => {
      setSubcategorySelected(colourOptionSelected);
    }

    const onCategoryChange = async(colourOptionSelected: ColourOption) => {
      setCategorySelected(colourOptionSelected);
      setSubcategorySelected(null);
      setLoadingSubcategories(true);
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
      setLoadingSubcategories(false);
    }

    const onTypeChange = async(value: string) => {
      setLoadingCategories(true);
      setCategorySelected(null);
      setSubcategorySelected(null);
      setType(value);
      const categories = await categoriesService.getCategoriesByType(value);
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
        width={565}
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
                    <Select
                      value={categorySelected}
                      options={colourOptions}
                      styles={colourStyles}
                      placeholder="Select Category"
                      onChange={(e) => onCategoryChange(e as ColourOption)}
                      isSearchable={false}
                      isLoading={loadingCategories}
                    />
                </div>
                <div className="w-100">
                  <Select
                      value={subcategorySelected}
                      options={subcategoryOptions}
                      styles={colourStyles}
                      placeholder="Select Subcategory"
                      onChange={(e) => onSubcategoryChange(e as ColourOption)}
                      isLoading={loadingSubcategories}
                    />
                </div>
              </div>
            </div>
            <label htmlFor="description" className="py-1">Description</label>
            <Input size="large" placeholder="Description" defaultValue={transactionToEdit?.description ?? description ?? ""} onChange={(e) => setDescription(e.target.value)}/>
            
            <div className='flex-column receipt-field'>
              <label htmlFor="receipt" className="py-1">Attach</label>
              <Upload
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                listType="picture"
                maxCount={1}
              >
                <Button type="primary" icon={<UploadOutlined/>}>
                  Upload
                </Button>
              </Upload>
            </div>

            <Button iconPosition='end' loading={sendingTransaction} type="primary" htmlType="submit" className="mt-4 button-text">Submit</Button>
          </form>
        </Drawer>
      </>
    )
}