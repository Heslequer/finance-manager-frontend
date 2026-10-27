import { useEffect, useState } from 'react';
import './categoryCard.scss';
import { Button, Space, Input, Popconfirm, notification } from 'antd';
import { EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
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

export default function CategoryCard({ currentCategory, updateCategories }: CategoryCardProps) {
  const [_categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [popDeleteConfirmationFor, setPopDeleteConfirmationFor] = useState<string>('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [subcategoryInput, setSubcategoryInput] = useState<string>('');
  const [api, contextHolder] = notification.useNotification();
  const [category, _setCategory] = useState<Category>(currentCategory);
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const error = (title: string, description: string) => {
    api['error']({
      message: title,
      description: description,
    });
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    if (subcategoryInput.trim() !== '') {
      setIsCreating(true);
      const subcategory = {
        name: subcategoryInput,
        category_id: categoryId,
        user_id: '50baa1d0-57aa-4eff-932f-228e773784eb',
      };
      try {
        await subcategoriesApiService.createSubcategory(subcategory);
        await delay(500);
        setIsCreating(false);
        setSubcategoryInput('');
      } catch (err) {
        console.error('Error creating subcategory:', err);
        error('Error creating subcategory', 'Insert a valid subcategory name');
      } finally {
        const subcategories = await subcategoriesApiService.getSubcategoriesByCategoryId(currentCategory.id!);
        setSubcategories(subcategories);
      }
    } else {
      error('Error creating subcategory', 'Insert a valid subcategory name');
    }
  };

  const handleEditCategory = (category?: Category) => {
    setShowNewCategoryModal(true);
    setCategoryToEdit(category ?? null);
  };

  const handleDeleteSubcategory = async (id: string) => {
    setIsDeleting(true);
    try {
      await subcategoriesApiService.deleteSubcategory(id);
      await delay(500);
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      const linked =
        err instanceof ApiHttpError &&
        err.statusCode === 409 &&
        err.apiCode === 'SUBCATEGORY_HAS_LINKED_TRANSACTIONS';
      error('Error deleting subcategory', linked ? err.message : '');
    } finally {
      setIsDeleting(false);
      setPopDeleteConfirmationFor('');
      const subcategories = await subcategoriesApiService.getSubcategoriesByCategoryId(currentCategory.id!);
      setSubcategories(subcategories);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsDeleting(true);
    try {
      console.log('Deleting category:', id);
      await categoriesApiService.deleteCategory(id);
      await delay(500);
    } catch (err) {
      console.error('Error deleting category:', err);
      const linked =
        err instanceof ApiHttpError &&
        err.statusCode === 409 &&
        err.apiCode === 'CATEGORY_HAS_LINKED_TRANSACTIONS';
      error('Error deleting category', linked ? err.message : '');
    } finally {
      setIsDeleting(false);
      const categories = await categoriesApiService.getCategories();
      setCategories(categories);
      setPopDeleteConfirmationFor('');
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
        <NewCategoryModal
          onClose={() => setShowNewCategoryModal(false)}
          editcategory={categoryToEdit}
          uptadeCategories={() => updateCategories()}
        />
      )}
      <div
        className="bg-white-200 border border-white-500 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-4 min-h-[180px]"
        key={category?.id}
      >
        {/* Card Header: Swatch, Title & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs border border-white-500/80"
              style={{ backgroundColor: category.color_hex || 'var(--color-blue-500)' }}
            />
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-blue-700 tracking-tight leading-snug">
                {category.name}
              </h3>
              <span className="text-xs text-white-700">
                {subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="small"
              icon={<EditOutlined className="text-xs" />}
              onClick={() => handleEditCategory(category)}
              className="!border-white-500 !text-black-400 hover:!text-blue-500 hover:!border-blue-500 rounded-lg flex items-center justify-center w-8 h-8"
              aria-label="Edit category"
            />
            <Popconfirm
              title="Are you sure you want to delete this category?"
              open={popDeleteConfirmationFor === category.id}
              onConfirm={() => handleDeleteCategory(category.id!)}
              okButtonProps={{ loading: isDeleting, iconPosition: 'end' }}
              onCancel={() => setPopDeleteConfirmationFor('')}
              cancelText="No"
              okText="Yes"
              icon={null}
              placement="bottomRight"
            >
              <Button
                size="small"
                icon={<DeleteOutlined className="text-xs" />}
                onClick={() => setPopDeleteConfirmationFor(category.id!)}
                className="!border-white-500 !text-black-400 hover:!text-red-500 hover:!border-red-500 rounded-lg flex items-center justify-center w-8 h-8"
                aria-label="Delete category"
              />
            </Popconfirm>
          </div>
        </div>

        {/* Subcategories Tag Pills */}
        <div className="flex flex-wrap gap-2 py-1 min-h-[32px] items-center">
          {subcategories.length === 0 ? (
            <span className="text-xs text-black-300 italic">No subcategories yet</span>
          ) : (
            subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="bg-white-400 border border-white-500 rounded-full px-3 py-1 text-xs font-medium text-black-500 flex items-center gap-1.5 hover:bg-white-500 transition-colors"
              >
                <span>{truncate(subcategory.name, 40)}</span>
                <Popconfirm
                  title="Delete this subcategory?"
                  open={popDeleteConfirmationFor === subcategory.id}
                  onConfirm={() => handleDeleteSubcategory(subcategory.id!)}
                  okButtonProps={{ loading: isDeleting, iconPosition: 'end' }}
                  onCancel={() => setPopDeleteConfirmationFor('')}
                  cancelText="No"
                  okText="Yes"
                  icon={null}
                  placement="bottomRight"
                >
                  <button
                    className="text-white-700 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent flex items-center p-0"
                    onClick={() => setPopDeleteConfirmationFor(subcategory.id!)}
                    aria-label="Delete subcategory"
                  >
                    <CloseOutlined className="text-[10px]" />
                  </button>
                </Popconfirm>
              </div>
            ))
          )}
        </div>

        {/* Add Subcategory Input Group */}
        <div>
          <Space.Compact className="w-full">
            <Input
              placeholder="Add new subcategory"
              maxLength={50}
              value={subcategoryInput}
              onChange={(e) => setSubcategoryInput(e.target.value)}
              onPressEnter={() => handleCreateSubcategory(category.id!)}
              className="!border-white-500 rounded-l-xl text-sm"
            />
            <Button
              type="primary"
              loading={isCreating}
              onClick={() => handleCreateSubcategory(category.id!)}
              className="!bg-blue-500 hover:!bg-blue-600 rounded-r-xl !border-blue-500 text-white font-medium px-4"
            >
              Add
            </Button>
          </Space.Compact>
        </div>
      </div>
    </>
  );
}
