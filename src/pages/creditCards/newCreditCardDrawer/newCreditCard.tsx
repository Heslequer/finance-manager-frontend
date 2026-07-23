import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Checkbox, Form, InputNumber, Row, notification, Popover } from 'antd';
import { Input } from 'antd';
import { creditCardsApiService } from '../../../services/api/credit-cards/credit-cards.api';
import type { CreditCard } from '../../../types/credit-card.interface';
const { TextArea } = Input;


function formatExpiryMmYyFromEvent(e: ChangeEvent<HTMLInputElement>): string {
  let numbers = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (numbers.length > 2) {
    numbers = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }
  return numbers;
}

type NewCardDrawerProps = {
    onClose?: () => void;
    onSuccess?: () => void;
    cardToEdit?: CreditCard | null;
    onLoadingChange?: (loading: boolean) => void;
};

function parseGradientString(gradientStr: string): { color: string; percent: number }[] {
    if (!gradientStr) return [];
    const regex = /(rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8})\s+(\d+)%/g;
    const matches = [...gradientStr.matchAll(regex)];
    if (matches.length === 0) {
        return [];
    }
    return matches.map(match => ({
        color: match[1],
        percent: Number(match[2]),
    }));
}

function gradientStepsToCss(steps: any[]): string {
    const stepsStr = steps
        .map(step => {
            const colorStr = typeof step.color === 'object' && typeof step.color.toRgbString === 'function'
                ? step.color.toRgbString()
                : String(step.color || '');
            return `${colorStr} ${step.percent}%`;
        })
        .join(', ');
    return `linear-gradient(90deg, ${stepsStr})`;
}

