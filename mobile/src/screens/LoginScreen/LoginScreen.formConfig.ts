import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Укажите корректный адрес почты'),
  password: z.string().min(6, 'Не менее 6 символов'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
