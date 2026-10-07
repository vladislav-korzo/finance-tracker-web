import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/screens/CategoriesScreen/CategoriesScreen.formConfig';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { CategoriesScreen } from '@/screens/CategoriesScreen/CategoriesScreen';
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  normalizeCategoryColor,
} from '@/shared/constants/categoryAppearance';
import type { Category } from '@/shared/types/entities';
import { useCategoryStore } from '@/shared/store/categoryStore';

export function CategoriesScreenContainer({ embedded = false }: { embedded?: boolean }) {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'expense',
      icon: DEFAULT_CATEGORY_ICON,
      color: DEFAULT_CATEGORY_COLOR,
      monthlyLimit: '',
    },
  });

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const onOpenCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      type: 'expense',
      icon: DEFAULT_CATEGORY_ICON,
      color: DEFAULT_CATEGORY_COLOR,
      monthlyLimit: '',
    });
    setDialogOpen(true);
  };

  const onOpenEdit = (category: Category) => {
    setEditing(category);
    form.reset({
      name: category.name,
      type: category.type,
      icon: (category.icon as CategoryFormValues['icon']) ?? DEFAULT_CATEGORY_ICON,
      color: normalizeCategoryColor(category.color ?? DEFAULT_CATEGORY_COLOR),
      monthlyLimit: category.monthly_limit != null ? String(category.monthly_limit) : '',
    });
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const parsedLimit =
        values.type === 'expense' && values.monthlyLimit && values.monthlyLimit.trim() !== ''
          ? Number(values.monthlyLimit)
          : null;
      const monthlyLimit = parsedLimit != null && parsedLimit > 0 ? parsedLimit : null;
      if (editing) {
        await updateCategory(
          editing.id,
          values.name,
          values.type,
          values.icon,
          values.color,
          monthlyLimit
        );
      } else {
        await createCategory(values.name, values.type, values.icon, values.color, monthlyLimit);
      }
      onCloseDialog();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = async (category: Category) => {
    const ok = await confirm({
      title: 'Удалить категорию?',
      description: `«${category.name}». У связанных транзакций категория станет пустой.`,
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteCategory(category.id);
  };

  return (
    <CategoriesScreen
      embedded={embedded}
      categories={categories}
      loading={loading}
      error={error}
      dialogOpen={dialogOpen}
      editing={editing}
      form={form}
      onOpenCreate={onOpenCreate}
      onOpenEdit={onOpenEdit}
      onCloseDialog={onCloseDialog}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}

export function CategoriesPageContainer() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Категории помечают доход и расход при добавлении транзакций.
      </p>
      <CategoriesScreenContainer embedded />
    </div>
  );
}