const PRESET_GRADIENTS = [
  { name: 'Default Blue', value: 'linear-gradient(135deg, #108ee9 0%, #87d068 100%)' },
  { name: 'Midnight Navy', value: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)' },
  { name: 'Sunset Crimson', value: 'linear-gradient(135deg, #d35400 0%, #c0392b 100%)' },
  { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
  { name: 'Emerald Forest', value: 'linear-gradient(135deg, #11998e 0%, #196643 100%)' },
  { name: 'Royal Violet', value: 'linear-gradient(135deg, #4a148c 0%, #8e24aa 100%)' },
  { name: 'Cyberpunk Ruby', value: 'linear-gradient(135deg, #9c27b0 0%, #d81b60 100%)' },
  { name: 'Bronze Gold', value: 'linear-gradient(135deg, #8a640f 0%, #b38728 50%, #684a0b 100%)' },
  { name: 'Charcoal Black', value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
  { name: 'Bordeaux Wine', value: 'linear-gradient(135deg, #581845 0%, #900c3f 100%)' },
  { name: 'Deep Aqua', value: 'linear-gradient(135deg, #005c53 0%, #042940 100%)' },
  { name: 'Rust Terracotta', value: 'linear-gradient(135deg, #873600 0%, #b33600 100%)' }
];

type GradientSelectorProps = {
    value?: string;
    onChange?: (value: string) => void;
};

function GradientSelector({ value, onChange }: GradientSelectorProps) {
    const [open, setOpen] = useState(false);
    const currentValue = value || PRESET_GRADIENTS[0].value;

    const handleSelect = (val: string) => {
        onChange?.(val);
        setOpen(false);
    };

    const popoverContent = (
        <div className="grid grid-cols-3 gap-2 w-64 p-1">
            {PRESET_GRADIENTS.map((g) => {
                const isSelected = currentValue === g.value;
                return (
                    <div
                        key={g.name}
                        onClick={() => handleSelect(g.value)}
                        className={`h-10 aspect-[1.586] rounded-xl cursor-pointer transition-all duration-300 relative ${
                            isSelected 
                                ? 'border-[#122140] scale-105 shadow-md' 
                                : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
                        }`}
                        style={{ background: g.value }}
                        title={g.name}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                                <span className="text-white text-xs font-semibold">✓</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <Popover 
            content={popoverContent} 
            title="Choose card color" 
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
        >
            <div
                className="h-10 aspect-[1.586] rounded-lg !border-0 cursor-pointer shadow-sm hover:scale-105 transition-all duration-300"
                style={{ background: currentValue }}
                title="Click to choose color"
            />
        </Popover>
    );
}

export default function NewCardDrawer({ onClose, onSuccess, cardToEdit, onLoadingChange }: NewCardDrawerProps) {
    const [form] = Form.useForm();
    const [api, contextHolder] = notification.useNotification();



    const openNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => {
        api[type]({
            message: title,
            description: description,
        });
    };

    useEffect(() => {
        if (cardToEdit) {
            form.setFieldsValue({
                cardActive: cardToEdit.card_active ?? true,
                cardName: cardToEdit.card_name,
                bankName: cardToEdit.bank_name,
                cardGradient: cardToEdit.card_gradient || PRESET_GRADIENTS[0].value,
                cardDigits: cardToEdit.card_digits,
                validThru: cardToEdit.valid_thru,
                limit: cardToEdit.credit_limit,
                closingDay: cardToEdit.closing_day,
                dueDay: cardToEdit.due_day,
                notes: cardToEdit.notes,
            });
        } else {
            form.resetFields();
        }
    }, [cardToEdit, form]);

    const onFinish = async (values: any) => {
        onLoadingChange?.(true);
        let cardGradientStr = '';
        if (values.cardGradient) {
            if (typeof values.cardGradient === 'object' && typeof values.cardGradient.toCssString === 'function') {
                cardGradientStr = values.cardGradient.toCssString();
            } else if (Array.isArray(values.cardGradient)) {
                cardGradientStr = gradientStepsToCss(values.cardGradient);
            } else {
                cardGradientStr = String(values.cardGradient);
            }
        }

        const newCard = {
            card_name: values.cardName,
            bank_name: values.bankName,
            card_gradient: cardGradientStr,
            card_digits: values.cardDigits,
            valid_thru: values.validThru,
            credit_limit: values.limit,
            closing_day: values.closingDay,
            due_day: values.dueDay,
            notes: values.notes || '',
            card_active: values.cardActive ?? true,
            current_balance: cardToEdit?.current_balance ?? 0,
        };

        try {
            if (cardToEdit?.id) {
                await creditCardsApiService.editCreditCard(cardToEdit.id, newCard);
                openNotification('success', 'Credit card updated successfully');
            } else {
                await creditCardsApiService.createCreditCard(newCard);
                openNotification('success', 'Credit card created successfully');
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            form.resetFields();
            if (onClose) onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving credit card:", error);
            openNotification('error', cardToEdit?.id ? 'Error updating credit card!' : 'Error creating credit card!');
        } finally {
        onLoadingChange?.(false);
        }
    }

    const DEFAULT_COLOR = PRESET_GRADIENTS[0].value;

    return (<>
        {contextHolder}
        <Form
            form={form}
            id="new-credit-card-form"
            onFinish={onFinish}
            layout='vertical'
            className='flex-column'
        >

            <Form.Item label={null} name="cardActive" valuePropName="checked" initialValue={true}>
                <Checkbox>Card Active</Checkbox>
            </Form.Item>

            <Form.Item
                name="cardName"
                label="Card Name"
                rules={[
                    { required: true, whitespace: true, message: 'Please input the card name' },
                ]}
            >
                <Input placeholder='Ex: My Credit Card' maxLength={60}/>
            </Form.Item>

            <Form.Item
                name="bankName"
                label="Bank Name"
                rules={[
                    { required: true, whitespace: true, message: 'Please input the bank name' },
                ]}
            >
                <Input placeholder='Ex: Nubank' maxLength={60}/>
            </Form.Item>


            <Row className='flex justify-between'>
                <div className='w-1/2'>
                    <Form.Item
                        name="cardGradient"
                        label="Card color"
                        initialValue={DEFAULT_COLOR}
                    >
                        <GradientSelector/>
                    </Form.Item>
                </div>
                
                <div className='w-1/2'>
                        <Form.Item 
                            name="cardDigits" 
                            label="Last 4 digits" 
                            rules={[
                                { required: true, message: 'Please input the last 4 digits of the card number' },
                                { len: 4, message: 'Must be exactly 4 digits' }
                            ]}
                        >
                        <Input maxLength={4} placeholder='Ex: 1234' className='max-w-20'
                            onKeyDown={(e) => {
                                const allowedKeys = [
                                    'Backspace',
                                    'Delete',
                                    'Tab',
                                    'ArrowLeft',
                                    'ArrowRight',
                                    'Home',
                                    'End',
                                ];
                        
                                const isNumber = /^[0-9]$/.test(e.key);
                        
                                if (!isNumber && !allowedKeys.includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </Form.Item>
                </div>
            </Row>

            <Row className='flex justify-between'>
                <div className='w-1/2'>
                    <Form.Item
                        name="validThru"
                        label="Valid Thru"
                        rules={[
                            { required: true, message: 'Please input the valid thru date' },
                            {
                                validator: (_, value) => {
                                    if (!value) {
                                        return Promise.resolve();
                                    }
                                    const regex = /^(0[1-9]|1[0-2])\/[0-9]{2}$/;
                                    if (!regex.test(value)) {
                                        return Promise.reject(new Error('Invalid date.'));
                                    }
                                    
                                    const [monthStr, yearStr] = value.split('/');
                                    const cardMonth = parseInt(monthStr, 10);
                                    const cardYear = 2000 + parseInt(yearStr, 10);
                                    
                                    const now = new Date();
                                    const currentYear = now.getFullYear();
                                    const currentMonth = now.getMonth() + 1;
                                    
                                    if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
                                        return Promise.reject(new Error('Expiry date cannot be in the past.'));
                                    }
                                    
                                    return Promise.resolve();
                                }
                            }
                        ]}
                        getValueFromEvent={formatExpiryMmYyFromEvent}
                    >
                        <Input placeholder="MM/YY" maxLength={5} className='max-w-20'/>
                    </Form.Item>
                </div>
                <div className='w-1/2'>
                    <Form.Item 
                        name="limit" 
                        label="Credit Limit" 
                        rules={[{ required: true, message: 'Please input the card limit' }]}
                        >
                        <InputNumber placeholder='Ex: 1000' maxLength={7} max={9999999}/>
                    </Form.Item>
                </div>
            </Row>

            <Row className='flex justify-between'>
                <div className='w-1/2'>
                <Form.Item 
                    name="closingDay"
                    label="Closing day"
                    rules={[{ required: true, message: 'Please input the closing day' }]}
                >
                    <InputNumber placeholder='Ex: 1' min={1} max={31}/>
                </Form.Item>
                </div>

                <div className='w-1/2'>
                <Form.Item 
                    name="dueDay"
                    label="Due day"
                    rules={[{ required: true, message: 'Please input the due day' }]}
                    >
                    <InputNumber placeholder='Ex: 5' min={1} max={31}/>
                </Form.Item>
                </div>                
            </Row>

            <Form.Item 
                name="notes"
                label="Notes"
                rules={[
                    { whitespace: true, message: 'Notes cannot consist of only spaces' }
                ]}
                >
                <TextArea  placeholder='Any notes about the card' rows={2} />
            </Form.Item>
        </Form>
    </>)
}