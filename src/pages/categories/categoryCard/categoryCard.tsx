import { useEffect, useState } from 'react';
import './categoryCard.scss'
import { Button, ColorPicker, Space, Input, Popconfirm, message } from 'antd';
import type { Subcategory } from '../../../services/supabase/subcategories/subcategories.interface';
import { SubcategoriesService } from '../../../services/supabase/subcategories/subcategories.service';
import { CategoriesService } from '../../../services/supabase/categories/categories.service';
import type { Category } from '../../../services/supabase/categories/categories.interface';
import NewCategoryModal from '../../../components/newCategoryModal/newCategoryModal';
interface CategoryCardProps {
    currentCategory: Category;
    updateCategories: () => void;
}
export default function CategoryCard({currentCategory, updateCategories}: CategoryCardProps) {
    const subcategoriesService = new SubcategoriesService();
    const categoriesService = new CategoriesService();
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [popDeleteConfirmationFor, setPopDeleteConfirmationFor] = useState<string>("");
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [subcategoryInput, setSubcategoryInput] = useState<string>("");
    const [messageApi, contextHolder] = message.useMessage();
    const [category, setCategory] = useState<Category>(currentCategory);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);	
    const error = (message: string) => {
        messageApi.open({
          type: 'error',
          content: message,
        });
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
                await subcategoriesService.createSubcategory(subcategory);
                await delay(500);
                setIsCreating(false);
                setSubcategoryInput("");
            }catch(err){
                console.error("Error creating subcategory:", err);
                error("Error creating subcategory");
            }finally{
                const subcategories = await subcategoriesService.getSubcategoriesByCategoryId(currentCategory.id!);
                setSubcategories(subcategories);
            }
        }else{
            error("Insert a valid subcategory name");
        }
    };
    const handleEditCategory = (category?: Category) => {
        setShowNewCategoryModal(true);
        setCategoryToEdit(category ?? null);
    };
    const handleDeleteSubcategory = async (id: string) => {
        setIsDeleting(true);
        try{
            await subcategoriesService.deleteSubcategory(id);
            await delay(500);
        }catch(err){
            console.error("Error deleting subcategory:", err);
        }finally{
            setIsDeleting(false);
            setPopDeleteConfirmationFor("");
            const subcategories = await subcategoriesService.getSubcategoriesByCategoryId(currentCategory.id!);
            setSubcategories(subcategories);
        }
    };
    const handleDeleteCategory = async (id: string) => {
        setIsDeleting(true);
        try{
            console.log("Deleting category:", id);
            await categoriesService.deleteCategory(id);
            await delay(500);
        }catch(err){
            console.error("Error deleting category:", err);
            error("Error deleting category");
        }finally{
            setIsDeleting(false);
            const categories = await categoriesService.getCategories();
            setCategories(categories);
            updateCategories();
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            const subcategories = await subcategoriesService.getSubcategoriesByCategoryId(currentCategory.id!);
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
            <div className="category-card bd flex-column p-2 mb-2" key={category?.id}>
                <div className="header-category-card flex">
                    <div className="colour-box flex-center mr-2">
                        <ColorPicker defaultValue={category.color_hex} disabled/>
                    </div>
                    <div className="details-actions-buttons flex">
                        <div className="details flex-column mx-1">
                            <h5 className='mt-2'>{category.name}</h5>
                            <p className='p4'>{subcategories.length} subcategories</p>
                        </div>
                        <div className="action-buttons flex-center">
                            <button className="button flex-center edit-category-button mx-1" onClick={() => handleEditCategory(category)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-m mx-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>

                            </button>
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
                                <button className="button flex-center delete-category-button mx-1" onClick={() => setPopDeleteConfirmationFor(category.id!)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-m mx-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </Popconfirm>
                        </div>                              
                    </div>
                </div>
                <div className="body-category-card mt-2">
                    <div className="subcategories flex">
                        {subcategories.map((subcategory) => (
                            <div className="subcategory-element flex-center px-2 mr-1 mb-1" key={subcategory.id}>
                                <p className='p5 font-weight-300'>{subcategory.name}</p>
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
                <div className="footer-category-card mt-2">
                <Space.Compact style={{ width: '100%' }}>
                    <Input placeholder="Add new subcategory"onChange={(e) => setSubcategoryInput(e.target.value)} value={subcategoryInput} />
                    <Button iconPosition="end" type="primary" loading={isCreating} onClick={() => handleCreateSubcategory(category.id!)}>Add</Button>
                </Space.Compact>
                </div>
            </div>
        </>
    )
}
