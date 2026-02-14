import './newIncomeModal.scss'
import CurrencyInput from 'react-currency-input-field';
import { useState } from 'react';

import React from 'react';
import chroma from 'chroma-js';
import { type ColourOption, colourOptions } from '../newExpanseModal/docs/data';
import Select, { type StylesConfig } from 'react-select';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import { DatePicker, Input, Space, Button, Alert } from 'antd';
import type { Income } from '../../types/income.interface';


type ModalProps = {
    onClose: () => void;
    income: Income | null;
};

type AlertMessage = {
  message: string;
  type: "success" | "error";
}

const colourStyles: StylesConfig<ColourOption, true> = {
  control: (styles) => ({ ...styles, backgroundColor: 'white'}),
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
        ? '#000'
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
  multiValue: (styles, { data }) => {
    const color = chroma(data.color);
    return {
      ...styles,
      backgroundColor: color.alpha(0.1).css(),
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: data.color,
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: data.color,
    ':hover': {
      backgroundColor: data.color,
      color: 'white',
    },
  }),
};

export default function NewExpenseModal({onClose, income}: ModalProps) {
    const [amount, setAmount] = useState<string | undefined>("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<ColourOption[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [alertMessage, setAlertMessage] = useState<AlertMessage>({message: "", type: "success"});
    const [isLoading, setIsLoading] = useState(false);
    // const [incomeDetails, setIncomeDetails] = useState<Income | null>(income);
    const handleSubmit = async (e: React.FormEvent) => {
      setIsLoading(true);
      e.preventDefault(); // prevents page reload
      if(amount === "" || date === ""){
        setAlertMessage({message: `${amount === ""  && date === "" 
          ? "Amount and Date are" : amount === "" 
          ? "Amount is" : date === "" 
          ? "Date is" : ""} required`, type: "error"});
        setIsActive(true);
        setIsLoading(false);
        return;
      }
      // Monta o objeto para enviar
      const newTransaction = {
        amount: Number(amount?.replace(",",".")),
        date,
        description,
        category: category.map((item) => item.label),
        category_ids: category.map((item) => item.value),
      };

      try {
        await incomesApiService.createIncome(newTransaction);
        setAlertMessage({message: "Income created successfully", type: "success"});
        setIsActive(true);
      } catch (error) {
        console.error("Error creating income:", error);
        setAlertMessage({message: "Error creating income!", type: "error"});
        setIsActive(true);
      }finally {
        setIsLoading(false);
        setAmount("");
        setDate("");
        setDescription("");
        setCategory([]);
      }
        
    };
    
    return (
    <div className="modal-overlay">
      <div className="grid-container-8 modal-container p-6">
        <button className="close-button" onClick={onClose}>
          <span>✕</span>
        </button>
        {isActive && <Alert message={alertMessage.message} type={alertMessage.type} className="my-2 alert-message"/>}
        <h3 className="text-center">{income ? "Edit Income" : "New Income"}</h3>
        <form  onSubmit={handleSubmit} className="form-container flex-column">
            <label htmlFor="amount">Amount</label>
            <CurrencyInput
              value={income?.amount.toString() ?? amount}
              placeholder='R$ 0,00'
              onValueChange={(val) => setAmount(val ?? "")} // nunca undefined
              decimalScale={2}
              decimalsLimit={2}
              prefix="R$ "
              intlConfig={{ locale: "pt-BR", currency: "BRL" }}
              className="py-1 input-amount"
            />
            <label htmlFor="date">Date</label>
            <Space direction="vertical" className="my-1">
              <DatePicker value={date} onChange={(e) => setDate(e)}  className="py-1 input-date"/>
            </Space>
            <label htmlFor="description">Description</label>
            <Input value={income?.description ?? ""} size="large" placeholder="Description" className="mt-1" onChange={(e) => setDescription(e.target.value)}/>

            <label htmlFor="category" className="py-1">Category</label>
            <Select
              closeMenuOnSelect={false}
              isMulti
              options={colourOptions}
              styles={colourStyles}
              placeholder="Select Category"
              className="select-category"
              theme={(theme) => ({
                ...theme,
                borderRadius: 0,
                colors: {
                  ...theme.colors,
                  primary25: 'hotpink',
                  primary: 'black',
                },
              })}
              value={category}
              defaultValue={{value: "teste", label: "teste", color: "teste"}}
              onChange={(e) => setCategory(e.map((item) => item))}
            />
            <Button type="primary" htmlType="submit" className="mt-4 button-text">{isLoading?"Submitting...":"Submit"}</Button>
        </form>
      </div>
    </div>
    )
}