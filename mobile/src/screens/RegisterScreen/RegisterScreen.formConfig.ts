import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Укажите корректный адрес почты'),
    password: z.string().min(6, 'Не менее 6 символов'),
    confirm: z.string().min(6, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Пароли должны совпадать',
    path: ['confirm'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
