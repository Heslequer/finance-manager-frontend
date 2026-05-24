import { useState, useEffect } from 'react';
import './newCategoryModal.scss'
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { ColorPicker } from 'antd';
import { Button, Input, Alert, Radio, notification, Form } from 'antd';
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
            <div className="modal-overlay">
                <div className="grid-container-8 modal-container px-4 py-5">
                    <div className="mb-2">
                        <h5 className="modal-title my-2">New Category</h5>
                        <button className="close-button" onClick={onClose}>
                            <span>✕</span>
                        </button>
                    </div>
                    {isActive && <Alert message={alertMessage.message} type={alertMessage.type} className="my-2 alert-message" />}
                    <Form<CategoryFormValues>
                        form={form}
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
                            label="Category"
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
                            rules={[{ required: true, message: 'Color is required' }]}
                            getValueFromEvent={(c) => (c && typeof (c as { toHexString?: () => string }).toHexString === 'function'
                                ? (c as { toHexString: () => string }).toHexString()
                                : String(c))}
                        >
                            <ColorPicker disabledAlpha={true} showText className="input-color-category" />
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

                        <Button loading={isLoading} iconPosition="end" type="primary" htmlType="submit" className="mt-4 button-text">{editcategory ? "Update" : "Submit"}</Button>

                    </Form>
                </div>
            </div>
        </>
    )
}
