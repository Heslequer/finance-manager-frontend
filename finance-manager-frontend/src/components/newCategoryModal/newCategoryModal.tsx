import { useState } from 'react';
import './newCategoryModal.scss'
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { ColorPicker } from 'antd';
import { Button, Input, Alert, Radio, notification} from 'antd';
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

export default function NewCategoryModal({onClose, editcategory, uptadeCategories}: ModalProps) {
    const [categoryName, setCategoryName] = useState<string>(editcategory?.name ?? "");
    const [color, setColor] = useState<string>(editcategory?.color_hex ?? "#1677ff");
    const [type, setType] = useState<string>(editcategory?.type ?? "");
    const [isActive, setIsActive] = useState(false);
    const [alertMessage, setAlertMessage] = useState<AlertMessage>({message: "", type: "success"});
    const [isLoading, setIsLoading] = useState(false);
    const [api, contextHolder] = notification.useNotification();
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const openNotification = (type: NotificationType, title: string, description?: string) => {
        api[type]({
          message: title,
          description: description,
        });
      };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if(categoryName.trim() === "" && !editcategory){
            openNotification('error', 'Error creating category!','Valid category name is required');
            setIsLoading(false);
            return;
        }else if(type === "" && !editcategory ){
            openNotification('error', 'Error creating category!','Type is required');
            setIsLoading(false);
            return;
        }
        const newCategory = {
            name: categoryName.trim() ? categoryName : editcategory!.name,
            color_hex: color.trim() ? color : editcategory?.color_hex ??  "#1677ff",
            user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
            type: type ? type as "income" | "expense" : editcategory?.type!,
        };
        try{
            if(editcategory){
                await categoriesApiService.updateCategory(newCategory, editcategory.id!);
                openNotification('success', 'Category updated successfully');
            }else{
                await categoriesApiService.createCategory(newCategory);
                openNotification('success', 'Category created successfully');
            }
            await delay(500);
            onClose();
        }catch(error){
            console.error("Error creating category:", error);
            openNotification('error', 'Error creating category!');
        }finally{
            resetForm();
            uptadeCategories();
            setIsLoading(false);
        }
    }
    const resetForm = () => {
        setCategoryName("");
        setColor("#1677ff");
        setType("");
    }
    return (
        <>
            {contextHolder}
            <div className="modal-overlay">
                <div className="grid-container-8 modal-container p-6">
                    <button className="close-button" onClick={onClose}>
                        <span>✕</span>
                    </button>
                    {isActive && <Alert message={alertMessage.message} type={alertMessage.type} className="my-2 alert-message"/>}
                    <h3 className="text-center">New Category</h3>
                    <form  onSubmit={handleSubmit} className="form-container flex-column">

                        <label htmlFor="description" className="py-1">Category</label>
                        <Input size="large" placeholder="Category Name" className="mt-1 input-category-name" onChange={(e) => setCategoryName(e.target.value)} value={categoryName}/>
                        <label htmlFor="color" className="py-1">Color</label>
                        <div>
                            <ColorPicker className="input-color-category" value={color} onChange={(color) => setColor(color.toHexString())} />
                        </div>
                        <label htmlFor="type" className="py-1">Type</label>
                        <Radio.Group className="input-type-category" value={type} buttonStyle="solid" onChange={(e) => setType(e.target.value)}>
                            <Radio.Button value="expense">Expense</Radio.Button>
                            <Radio.Button value="income">Income</Radio.Button>
                        </Radio.Group >

                        <Button loading={isLoading} iconPosition="end" type="primary" htmlType="submit" className="mt-4 button-text">{editcategory?"Update":"Submit"}</Button>

                    </form>
                </div>
            </div>
        </>
    )
}