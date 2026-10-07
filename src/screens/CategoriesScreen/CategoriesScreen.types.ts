import type { UseFormReturn } from 'react-hook-form';

import type { Category } from '@/shared/types/entities';

import type { CategoryFormValues } from '@/screens/CategoriesScreen/CategoriesScreen.formConfig';

export type CategoriesScreenProps = {
  embedded?: boolean;
  categories: Category[];
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  editing: Category | null;
  form: UseFormReturn<CategoryFormValues>;
  onOpenCreate: () => void;
  onOpenEdit: (category: Category) => void;
  onCloseDialog: () => void;
  onSubmit: () => void;
  onDelete: (category: Category) => void;
};
