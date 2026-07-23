import { useEffect, useState } from 'react';
import './categoryCard.scss'
import { Button, ColorPicker, Space, Input, Popconfirm, notification } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Subcategory } from '../../../types/subcategory.interface';
import { subcategoriesApiService } from '../../../services/api/subcategories/subcategories.api';
import { categoriesApiService } from '../../../services/api/categories/categories.api';
import { ApiHttpError } from '../../../services/api/http/httpClient';
import type { Category } from '../../../types/category.interface';
import NewCategoryModal from '../../../components/newCategoryModal/newCategoryModal';
import { truncate } from '../../../utils/truncate';

interface CategoryCardProps {
    currentCategory: Category;
    updateCategories: () => void;
}
export default function CategoryCard({currentCategory, updateCategories}: CategoryCardProps) {
    const [_categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [popDeleteConfirmationFor, setPopDeleteConfirmationFor] = useState<string>("");
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [subcategoryInput, setSubcategoryInput] = useState<string>("");
    const [api, contextHolder] = notification.useNotification();
    const [category, _setCategory] = useState<Category>(currentCategory);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);	
    
    const error = (title: string, description: string) => {
        api['error']({
            message: title,
            description: description,
        })
    };
    const handleCreateSubcategory = async (categoryId: string) => {
        if(subcategoryInput.trim() !== ""){
            setIsCreating(true);
            const subcategory = {
                name: subcategoryInput,
                category_id: categoryId,
                user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
            };
            try{
                await subcategoriesApiService.createSubcategory(subcategory);
                await delay(500);
                setIsCreating(false);
                setSubcategoryInput("");
            }catch(err){
                console.error("Error creating subcategory:", err);
                error("Error creating subcategory", "Insert a valid subcategory name");
            }finally{
                const subcategories = await subcategoriesApiService.getSubcategoriesByCategoryId(currentCategory.id!);
                setSubcategories(subcategories);
            }
        }else{
            error("Error creating subcategory", "Insert a valid subcategory name");
        }
    };
    const handleEditCategory = (category?: Category) => {
        setShowNewCategoryModal(true);
        setCategoryToEdit(category ?? null);
    };
    const handleDeleteSubcategory = async (id: string) => {
        setIsDeleting(true);
        try{
            await subcategoriesApiService.deleteSubcategory(id);
            await delay(500);
        }catch(err){
            console.error("Error deleting subcategory:", err);
            const linked =
            err instanceof ApiHttpError &&
            err.statusCode === 409 &&
            err.apiCode === 'SUBCATEGORY_HAS_LINKED_TRANSACTIONS';
            error("Error deleting subcategory", linked ? err.message : "");
        }finally{
            setIsDeleting(false);
            setPopDeleteConfirmationFor("");
            const subcategories = await subcategoriesApiService.getSubcategoriesByCategoryId(currentCategory.id!);
            setSubcategories(subcategories);
        }
    };
    const handleDeleteCategory = async (id: string) => {
        setIsDeleting(true);
        try{
            console.log("Deleting category:", id);
            await categoriesApiService.deleteCategory(id);
            await delay(500);
        } catch (err) {
            console.error("Error deleting category:", err);
            const linked =
            err instanceof ApiHttpError &&
            err.statusCode === 409 &&
            err.apiCode === 'CATEGORY_HAS_LINKED_TRANSACTIONS';
            error("Error deleting category", linked ? err.message : "");
        } finally {
            setIsDeleting(false);
            const categories = await categoriesApiService.getCategories();
            setCategories(categories);
            setPopDeleteConfirmationFor("");
            updateCategories();
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            const subcategories = await subcategoriesApiService.getSubcategoriesByCategoryId(currentCategory.id!);
            setSubcategories(subcategories);
        };
        fetchData();
    }, []);
    return (
        <>
            {contextHolder}
            {showNewCategoryModal && (
                <NewCategoryModal onClose={() => setShowNewCategoryModal(false)} editcategory={categoryToEdit} uptadeCategories={() => {updateCategories()}}/>
            )}
            <div className="category-card justify-between border-silver-mist/60 border-1 h-50 rounded-3xl flex-column p-2 bg-white" key={category?.id}>
                <div className="header-category-card flex">
                    <div className="colour-box flex-center mr-2">
                        <ColorPicker defaultValue={category.color_hex} disabled/>
                    </div>
                    <div className="details-actions-buttons flex">
                        <div className="details flex-column mx-1">
                            <h5 className='mt-2'>{category.name}</h5>
                            <p className='p4'>{subcategories.length} subcategories</p>
                        </div>
                        <div className="action-buttons flex-center gap-1">
                            <Button icon={<EditOutlined />} onClick={() => handleEditCategory(category)}></Button>
                            <Popconfirm
                                title="Are you sure?"
                                open={popDeleteConfirmationFor === category.id}
                                onConfirm={() => handleDeleteCategory(category.id!)}
                                okButtonProps={{ loading: isDeleting, iconPosition: "end" }}
                                onCancel={() => setPopDeleteConfirmationFor("")}
                                cancelText="No"
                                okText="Yes"
                                icon={null}
                                placement="right"
                            >
                                <Button icon={<DeleteOutlined />} onClick={() => setPopDeleteConfirmationFor(category.id!)}></Button>
                            </Popconfirm>
                        </div>
                    </div>
                </div>
                <div className="body-category-card mt-2">
                    <div className="subcategories flex">
                        {subcategories.map((subcategory) => (
                            <div className="subcategory-element flex-center px-2 mr-1 mb-1" key={subcategory.id}>
                                <p className='p5 font-weight-300'>{truncate(subcategory.name, 50)}</p>
                                <Popconfirm
                                    title="Are you sure?"
                                    open={popDeleteConfirmationFor === subcategory.id}
                                    onConfirm={() => handleDeleteSubcategory(subcategory.id!)}
                                    okButtonProps={{ loading: isDeleting, iconPosition: "end" }}
                                    onCancel={() => setPopDeleteConfirmationFor("")}
                                    cancelText="No"
                                    okText="Yes"
                                    icon={null}
                                    placement="right"
                                >
                                    <button className='flex-center button delete-subcategory-button' onClick={() => setPopDeleteConfirmationFor(subcategory.id!)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-pp mx-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </Popconfirm>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mb-1">
                    <Space.Compact style={{ width: '100%' }}>
                        <Input placeholder="Add new subcategory" maxLength={50} onChange={(e) => setSubcategoryInput(e.target.value)} value={subcategoryInput} />
                        <Button iconPosition="end" type="primary" loading={isCreating} onClick={() => handleCreateSubcategory(category.id!)}>Add</Button>
                    </Space.Compact>
                </div>
            </div>
        </>
    )
}
