import { z } from 'zod';

/**
 * Savings-goal form schema. Mirrors the web `BudgetScreen.formConfig.ts`.
 *
 * Amounts arrive from RN `<TextInput>` as strings (the shared <FormControl>
 * coerces `field.value` to a string for the text field), so `z.coerce.number()`
 * parses them back to numbers on submit — identical to the web `type="number"`
 * inputs.
 */
export const budgetGoalFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.string().min(1, 'Выберите валюту'),
  targetAmount: z.coerce.number().positive('Сумма должна быть больше нуля'),
  savedAmount: z.coerce.number().min(0, 'Не может быть отрицательной'),
});

export type BudgetGoalFormValues = z.infer<typeof budgetGoalFormSchema>;
