import type { ChangeEvent } from 'react';
import { Button, Form } from 'antd';
import { Input, ColorPicker } from 'antd';

function formatExpiryMmYyFromEvent(e: ChangeEvent<HTMLInputElement>): string {
  let numbers = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (numbers.length > 2) {
    numbers = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }
  return numbers;
}

export default function NewCardDrawer() {
    const onFinish = (values: any) => {
        console.log(values);
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
        <Form
            onFinish={onFinish}
            layout='vertical'
            className='flex-column'
        >
            <Form.Item name="cardName" label="Card Name" rules={[{ required: true, message: 'Please input the card name' }]}>
                <Input placeholder='Ex: My Credit Card' maxLength={50}/>
            </Form.Item>

            <Form.Item name="bankName" label="Bank Name" rules={[{ required: true, message: 'Please input the bank name' }]}>
                <Input placeholder='Ex: Nubank' maxLength={50}/>
            </Form.Item>

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

            <Form.Item
                name="cardGradient"
                label="Card color"
                rules={[{ required: true, message: 'Please pick a card color' }]}
            >
                <ColorPicker
                    defaultValue={DEFAULT_COLOR}
                    disabledAlpha={true}
                    mode="gradient"
                    onChangeComplete={(color) => {
                        console.log(color.toCssString());
                    }}
                />
            </Form.Item>

            <Form.Item
                name="validThru"
                label="Valid Thru"
                rules={[{ required: true, message: 'Please input the valid thru date' }]}
                getValueFromEvent={formatExpiryMmYyFromEvent}
            >
                <Input placeholder="MM/YY" maxLength={5} className='max-w-20'/>
            </Form.Item>
            <Form.Item label={null}>
                <Button type="primary" htmlType="submit" className='w-100'>
                    Submit
                </Button>
            </Form.Item>
        </Form>
    </>)
}