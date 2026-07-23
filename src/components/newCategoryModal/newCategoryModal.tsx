import { useState, useEffect } from 'react';
import './newCategoryModal.scss'
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { Button, Input, Alert, Radio, notification, Form, Drawer, Popover } from 'antd';
import type { Category } from '../../types/category.interface';

type ModalProps = {
    onClose: () => void;
    editcategory?: Category | null;
    uptadeCategories: () => void;
};

type AlertMessage = {
    message: string;
    type: "success" | "error";
}

type NotificationType = 'success' | 'info' | 'warning' | 'error';

type CategoryFormValues = {
    category: string;
    color: string;
    type: string;
};

const PRESET_CATEGORY_COLORS = [
  { name: 'Primary Blue', value: '#1677ff' },
  { name: 'Midnight Navy', value: '#122140' },
  { name: 'Emerald Green', value: '#107c41' },
  { name: 'Deep Forest', value: '#0e4a29' },
  { name: 'Turquoise Teal', value: '#008080' },
  { name: 'Electric Cyan', value: '#007acc' },
  { name: 'Royal Purple', value: '#6b21a8' },
  { name: 'Plum Violet', value: '#581845' },
  { name: 'Magenta Rose', value: '#c2185b' },
  { name: 'Crimson Red', value: '#c0392b' },
  { name: 'Terracotta', value: '#a04000' },
  { name: 'Amber Rust', value: '#d4722a' },
  { name: 'Ochre Gold', value: '#9a6100' },
  { name: 'Chocolate Brown', value: '#5c3818' },
  { name: 'Slate Steel', value: '#475569' },
  { name: 'Dark Charcoal', value: '#1e293b' },
];

type ColorSelectorProps = {
    value?: string;
    onChange?: (value: string) => void;
};

function ColorSelector({ value, onChange }: ColorSelectorProps) {
    const [open, setOpen] = useState(false);
    const currentValue = value || PRESET_CATEGORY_COLORS[0].value;

    const handleSelect = (val: string) => {
        onChange?.(val);
        setOpen(false);
    };

    const popoverContent = (
        <div className="grid grid-cols-4 gap-2.5 w-52 p-1">
            {PRESET_CATEGORY_COLORS.map((c) => {
                const isSelected = currentValue?.toLowerCase() === c.value.toLowerCase();
                return (
                    <div
                        key={c.name}
                        onClick={() => handleSelect(c.value)}
                        className={`h-8 w-8 rounded-xl cursor-pointer transition-all duration-300 relative ${
                            isSelected 
                                ? 'border-[#122140] scale-110 shadow-md ring-2 ring-[#122140]/20' 
                                : 'border-transparent opacity-85 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
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
            title="Choose category color" 
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
        >
            <div
                className="w-10 h-10 rounded-xl cursor-pointer !border-0 shadow-sm hover:scale-105 transition-all duration-300 mt-1"
                style={{ backgroundColor: currentValue }}
                title="Click to choose color"
            />
        </Popover>
    );
}

export default function NewCategoryModal({ onClose, editcategory, uptadeCategories }: ModalProps) {
    const [form] = Form.useForm<CategoryFormValues>();
    const [isActive, _setIsActive] = useState(false);
    const [alertMessage, _setAlertMessage] = useState<AlertMessage>({ message: "", type: "success" });
    const [isLoading, setIsLoading] = useState(false);
    const [api, contextHolder] = notification.useNotification();
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const openNotification = (type: NotificationType, title: string, description?: string) => {
        api[type]({
            message: title,
            description: description,
        });
    };

    useEffect(() => {
        form.setFieldsValue({
            category: editcategory?.name ?? '',
            color: editcategory?.color_hex ?? '#1677ff',
            type: editcategory?.type ?? '',
        });
    }, [editcategory, form]);

    const handleSubmit = async (values: CategoryFormValues) => {
        setIsLoading(true);
        const newCategory = {
            name: values.category.trim() ? values.category.trim() : editcategory!.name,
            color_hex: values.color?.trim() ? values.color : editcategory?.color_hex ?? "#1677ff",
            user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
            type: values.type as "income" | "expense",
        };
        try {
            if (editcategory) {
                await categoriesApiService.updateCategory(newCategory, editcategory.id!);
                openNotification('success', 'Category updated successfully');
            } else {
                await categoriesApiService.createCategory(newCategory);
                openNotification('success', 'Category created successfully');
            }
            await delay(500);
            onClose();
        } catch (error) {
            console.error("Error creating category:", error);
            openNotification('error', 'Error creating category!');
        } finally {
            resetForm();
            uptadeCategories();
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        form.setFieldsValue({
            category: '',
            color: '#1677ff',
            type: '',
        });
    };

    return (
        <>
            {contextHolder}
            <Drawer
                title={editcategory ? "Edit Category" : "New Category"}
                open={true}
                onClose={onClose}
                width={400}
                footer={
                    <Button
                        loading={isLoading}
                        type="primary"
                        htmlType="submit"
                        form="new-category-form"
                        className="w-full mb-2"
                    >
                        {editcategory ? "Update" : "Submit"}
                    </Button>
                }
            >
                {isActive && <Alert message={alertMessage.message} type={alertMessage.type} className="my-2 alert-message" />}
                <Form<CategoryFormValues>
                    form={form}
                    id="new-category-form"
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="form-container flex-column"
                    initialValues={{
                        category: '',
                        color: '#1677ff',
                        type: '',
                    }}
                >
                    <Form.Item
                        name="category"
                        label="Category Name"
                        rules={[
                            { required: true, message: 'Category name is required' },
                            { whitespace: true, message: 'Category name is required' },
                        ]}
                    >
                        <Input size="large" placeholder="Category Name" className="mt-1 input-category-name" />
                    </Form.Item>
                    <Form.Item
                        name="color"
                        label="Color"
                        initialValue={PRESET_CATEGORY_COLORS[0].value}
                    >
                        <ColorSelector />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[{ required: true, message: 'Type is required' }]}
                    >
                        <Radio.Group className="input-type-category" buttonStyle="solid">
                            <Radio.Button value="expense">Expense</Radio.Button>
                            <Radio.Button value="income">Income</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Drawer>
        </>
    );
}
