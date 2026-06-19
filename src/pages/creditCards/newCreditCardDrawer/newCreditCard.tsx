import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Checkbox, Form, InputNumber, Row, notification } from 'antd';
import { Input, ColorPicker } from 'antd';
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

export default function NewCardDrawer({ onClose, onSuccess, cardToEdit, onLoadingChange }: NewCardDrawerProps) {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
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
                cardGradient: parseGradientString(cardToEdit.card_gradient),
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
        setIsLoading(true);
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
            setIsLoading(false);
            onLoadingChange?.(false);
        }
    }

    const DEFAULT_COLOR = [
        {
        color: 'rgb(16, 142, 233)',
        percent: 0,
        },
        {
        color: 'rgb(135, 208, 104)',
        percent: 100,
    },
    ];

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

            <Form.Item name="cardName" label="Card Name" rules={[{ required: true, message: 'Please input the card name' }]}>
                <Input placeholder='Ex: My Credit Card' maxLength={50}/>
            </Form.Item>

            <Form.Item name="bankName" label="Bank Name" rules={[{ required: true, message: 'Please input the bank name' }]}>
                <Input placeholder='Ex: Nubank' maxLength={50}/>
            </Form.Item>


            <Row className='flex justify-between'>
                <div className='w-1/2'>
                    <Form.Item
                        name="cardGradient"
                        label="Card color"
                        rules={[{ required: true, message: 'Please pick a card color' }]}
                        initialValue={DEFAULT_COLOR}
                    >
                        <ColorPicker
                            disabledAlpha={true}
                            mode="gradient"
                        />
                    </Form.Item>
                </div>
                
                <div className='w-1/2'>
                                    <Form.Item name="cardDigits" label="Last 4 digits" rules={[{ required: true, message: 'Please input the last 4 digits of the card number' }]}>
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
                        rules={[{ required: true, message: 'Please input the valid thru date' }]}
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
                        <InputNumber placeholder='Ex: 1000'/>
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
                rules={[{ required: false, message: 'Please input the notes' }]}
                >
                <TextArea  placeholder='Any notes about the card' rows={2} />
            </Form.Item>
        </Form>
    </>)
}