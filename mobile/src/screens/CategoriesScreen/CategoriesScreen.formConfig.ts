import { z } from 'zod';

import { categoryColorSchema, categoryIconSchema } from '@/shared/constants/categoryAppearance';

/**
 * Validation for the create/edit category form. Mirrors the web
 * `CategoriesScreen.formConfig.ts` exactly — the appearance constants
 * (color/icon enums) are shared, so the only screen-local piece is this schema.
 */
export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  type: z.enum(['income', 'expense']),
  icon: categoryIconSchema,
  color: categoryColorSchema,
  /** Месячный лимит трат для расходов; пусто — без лимита. */
  monthlyLimit: z.string().optional(),
});

/**
 * The form's *output* (validated) shape — `icon` is narrowed to a
 * `CategoryIconName` by the schema's type-guard refine.
 */
export type CategoryFormValues = z.output<typeof categoryFormSchema>;

/**
 * The form's *input* shape (what the fields hold before validation). `icon` is
 * a plain `string` here because the type-guard only narrows on output. With
 * `@hookform/resolvers` v5, `useForm` must be parameterised with both this input
 * type and {@link CategoryFormValues} as output so the resolver type lines up —
 * the icon picker therefore reads/writes a plain string and is validated to a
 * known icon on submit.
 */
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
