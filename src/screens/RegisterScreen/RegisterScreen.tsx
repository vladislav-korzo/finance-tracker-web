import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/AuthLayout/AuthLayout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { RegisterScreenProps } from '@/screens/RegisterScreen/RegisterScreen.types';

export function RegisterScreen(props: RegisterScreenProps) {
  const { form, onSubmit } = props;

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начните вести финансы за пару минут."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Электронная почта</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Минимум 6 символов"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтверждение пароля</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root?.message ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Создание…' : 'Создать аккаунт'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
